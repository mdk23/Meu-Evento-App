import { ResourceAllocationStatus } from '@prisma/client';
import { ACTIVE_RESOURCE_STATUSES } from './resource-conflict';

export interface ResourceForSummary {
  bookingServiceId: string;
  inventoryItemId: string | null;
  itemNameSnapshot: string | null;
  categoryName: string | null;
  requiredQuantity: number;
  reservedQuantity: number;
  status: ResourceAllocationStatus;
  reusedFromResourceId: string | null;
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
 * The event-wide "operational loading list" — every resource requirement across every service on
 * the event (Venue, Event, direct, or package-sourced — this doesn't care which), grouped by the
 * physical item it targets, showing Required/Provided/Additional/Reserved/Available/Source/Status
 * in one place. "Provided" is each row's own `reservedQuantity` (however it got covered — a direct
 * reservation or reusing another row's stock); "Reserved" is the *fresh* physical commitment against
 * the item tenant-wide, which excludes reused rows so the same stock isn't counted twice. Pure — no
 * DB access — the caller supplies the event-scoped resources and a tenant-wide availability lookup
 * already fetched.
 */
export function computeEventResourceSummary(
  resources: ResourceForSummary[],
  availableByItemId: Record<string, number>,
  serviceLabels: Record<string, string>
): EventResourceSummaryRow[] {
  const groups = new Map<string, { itemId: string | null; label: string; rows: ResourceForSummary[] }>();

  for (const r of resources) {
    const key = r.inventoryItemId || (r.categoryName ? `category:${r.categoryName}` : 'unresolved');
    if (!groups.has(key)) {
      groups.set(key, {
        itemId: r.inventoryItemId,
        label: r.itemNameSnapshot || (r.categoryName ? `Any ${r.categoryName}` : 'Unresolved item'),
        rows: [],
      });
    }
    groups.get(key)!.rows.push(r);
  }

  const rows: EventResourceSummaryRow[] = [];
  for (const [key, group] of groups) {
    const required = group.rows.reduce((sum, r) => sum + r.requiredQuantity, 0);
    const provided = group.rows.reduce((sum, r) => sum + r.reservedQuantity, 0);
    const additional = Math.max(required - provided, 0);

    const reserved = group.rows
      .filter((r) => ACTIVE_RESOURCE_STATUSES.includes(r.status) && r.reusedFromResourceId === null)
      .reduce((sum, r) => sum + r.reservedQuantity, 0);

    const available = group.itemId ? availableByItemId[group.itemId] ?? 0 : null;

    const sources = Array.from(new Set(group.rows.map((r) => serviceLabels[r.bookingServiceId] || 'Service')));

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
