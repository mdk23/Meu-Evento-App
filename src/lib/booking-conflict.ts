import { BookingStatus, Prisma } from '@prisma/client';

export class BookingConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookingConflictError';
  }
}

/** Statuses that don't occupy the Venue's calendar for conflict-checking purposes. */
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
 * Throws `BookingConflictError` if another booking already occupies `venueId` during
 * `[startAt, endAt)`. Overlap rule: `existing.startAt < endAt AND existing.endAt > startAt`
 * (see `bookingsOverlap`). Bookings that are CANCELLED or already WAITING_LIST don't block the window.
 */
export async function assertNoBookingConflict(
  tx: Prisma.TransactionClient,
  venueId: string,
  startAt: Date,
  endAt: Date,
  excludeBookingId?: string
): Promise<void> {
  const conflict = await tx.booking.findFirst({
    where: {
      venueId,
      startAt: { lt: endAt },
      endAt: { gt: startAt },
      status: { notIn: NON_BLOCKING_STATUSES },
      ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
    },
    include: { client: true },
  });

  if (conflict) {
    throw new BookingConflictError(
      `This venue is already booked during that time (${conflict.client?.name || 'another client'}). Choose a different date/time, or submit this booking to the waiting list.`
    );
  }
}

/**
 * True when `error` is the database rejecting an insert/update via `bookings_no_venue_overlap` (the
 * EXCLUDE constraint backing this same rule at the engine level — see migration
 * `20260904000000_add_booking_venue_overlap_guard`). `assertNoBookingConflict`'s check-then-insert
 * is a normal READ COMMITTED transaction, so two near-simultaneous requests can both pass it before
 * either commits; the constraint is what actually stops the second one, surfaced by Prisma as a
 * generic P2004 "constraint failed" error. Route handlers use this to turn that rare race into the
 * same friendly 409 `assertNoBookingConflict` gives the common case, instead of a raw 500.
 */
export function isVenueOverlapConstraintError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const e = error as { code?: unknown; meta?: { database_error?: unknown } };
  return e.code === 'P2004' && typeof e.meta?.database_error === 'string' && e.meta.database_error.includes('bookings_no_venue_overlap');
}
