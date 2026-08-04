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
 * Throws `BookingConflictError` if another booking already occupies the Space on the same
 * calendar day. There's only one Space per tenant, so "same day" is the whole conflict rule.
 * Bookings that are CANCELLED or already WAITING_LIST don't block the date.
 */
export async function assertNoBookingConflict(
  tx: Prisma.TransactionClient,
  eventDate: Date,
  excludeBookingId?: string
): Promise<void> {
  const dayStart = new Date(eventDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const conflict = await tx.booking.findFirst({
    where: {
      eventDate: { gte: dayStart, lt: dayEnd },
      status: { notIn: NON_BLOCKING_STATUSES },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
    include: { client: true },
  });

  if (conflict) {
    throw new BookingConflictError(
      `This date is already booked (${conflict.client?.name || 'another client'}). Choose a different date, or submit this booking to the waiting list.`
    );
  }
}
