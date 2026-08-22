import { NextResponse } from 'next/server';
import { prisma, prismaTransaction } from '@/lib/prisma';
import { BookingStatus, EventStatus, BookingType, Prisma } from '@prisma/client';
import { assertNoBookingConflict, BookingConflictError } from '@/lib/booking-conflict';
import { assertCapacityForConfirmation, CapacityExceededError } from '@/lib/capacity';
import { serializeDecimals } from '@/lib/money';
import { deriveEventStatus } from '@/lib/event-progress';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const {
      status,
      eventDate,
      startAt,
      endAt,
      guestCount,
      notes,
      title,
      clientId,
      clientName,
      clientPhone,
      clientEmail,
      bookingType,
      discount,
      depositDueDate,
      eventStatus,
      eventStatusReason,
      paymentAction,
      isEdit,
      selectedServices,
      capacityOverrideReason,
    } = body;

    // Event status is normally derived from service progress (Phase 10) — a manual override is
    // still allowed, but only with a reason on file, since it gets logged to the audit trail below.
    if (eventStatus && Object.values(EventStatus).includes(eventStatus as EventStatus) && !String(eventStatusReason || '').trim()) {
      return NextResponse.json({ error: 'A reason is required to manually override the event status.' }, { status: 400 });
    }

    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      include: { event: true, client: true, space: true },
    });

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // 1. Prepare update data for Booking
    const updateData: Prisma.BookingUpdateInput = {};
    let resolvedStatus: BookingStatus = existingBooking.status;
    if (status && Object.values(BookingStatus).includes(status as BookingStatus)) {
      updateData.status = status;
      resolvedStatus = status as BookingStatus;
    }
    if (eventDate) {
      updateData.eventDate = new Date(eventDate);
    }
    if (startAt) {
      updateData.startAt = new Date(startAt);
    }
    if (endAt) {
      updateData.endAt = new Date(endAt);
    }
    if (guestCount !== undefined) {
      updateData.guestCount = parseInt(guestCount, 10);
    }
    if (capacityOverrideReason !== undefined) {
      updateData.capacityOverrideReason = capacityOverrideReason || null;
    }
    if (notes !== undefined) {
      updateData.notes = notes;
    }
    if (clientId) {
      updateData.client = { connect: { id: clientId } };
    }
    if (bookingType && Object.values(BookingType).includes(bookingType as BookingType)) {
      updateData.bookingType = bookingType;
    }
    if (discount !== undefined) {
      updateData.discount = parseFloat(discount);
    }
    if (depositDueDate) {
      updateData.depositDueDate = new Date(depositDueDate);
    }

    // Handle Payment Actions
    if (paymentAction === 'MARK_DEPOSIT_PAID') {
      updateData.status = BookingStatus.CONFIRMED;
      resolvedStatus = BookingStatus.CONFIRMED;
    } else if (paymentAction === 'MARK_ALL_PAID') {
      updateData.status = BookingStatus.CONFIRMED;
      resolvedStatus = BookingStatus.CONFIRMED;
    } else if (paymentAction === 'COMPLETE_FINANCIAL_CLOSURE') {
      updateData.status = BookingStatus.COMPLETED;
      resolvedStatus = BookingStatus.COMPLETED;
    }

    // Capacity is a soft warning below CONFIRMED — only (re)confirming blocks without an override reason.
    if (resolvedStatus === BookingStatus.CONFIRMED) {
      const resolvedGuestCount = guestCount !== undefined ? parseInt(guestCount, 10) : existingBooking.guestCount;
      const resolvedOverrideReason = capacityOverrideReason !== undefined ? capacityOverrideReason : existingBooking.capacityOverrideReason;
      assertCapacityForConfirmation(resolvedGuestCount, existingBooking.space.capacity, resolvedOverrideReason);
    }

    // Update booking + client + event + services + payment schedule atomically —
    // the service/payment sync below deletes-then-recreates rows, so a partial failure
    // must not leave the booking with a wiped-but-not-rebuilt services or payment schedule.
    const updatedBooking = await prismaTransaction.$transaction(async (tx) => {
      // Only WAITING_LIST/CANCELLED bookings are allowed to overlap an already-booked window.
      // Re-check whenever the resulting status is a blocking one, whether it's because the
      // time range is changing or because a WAITING_LIST/CANCELLED booking is being promoted
      // back to active on its existing window. Excluding this booking's own id makes the
      // check a safe no-op when nothing relevant changed.
      if (resolvedStatus !== BookingStatus.CANCELLED && resolvedStatus !== BookingStatus.WAITING_LIST) {
        const startAtToCheck = startAt ? new Date(startAt) : existingBooking.startAt;
        const endAtToCheck = endAt ? new Date(endAt) : existingBooking.endAt;
        await assertNoBookingConflict(tx, existingBooking.spaceId, startAtToCheck, endAtToCheck, id);
      }

      // Update Client info if provided
      if (existingBooking.clientId && (clientName || clientPhone !== undefined || clientEmail !== undefined)) {
        await tx.client.update({
          where: { id: existingBooking.clientId },
          data: {
            ...(clientName ? { name: clientName } : {}),
            ...(clientPhone !== undefined ? { phone: clientPhone } : {}),
            ...(clientEmail !== undefined ? { email: clientEmail } : {}),
          },
        });
      }

      // Re-fetched with full includes after every sync below settles — this call only needs to
      // persist the field-level changes prepared above.
      await tx.booking.update({ where: { id }, data: updateData });

      // Payment status is never set directly here — it's owned entirely by the payment allocation
      // engine (src/lib/payment-allocation.ts), recalculated from real PaymentTransaction rows via
      // POST/DELETE /api/bookings/[id]/payments and PUT .../payments/schedule. `paymentAction` above
      // only moves the booking's own lifecycle status (RESERVED/CONFIRMED/COMPLETED) — booking
      // lifecycle and payment lifecycle are deliberately separate concepts and must not be conflated.

      // 3. Sync Event details and status
      if (existingBooking.event) {
        const eventUpdateData: Prisma.EventUpdateInput = {};

        if (title) {
          eventUpdateData.name = title;
        }
        if (eventDate) {
          eventUpdateData.date = new Date(eventDate);
        }
        if (guestCount !== undefined) {
          eventUpdateData.guestCount = parseInt(guestCount, 10);
        }

        // Manual status override (audited) — payment actions no longer force Event.status
        // directly; execution status is derived from service progress (Phase 10), recalculated
        // automatically whenever a service's status changes (see events/[id]/services route).
        const isManualStatusOverride = eventStatus && Object.values(EventStatus).includes(eventStatus as EventStatus);
        if (isManualStatusOverride) {
          eventUpdateData.status = eventStatus;
        }

        await tx.event.update({
          where: { id: existingBooking.event.id },
          data: eventUpdateData,
        });

        if (isManualStatusOverride) {
          await tx.eventStatusOverride.create({
            data: {
              eventId: existingBooking.event.id,
              previousStatus: existingBooking.event.status,
              newStatus: eventStatus as EventStatus,
              reason: String(eventStatusReason).trim(),
              overriddenBy: 'Staff',
            },
          });
        }
      }

      // Sync service lines if provided (Full POS Edit) — keyed off `bookingId`, which is always
      // set regardless of whether this booking has an Event, so this applies equally to SPACE and
      // EVENT bookings (a SPACE booking's lines are commercial-only: no `eventId`).
      if (isEdit && selectedServices && Array.isArray(selectedServices)) {
        // Delete old services
        await tx.bookingService.deleteMany({
          where: { bookingId: existingBooking.id }
        });

        const tenantId = existingBooking.tenantId || (await tx.tenant.findFirst())?.id;

        for (const item of selectedServices) {
          let catalogServiceId = item.serviceId;

          if (!catalogServiceId && tenantId) {
            const existingService = await tx.service.findFirst({
              where: { name: item.name, tenantId },
            });
            if (existingService) {
              catalogServiceId = existingService.id;
            } else {
              const newService = await tx.service.create({
                data: {
                  tenantId,
                  name: item.name,
                  category: item.category || 'GERAL',
                  defaultProviderType: item.providerType === 'EXTERNAL' ? 'EXTERNAL' : 'INTERNAL',
                  priceType: item.priceType || 'FIXED',
                  defaultPrice: item.price || 0,
                },
              });
              catalogServiceId = newService.id;
            }
          }

          if (catalogServiceId) {
            await tx.bookingService.create({
              data: {
                bookingId: existingBooking.id,
                // Not just `existingBooking.event?.id` — a demoted booking keeps its Event record
                // (kept, not deleted) while `context` flips to SPACE, so event-existence alone no
                // longer implies "this booking is currently in the Event workspace."
                eventId: existingBooking.context === 'EVENT' && existingBooking.event ? existingBooking.event.id : null,
                serviceId: catalogServiceId,
                serviceNameSnapshot: item.name || null,
                providerType: item.providerType === 'EXTERNAL' ? 'EXTERNAL' : 'INTERNAL',
                sellingPrice: item.totalPrice || item.price || 0,
                cost: item.cost || ((item.totalPrice || item.price || 0) * 0.4),
                status: 'PLANNING',
              },
            });
          }
        }

        // The services above were just wiped and recreated at fresh PLANNING status, so the
        // event's derived status must be recalculated from that reality — this intentionally
        // supersedes any eventStatus override passed in this same request. No-op for a SPACE
        // booking, which has no Event to recalculate.
        if (existingBooking.event) {
          const freshServices = await tx.bookingService.findMany({
            where: { eventId: existingBooking.event.id },
            select: { sellingPrice: true, status: true },
          });
          await tx.event.update({
            where: { id: existingBooking.event.id },
            data: { status: deriveEventStatus(freshServices) },
          });
        }
      }

      // Payment schedule edits go exclusively through PUT /api/bookings/[id]/payments/schedule
      // (the dedicated milestone editor) — this route no longer touches ScheduledPayment rows
      // beyond the invoice-status/payment-action handling above.

      // `updatedBooking` above was read before the event status/service-sync logic ran, so its
      // `bookingServices` (and nested `event.bookingServices`) can be stale — re-fetch once everything
      // has settled so the response actually reflects what was just written.
      return tx.booking.findUniqueOrThrow({
        where: { id },
        include: {
          client: true,
          event: {
            include: {
              bookingServices: { include: { service: true, supplier: true } },
            },
          },
          bookingServices: { include: { service: true, supplier: true } },
          scheduledPayments: { where: { plan: { active: true } } },
        },
      });
    }, { timeout: 15000, maxWait: 10000 });

    return NextResponse.json(serializeDecimals({ success: true, booking: updatedBooking }));
  } catch (error: unknown) {
    if (error instanceof BookingConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof CapacityExceededError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Failed to update booking:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.booking.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to delete booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
