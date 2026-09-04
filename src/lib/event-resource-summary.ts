import { ResourceAllocationStatus } from '@prisma/client';
import { ACTIVE_RESOURCE_STATUSES } from './resource-conflict';

export interface ResourceForSummary {
  bookingServiceId: string;
  inventoryItemId: string | null;
  itemNameSnapshot: string | null;
  /** The requirement's `InventoryType` name when this row is still an unresolved type-based
   * requirement (Mode B) — used to label and group it ("Any Round Table"). Null for a resolved
   * item row. */
  typeName: string | null;
  requiredQuantity: number;
  reservedQuantity: number;
  status: ResourceAllocationStatus;
  reusedFromResourceId: string | null;
  /** This row's own movement ledger, used to derive returned/damaged/lost totals. Optional so the
   * Event detail route (which doesn't need those columns) can omit it. */
  transactions?: Array<{ type: string; quantity: number }>;
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
  /** Units returned after use (Σ RETURN) and units that didn't come back intact (Σ DAMAGE + Σ LOSS),
   * across this group's ledger. */
  returned: number;
  missing: number;
  sources: string[];
  status: ResourceRowStatus;
}

/** @deprecated Use `ResourceSummaryRow` — the summary is booking-scoped, not Event-specific. */
export type ResourceSummaryRow = EventResourceSummaryRow;

/**
 * The event-wide "operational loading list" — every resource requirement across every service on
 * the event (Venue, Event, direct, or package-sourced — this doesn't care which), grouped by the
 * physical item it targets, showing Required/Provided/Additional/Reserved/Available/Source/Status
 * in one place. "Provided" is each row's own `reservedQuantity` (however it got covered — a direct
 * reservation or reusing another row's stock); "Reserved" is the *fresh* physical commitment against
 * the item tenant-wide, which excludes reused rows so the same stock isn't counted twice. Pure — no
 * DB access — the caller supplies the booking- or event-scoped resources and a tenant-wide
 * availability lookup already fetched. Works identically for a VENUE booking (no Event) and an
 * EVENT booking — there is no `eventId` anywhere in here.
 */
export function computeResourceSummary(
  resources: ResourceForSummary[],
  availableByItemId: Record<string, number>,
  serviceLabels: Record<string, string>
): EventResourceSummaryRow[] {
  const groups = new Map<string, { itemId: string | null; label: string; rows: ResourceForSummary[] }>();

  for (const r of resources) {
    const key = r.inventoryItemId || (r.typeName ? `type:${r.typeName}` : 'unresolved');
    if (!groups.has(key)) {
      groups.set(key, {
        itemId: r.inventoryItemId,
        label: r.itemNameSnapshot || (r.typeName ? `Any ${r.typeName}` : 'Unresolved item'),
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

    const ledger = group.rows.flatMap((r) => r.transactions ?? []);
    const returned = ledger.filter((t) => t.type === 'RETURN').reduce((sum, t) => sum + t.quantity, 0);
    const missing = ledger.filter((t) => t.type === 'DAMAGE' || t.type === 'LOSS').reduce((sum, t) => sum + t.quantity, 0);

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

    rows.push({ key, itemLabel: group.label, required, provided, additional, reserved, available, returned, missing, sources, status });
  }

  return rows;
}

/** @deprecated Renamed to `computeResourceSummary` (the summary is not Event-specific). Kept as an
 * alias so existing Event callers don't break. */
export const computeEventResourceSummary = computeResourceSummary;
