import { ReservationStatus } from '@prisma/client';
import { ACTIVE_RESERVATION_STATUSES } from './resource-conflict';

export interface RequirementForSummary {
  bookingServiceId: string;
  inventoryItemId: string | null;
  itemNameSnapshot: string | null;
  categoryName: string | null;
  requiredQuantity: number;
  providedQuantity: number;
}

export interface ReservationForSummary {
  inventoryItemId: string;
  quantity: number;
  status: ReservationStatus;
}

export type ResourceRowStatus = 'FULFILLED' | 'PENDING' | 'SHORTAGE' | 'UNRESOLVED';

export interface EventResourceSummaryRow {
  key: string;
  itemLabel: string;
  required: number;
  provided: number;
  additional: number;
  reserved: number;
  /** Tenant-wide available stock for this item, or null when the row is still an unresolved
   * category (nothing concrete to check stock for yet). */
  available: number | null;
  sources: string[];
  status: ResourceRowStatus;
}

/**
 * The event-wide "operational loading list" (§24/Phase 18) — every resource requirement across
 * every service on the event (Space, Event, direct, or package-sourced — this doesn't care which),
 * grouped by the physical item it targets, showing Required/Provided/Additional/Reserved/
 * Available/Source/Status in one place. Pure — no DB access — the caller supplies the event-scoped
 * requirements/reservations and a tenant-wide availability lookup already fetched.
 */
export function computeEventResourceSummary(
  requirements: RequirementForSummary[],
  reservations: ReservationForSummary[],
  availableByItemId: Record<string, number>,
  serviceLabels: Record<string, string>
): EventResourceSummaryRow[] {
  const groups = new Map<string, { itemId: string | null; label: string; requirements: RequirementForSummary[] }>();

  for (const req of requirements) {
    const key = req.inventoryItemId || (req.categoryName ? `category:${req.categoryName}` : 'unresolved');
    if (!groups.has(key)) {
      groups.set(key, {
        itemId: req.inventoryItemId,
        label: req.itemNameSnapshot || (req.categoryName ? `Any ${req.categoryName}` : 'Unresolved item'),
        requirements: [],
      });
    }
    groups.get(key)!.requirements.push(req);
  }

  const rows: EventResourceSummaryRow[] = [];
  for (const [key, group] of groups) {
    const required = group.requirements.reduce((sum, r) => sum + r.requiredQuantity, 0);
    const provided = group.requirements.reduce((sum, r) => sum + r.providedQuantity, 0);
    const additional = Math.max(required - provided, 0);

    const reserved = group.itemId
      ? reservations
          .filter((r) => r.inventoryItemId === group.itemId && ACTIVE_RESERVATION_STATUSES.includes(r.status))
          .reduce((sum, r) => sum + r.quantity, 0)
      : 0;

    const available = group.itemId ? availableByItemId[group.itemId] ?? 0 : null;

    const sources = Array.from(new Set(group.requirements.map((r) => serviceLabels[r.bookingServiceId] || 'Service')));

    let status: ResourceRowStatus;
    if (!group.itemId) {
      status = 'UNRESOLVED';
    } else if (additional === 0) {
      status = 'FULFILLED';
    } else if (available !== null && available >= additional) {
      status = 'PENDING';
    } else {
      status = 'SHORTAGE';
    }

    rows.push({ key, itemLabel: group.label, required, provided, additional, reserved, available, sources, status });
  }

  return rows;
}
