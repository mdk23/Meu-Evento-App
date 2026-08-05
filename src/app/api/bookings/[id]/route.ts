import { NextResponse } from 'next/server';
import { prisma, prismaTransaction } from '@/lib/prisma';
import { BookingStatus, EventStatus, BookingType, PaymentStatus, Prisma } from '@prisma/client';
import { assertNoBookingConflict, BookingConflictError } from '@/lib/booking-conflict';
import { isMoneyPositive, serializeDecimals } from '@/lib/money';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        client: true,
        event: {
          include: {
            eventServices: { include: { service: true, supplier: true } },
          },
        },
        scheduledPayments: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json(serializeDecimals({ booking }));
  } catch (error: unknown) {
    console.error('Failed to fetch booking details:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
      guestCount,
      notes,
      title,
      clientId,
      clientName,
      clientPhone,
      clientEmail,
      bookingType,
      discount,
      downPaymentAmount,
      downPaymentPercent,
      depositDueDate,
      eventStatus,
      paymentAction,
      invoiceId,
      invoiceStatus,
      isEdit,
      selectedServices,
      totalAmount,
      installmentCount,
      installmentAmount,
    } = body;

    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      include: { event: true, scheduledPayments: true, client: true },
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
    if (guestCount !== undefined) {
      updateData.guestCount = parseInt(guestCount, 10);
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
    if (downPaymentAmount !== undefined) {
      updateData.downPaymentAmount = parseFloat(downPaymentAmount);
    }
    if (downPaymentPercent !== undefined) {
      updateData.downPaymentPercent = parseInt(downPaymentPercent, 10);
    }
    if (depositDueDate) {
      updateData.depositDueDate = new Date(depositDueDate);
    }
    if (installmentCount !== undefined) {
      updateData.installmentCount = parseInt(installmentCount, 10);
    }
    if (installmentAmount !== undefined) {
      updateData.installmentAmount = parseFloat(installmentAmount);
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

    // Update booking + client + event + services + payment schedule atomically —
    // the service/payment sync below deletes-then-recreates rows, so a partial failure
    // must not leave the booking with a wiped-but-not-rebuilt services or payment schedule.
    const updatedBooking = await prismaTransaction.$transaction(async (tx) => {
      // Only WAITING_LIST/CANCELLED bookings are allowed to share an already-booked date —
      // the venue has a single Space. Re-check whenever the resulting status is a blocking
      // one, whether it's because the date is changing or because a WAITING_LIST/CANCELLED
      // booking is being promoted back to active on its existing date. Excluding this
      // booking's own id makes the check a safe no-op when nothing relevant changed.
      if (resolvedStatus !== BookingStatus.CANCELLED && resolvedStatus !== BookingStatus.WAITING_LIST) {
        const dateToCheck = eventDate ? new Date(eventDate) : existingBooking.eventDate;
        await assertNoBookingConflict(tx, dateToCheck, id);
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

      const updatedBooking = await tx.booking.update({
        where: { id },
        data: updateData,
        include: {
          client: true,
          event: {
            include: {
              eventServices: { include: { service: true, supplier: true } },
            },
          },
          scheduledPayments: true,
        },
      });

      // 2. Handle Payment Status Updates
      if (invoiceId && invoiceStatus) {
        // Mapping old invoiceStatus (PENDING, PAID, etc.) to PaymentStatus
        await tx.scheduledPayment.update({
          where: { id: invoiceId },
          data: { status: invoiceStatus as PaymentStatus },
        });
      } else if (paymentAction === 'MARK_DEPOSIT_PAID' || paymentAction === 'MARK_ALL_PAID') {
        await tx.scheduledPayment.updateMany({
          where: { bookingId: id },
          data: { status: 'PAID' },
        });
      }

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

        if (eventStatus && Object.values(EventStatus).includes(eventStatus as EventStatus)) {
          eventUpdateData.status = eventStatus;
        } else if (paymentAction === 'MARK_ALL_PAID') {
          eventUpdateData.status = EventStatus.READY;
        } else if (paymentAction === 'COMPLETE_FINANCIAL_CLOSURE' || status === 'COMPLETED') {
          eventUpdateData.status = EventStatus.COMPLETED;
        }

        await tx.event.update({
          where: { id: existingBooking.event.id },
          data: eventUpdateData,
        });

        // Sync event services if provided (Full POS Edit)
        if (isEdit && selectedServices && Array.isArray(selectedServices)) {
          // Delete old services
          await tx.eventService.deleteMany({
            where: { eventId: existingBooking.event.id }
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
                    executionType: item.providerType === 'EXTERNAL' ? 'EXTERNAL' : 'INTERNAL',
                    priceType: item.priceType || 'FIXED',
                    defaultPrice: item.price || 0,
                  },
                });
                catalogServiceId = newService.id;
              }
            }

            if (catalogServiceId) {
              await tx.eventService.create({
                data: {
                  eventId: existingBooking.event.id,
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
        }
      }

      // 4. Sync Scheduled Payments if it's a full POS Edit
      if (isEdit && (downPaymentAmount !== undefined || installmentCount !== undefined)) {
        const hasPayments = existingBooking.scheduledPayments.some(s => isMoneyPositive(s.paidAmount));

        if (!hasPayments) {
          // Safe to recreate schedules since no actual payments have been processed yet
          await tx.scheduledPayment.deleteMany({
            where: { bookingId: id }
          });

          const tenantId = existingBooking.tenantId || (await tx.tenant.findFirst())?.id || 'default';
          const parsedDepositDueDate = depositDueDate
            ? new Date(depositDueDate)
            : existingBooking.depositDueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
          const parsedDate = eventDate ? new Date(eventDate) : existingBooking.eventDate;

          const finalStatus = status || existingBooking.status;
          const depositStatus = finalStatus === 'CONFIRMED' ? 'PAID' : 'PENDING';

          const downPaymentAmtVal = parseFloat(downPaymentAmount || '0');
          const installmentCountVal = parseInt(installmentCount || '1', 10);
          const installmentAmtVal = parseFloat(installmentAmount || '0');
          const totalAmountVal = parseFloat(totalAmount || '0');

          // Initial Deposit
          if (downPaymentAmtVal > 0) {
            const scheduledPayment = await tx.scheduledPayment.create({
              data: {
                tenantId,
                bookingId: id,
                name: 'Initial Deposit (Sinal)',
                amount: downPaymentAmtVal,
                paidAmount: depositStatus === 'PAID' ? downPaymentAmtVal : 0,
                status: depositStatus,
                dueDate: parsedDepositDueDate,
              },
            });

            if (depositStatus === 'PAID') {
              await tx.paymentTransaction.create({
                data: {
                  tenantId,
                  bookingId: id,
                  scheduledPaymentId: scheduledPayment.id,
                  amount: downPaymentAmtVal,
                  method: 'CASH',
                  recordedBy: 'POS Terminal',
                  notes: 'Initial Deposit paid at booking (Edit)',
                }
              });
            }
          }

          // Single Payment Remaining Balance
          if (installmentCountVal === 1 && (totalAmountVal - downPaymentAmtVal) > 0) {
            await tx.scheduledPayment.create({
              data: {
                tenantId,
                bookingId: id,
                name: 'Remaining Balance (Saldo Final)',
                amount: Math.max(0, totalAmountVal - downPaymentAmtVal),
                status: 'PENDING',
                dueDate: parsedDate,
              },
            });
          }

          // Installments
          if (installmentCountVal > 1 && installmentAmtVal > 0) {
            const remainingInstallments = installmentCountVal - 1;
            for (let i = 1; i <= remainingInstallments; i++) {
              const installmentDueDate = new Date();
              installmentDueDate.setMonth(installmentDueDate.getMonth() + i);
              if (installmentDueDate > parsedDate) {
                installmentDueDate.setTime(parsedDate.getTime());
              }

              await tx.scheduledPayment.create({
                data: {
                  tenantId,
                  bookingId: id,
                  name: `Installment ${i} of ${remainingInstallments}`,
                  amount: installmentAmtVal,
                  status: 'PENDING',
                  dueDate: installmentDueDate,
                },
              });
            }
          }
        }
      }

      return updatedBooking;
    }, { timeout: 15000, maxWait: 10000 });

    return NextResponse.json(serializeDecimals({ success: true, booking: updatedBooking }));
  } catch (error: unknown) {
    if (error instanceof BookingConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
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
