/**
 * Pure planner for a full POS booking edit. Replaces the old delete-then-recreate of every
 * `BookingService` (which wiped all reservation/allocation state on every save) with a diff/merge:
 * existing lines are matched by `BookingService.id` round-tripped through the cart, updated in place,
 * and only genuinely new lines are created / removed lines torn down — and removal of a line that
 * holds committed or dispatched stock is handled safely (release the reservation, or refuse).
 *
 * No DB access here — the route feeds in the existing lines (with each line's resource statuses) and
 * the submitted cart, applies the returned plan inside its transaction, and does the per-row
 * `requiredQuantity` recompute itself using `resolveRequiredQuantity`.
 */

export interface ExistingLineResource {
  id: string;
  status: string;
  quantityType: string;
}

export interface ExistingLine {
  id: string;
  serviceId: string;
  source: 'DIRECT' | 'PACKAGE';
  bookingPackageId: string | null;
  quantity: number;
  unitPrice: number;
  sellingPrice: number;
  cost: number;
  providerType: 'INTERNAL' | 'EXTERNAL';
  resources: ExistingLineResource[];
}

export interface SubmittedLine {
  /** Existing `BookingService.id` when this cart line was hydrated from the booking; absent for a
   * line added during this edit (→ create). */
  bookingServiceId?: string;
  serviceId: string;
  source: 'DIRECT' | 'PACKAGE';
  sourceBookingPackageId?: string;
  packageApplicationKey?: string;
  sourcePackageId?: string;
  sourcePackageName?: string;
  quantity: number;
  unitPrice: number;
  sellingPrice: number;
  cost: number;
  providerType: 'INTERNAL' | 'EXTERNAL';
}

export type LineRemovalPlan = 'DELETE' | 'RELEASE_THEN_DELETE' | 'REFUSE';

export interface SyncPlanUpdate {
  id: string;
  /** Only the commercial fields that actually changed — never context/serviceId/source/status. */
  fields: Partial<Pick<ExistingLine, 'quantity' | 'unitPrice' | 'sellingPrice' | 'cost' | 'providerType'>>;
  /** True when the route may recompute this line's PLANNED, guest/unit-driven resource rows: the
   * line is DIRECT and a driver changed (its own quantity, or the booking's guest count). Always
   * false for PACKAGE lines — they're frozen. */
  recalcResourceRequiredQty: boolean;
}

export interface SyncPlanRemoval {
  id: string;
  plan: LineRemovalPlan;
  /** Resource rows that must be RELEASE'd before the line is deleted (only for RELEASE_THEN_DELETE). */
  releaseResourceIds: string[];
  /** Resource rows that block removal (only for REFUSE). */
  blockingResourceIds: string[];
}

export interface SyncPlan {
  create: SubmittedLine[];
  update: SyncPlanUpdate[];
  remove: SyncPlanRemoval[];
}

/** Statuses that mean the stock has physically left the store — a line holding one of these can't
 * be silently removed. */
const DISPATCHED_STATUSES = new Set(['ISSUED', 'IN_USE', 'RETURNED']);
/** Statuses that hold a live commitment but nothing has been dispatched — releasable. */
const RELEASABLE_STATUSES = new Set(['RESERVED', 'CONFIRMED']);

const EPS = 1e-9;
function numChanged(a: number, b: number): boolean {
  return Math.abs(a - b) > EPS;
}

function planRemoval(line: ExistingLine): SyncPlanRemoval {
  const blockingResourceIds = line.resources.filter((r) => DISPATCHED_STATUSES.has(r.status)).map((r) => r.id);
  if (blockingResourceIds.length > 0) {
    return { id: line.id, plan: 'REFUSE', releaseResourceIds: [], blockingResourceIds };
  }
  const releaseResourceIds = line.resources.filter((r) => RELEASABLE_STATUSES.has(r.status)).map((r) => r.id);
  if (releaseResourceIds.length > 0) {
    return { id: line.id, plan: 'RELEASE_THEN_DELETE', releaseResourceIds, blockingResourceIds: [] };
  }
  return { id: line.id, plan: 'DELETE', releaseResourceIds: [], blockingResourceIds: [] };
}

export function planBookingServiceSync(
  existing: ExistingLine[],
  submitted: SubmittedLine[],
  ctx: { guestCountChanged: boolean }
): SyncPlan {
  const existingById = new Map(existing.map((e) => [e.id, e]));
  const matched = new Set<string>();

  const create: SubmittedLine[] = [];
  const update: SyncPlanUpdate[] = [];

  for (const line of submitted) {
    const match = line.bookingServiceId ? existingById.get(line.bookingServiceId) : undefined;
    if (!match) {
      // No id, or an id we don't recognize (stale client) → treat as a brand-new line. Never
      // fuzzy-match on serviceId: multiple DIRECT lines of the same service are legal.
      create.push(line);
      continue;
    }
    matched.add(match.id);

    const fields: SyncPlanUpdate['fields'] = {};
    if (numChanged(match.quantity, line.quantity)) fields.quantity = line.quantity;
    if (numChanged(match.unitPrice, line.unitPrice)) fields.unitPrice = line.unitPrice;
    if (numChanged(match.sellingPrice, line.sellingPrice)) fields.sellingPrice = line.sellingPrice;
    if (numChanged(match.cost, line.cost)) fields.cost = line.cost;
    if (match.providerType !== line.providerType) fields.providerType = line.providerType;

    const quantityChanged = fields.quantity !== undefined;
    const recalcResourceRequiredQty =
      match.source === 'DIRECT' && (quantityChanged || ctx.guestCountChanged);

    update.push({ id: match.id, fields, recalcResourceRequiredQty });
  }

  const remove = existing.filter((e) => !matched.has(e.id)).map(planRemoval);

  return { create, update, remove };
}
