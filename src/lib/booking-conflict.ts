import { BookingStatus, Prisma } from '@prisma/client';

export class BookingConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookingConflictError';
  }
}

/** Statuses that don't occupy the Space's calendar for conflict-checking purposes. */
const NON_BLOCKING_STATUSES: BookingStatus[] = [BookingStatus.CANCELLED, BookingStatus.WAITING_LIST];

/**
 * Throws `BookingConflictError` if another booking already occupies `spaceId` during
 * `[startAt, endAt)`. Overlap rule: `existing.startAt < endAt AND existing.endAt > startAt`.
 * Bookings that are CANCELLED or already WAITING_LIST don't block the window.
 */
export async function assertNoBookingConflict(
  tx: Prisma.TransactionClient,
  spaceId: string,
  startAt: Date,
  endAt: Date,
  excludeBookingId?: string
): Promise<void> {
  const conflict = await tx.booking.findFirst({
    where: {
      spaceId,
      startAt: { lt: endAt },
      endAt: { gt: startAt },
      status: { notIn: NON_BLOCKING_STATUSES },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
    include: { client: true },
  });

  if (conflict) {
    throw new BookingConflictError(
      `This space is already booked during that time (${conflict.client?.name || 'another client'}). Choose a different date/time, or submit this booking to the waiting list.`
    );
  }
}
