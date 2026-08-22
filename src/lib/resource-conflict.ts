import { ExecutionType, Prisma } from '@prisma/client';

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
 * reservation. Must run inside the same transaction as the reservation's `create`.
 */
export async function assertInventoryAvailable(
  tx: Prisma.TransactionClient,
  inventoryItemId: string,
  quantity: number,
  startAt: Date,
  endAt: Date,
  excludeReservationId?: string
): Promise<void> {
  const item = await tx.inventoryItem.findUnique({ where: { id: inventoryItemId } });
  if (!item) {
    throw new InventoryConflictError('Inventory item not found.');
  }

  const overlapping = await tx.inventoryReservation.findMany({
    where: {
      inventoryItemId,
      startAt: { lt: endAt },
      endAt: { gt: startAt },
      ...(excludeReservationId ? { id: { not: excludeReservationId } } : {}),
    },
  });

  const alreadyReserved = overlapping.reduce((sum, r) => sum + r.quantity, 0);
  if (alreadyReserved + quantity > item.quantity) {
    const available = item.quantity - alreadyReserved;
    throw new InventoryConflictError(
      `Not enough "${item.name}" available for this time window: requested ${quantity}, only ${Math.max(available, 0)} of ${item.quantity} free.`
    );
  }
}
