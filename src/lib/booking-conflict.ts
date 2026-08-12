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
 * Pure overlap predicate for two time ranges — the single source of truth for "do these bookings
 * occupy the same time." Used both by the server-side conflict check below and by client-side
 * calendar/timeline code (e.g. the day-detail view's overlap column layout).
 */
export function bookingsOverlap(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date): boolean {
  return aStart < bEnd && bStart < aEnd;
}

/**
 * Throws `BookingConflictError` if another booking already occupies `spaceId` during
 * `[startAt, endAt)`. Overlap rule: `existing.startAt < endAt AND existing.endAt > startAt`
 * (see `bookingsOverlap`). Bookings that are CANCELLED or already WAITING_LIST don't block the window.
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
