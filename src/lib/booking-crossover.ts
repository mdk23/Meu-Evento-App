import { Prisma, BookingContext, EventStatus } from '@prisma/client';

type TransactionClient = Prisma.TransactionClient;

export class InvalidCrossoverError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidCrossoverError';
  }
}

/**
 * Promotes a SPACE booking into an EVENT booking. The contract, payments and reserved stock carry
 * across untouched — nothing about `PaymentPlan`/`ScheduledPayment`/`PaymentTransaction` changes,
 * since they're keyed off `bookingId`, which never changes. `Event.bookingId` is unique, so a
 * booking that was previously demoted (its Event kept, not deleted) reactivates that same Event
 * rather than creating a duplicate — this makes promote idempotent-safe across repeated
 * promote/demote cycles. Every commercial-only `BookingService` line added while this was a Space
 * booking (`eventId: null`) gets linked to the (re)activated Event, so it immediately shows up as
 * the event's starting service list.
 */
export async function promoteBookingToEvent(
  tx: TransactionClient,
  bookingId: string,
  actor = 'Staff'
) {
  const booking = await tx.booking.findUnique({
    where: { id: bookingId },
    include: { client: true, event: true },
  });
  if (!booking) throw new InvalidCrossoverError('Booking not found.');
  if (booking.context !== BookingContext.SPACE) {
    throw new InvalidCrossoverError('Only a Venue booking can be promoted to an Event.');
  }

  const reusedExistingEvent = !!booking.event;
  const event =
    booking.event ??
    (await tx.event.create({
      data: {
        bookingId: booking.id,
        name: `${booking.client.name} Event`,
        date: booking.eventDate,
        guestCount: booking.guestCount,
        status: EventStatus.PLANNING,
      },
    }));

  await tx.bookingService.updateMany({
    where: { bookingId: booking.id, eventId: null },
    data: { eventId: event.id },
  });

  await tx.booking.update({ where: { id: booking.id }, data: { context: BookingContext.EVENT } });

  await tx.auditLog.create({
    data: {
      tenantId: booking.tenantId,
      entity: 'Booking',
      entityId: booking.id,
      action: 'PROMOTE',
      detail: reusedExistingEvent
        ? 'Promoted to Event workspace (reactivated the existing Event record from a prior demote).'
        : 'Promoted to Event workspace (new Event record created).',
      actor,
    },
  });

  return event;
}

/**
 * Demotes an EVENT booking back to a SPACE booking. The Event record is kept, not deleted — its
 * `BookingService`/task/staff/inventory-reservation history stays exactly as it was, simply no
 * longer the booking's active workspace. Nothing about the contract, payments, or reserved stock
 * changes; `context` is the only field this touches on `Booking`.
 */
export async function demoteBookingToVenue(
  tx: TransactionClient,
  bookingId: string,
  actor = 'Staff'
) {
  const booking = await tx.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw new InvalidCrossoverError('Booking not found.');
  if (booking.context !== BookingContext.EVENT) {
    throw new InvalidCrossoverError('Only an Event booking can be demoted to Venue.');
  }

  await tx.booking.update({ where: { id: bookingId }, data: { context: BookingContext.SPACE } });

  await tx.auditLog.create({
    data: {
      tenantId: booking.tenantId,
      entity: 'Booking',
      entityId: booking.id,
      action: 'DEMOTE',
      detail: 'Demoted to Venue workspace — Event record kept, not deleted, so it can be reactivated by a later promote.',
      actor,
    },
  });
}
