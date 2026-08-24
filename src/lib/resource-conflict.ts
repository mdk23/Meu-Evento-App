import { ExecutionType, Prisma, ResourceAllocationStatus } from '@prisma/client';

/** Resource statuses that still count as an active commitment against available stock. */
export const ACTIVE_RESOURCE_STATUSES: ResourceAllocationStatus[] = ['RESERVED', 'IN_USE'];

/** Default reservation span for staff/inventory when no explicit time range is given — the whole calendar day of the event. */
export function fullDaySpan(date: Date): { startAt: Date; endAt: Date } {
  const startAt = new Date(date);
  startAt.setHours(0, 0, 0, 0);
  const endAt = new Date(date);
  endAt.setHours(23, 59, 59, 999);
  return { startAt, endAt };
}

export class StaffConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'StaffConflictError';
  }
}

export class InventoryConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InventoryConflictError';
  }
}

export class ExternalProviderReservationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ExternalProviderReservationError';
  }
}

/**
 * Only INTERNAL service lines may hold internal inventory — an EXTERNAL supplier's work order has
 * no claim on the venue's own stock, since the supplier brings their own. Must be called before
 * any `InventoryReservation` write, not just gated in the UI, so this rule can't be bypassed by
 * calling the API directly.
 */
export function assertInternalProvider(providerType: ExecutionType, serviceName?: string): void {
  if (providerType !== ExecutionType.INTERNAL) {
    throw new ExternalProviderReservationError(
      `${serviceName || 'This service'} is EXTERNAL — only INTERNAL service lines can reserve venue inventory.`
    );
  }
}

/**
 * Throws `StaffConflictError` if `staffId` already has an overlapping assignment in the
 * given time range. Overlap rule per spec: `existing.startAt < requestedEnd AND existing.endAt > requestedStart`.
 * Must run inside the same transaction as the assignment's `create` to avoid a race between
 * the check and the write.
 */
export async function assertStaffAvailable(
  tx: Prisma.TransactionClient,
  staffId: string,
  startAt: Date,
  endAt: Date,
  excludeAssignmentId?: string
): Promise<void> {
  const conflict = await tx.bookingServiceStaff.findFirst({
    where: {
      staffId,
      startAt: { lt: endAt },
      endAt: { gt: startAt },
      ...(excludeAssignmentId ? { id: { not: excludeAssignmentId } } : {}),
    },
    include: { bookingService: { include: { service: true } } },
  });

  if (conflict) {
    throw new StaffConflictError(
      `${conflict.staffNameSnapshot} is already assigned to "${conflict.bookingService.service?.name || 'another work order'}" during this time window.`
    );
  }
}

/**
 * Throws `InventoryConflictError` if reserving `quantity` of `inventoryItemId` in the given
 * time range would exceed the item's total stock, once summed against every other overlapping
 * *active* resource (`RESERVED`/`IN_USE` — `PLANNED`/`RETURNED`/`RELEASED` no longer hold stock and
 * are excluded). A row whose `reusedFromResourceId` is set is also excluded from this sum — it's a
 * claim against another row's commitment, not a fresh one, so counting it would double-count the
 * same physical stock. Must run inside the same transaction as the write that reserves it.
 *
 * Row-locks the `InventoryItem` first (`SELECT ... FOR UPDATE`) so two concurrent requests for
 * the last few units of the same item serialize instead of both reading "available" and both
 * succeeding — without this, two transactions can each read the pre-reservation count before
 * either commits.
 */
export async function assertInventoryAvailable(
  tx: Prisma.TransactionClient,
  inventoryItemId: string,
  quantity: number,
  startAt: Date,
  endAt: Date,
  excludeResourceId?: string
): Promise<void> {
  const locked = await tx.$queryRaw<{ id: string; name: string; totalQuantity: number }[]>`
    SELECT "id", "name", "totalQuantity" FROM "inventory_items" WHERE "id" = ${inventoryItemId} FOR UPDATE
  `;
  const item = locked[0];
  if (!item) {
    throw new InventoryConflictError('Inventory item not found.');
  }

  const overlapping = await tx.bookingServiceResource.findMany({
    where: {
      inventoryItemId,
      status: { in: ACTIVE_RESOURCE_STATUSES },
      reusedFromResourceId: null,
      startAt: { lt: endAt },
      endAt: { gt: startAt },
      ...(excludeResourceId ? { id: { not: excludeResourceId } } : {}),
    },
  });

  const alreadyReserved = overlapping.reduce((sum, r) => sum.plus(r.reservedQuantity), new Prisma.Decimal(0));
  const requested = new Prisma.Decimal(quantity);
  if (alreadyReserved.plus(requested).greaterThan(item.totalQuantity)) {
    const available = new Prisma.Decimal(item.totalQuantity).minus(alreadyReserved);
    throw new InventoryConflictError(
      `Not enough "${item.name}" available for this time window: requested ${quantity}, only ${Prisma.Decimal.max(available, 0)} of ${item.totalQuantity} free.`
    );
  }
}

/**
 * Pure function behind `assertReuseQuantityAvailable` below — a resource's committed stock can be
 * reused by any number of other `BookingServiceResource` rows, but their combined reuse can never
 * exceed the target row's own `reservedQuantity` (§7/§29). Split out so the worked examples from
 * the spec can be unit-tested without a database.
 */
export function computeReuseAllocation(
  reservedQuantity: number,
  alreadyReusedSum: number,
  requestedReuse: number
): { allowed: boolean; availableToReuse: number } {
  const availableToReuse = Math.max(reservedQuantity - alreadyReusedSum, 0);
  return { allowed: requestedReuse <= availableToReuse, availableToReuse };
}

/**
 * Throws `InventoryConflictError` if reusing `requestedQuantity` of `targetResourceId` would exceed
 * how much of that row's `reservedQuantity` isn't already claimed by other rows reusing it.
 * Row-locks the target `BookingServiceResource` first, same race-safety reasoning as
 * `assertInventoryAvailable`. Must run inside the same transaction as the write that sets
 * `reusedFromResourceId`.
 *
 * Sums every row's claim on this target, *including the caller's own* prior claim if any — the
 * caller (`POST .../inventory/reuse`) increments `reservedQuantity` rather than replacing it, so a
 * second reuse call against the same pair must be capped by what's left after that same row's
 * earlier claim too, not just everyone else's.
 */
export async function assertReuseQuantityAvailable(
  tx: Prisma.TransactionClient,
  targetResourceId: string,
  requestedQuantity: number
): Promise<void> {
  const locked = await tx.$queryRaw<{ id: string; reservedQuantity: Prisma.Decimal }[]>`
    SELECT "id", "reservedQuantity" FROM "booking_service_resources" WHERE "id" = ${targetResourceId} FOR UPDATE
  `;
  const target = locked[0];
  if (!target) {
    throw new InventoryConflictError('Resource not found.');
  }

  const existingReuse = await tx.bookingServiceResource.findMany({
    where: { reusedFromResourceId: targetResourceId },
  });
  const alreadyReused = existingReuse.reduce((sum, r) => sum.plus(r.reservedQuantity), new Prisma.Decimal(0));

  const { allowed, availableToReuse } = computeReuseAllocation(
    Number(target.reservedQuantity),
    Number(alreadyReused),
    requestedQuantity
  );
  if (!allowed) {
    throw new InventoryConflictError(
      `Only ${availableToReuse} of this resource's ${target.reservedQuantity} reserved units are still available to reuse (requested ${requestedQuantity}).`
    );
  }
}
