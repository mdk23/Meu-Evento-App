import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BookingStatus, EventStatus, BookingType, PaymentStatus, Prisma } from '@prisma/client';

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

    return NextResponse.json({ booking });
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
    if (status && Object.values(BookingStatus).includes(status as BookingStatus)) {
      updateData.status = status;
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

    // Update Client info if provided
    if (existingBooking.clientId && (clientName || clientPhone !== undefined || clientEmail !== undefined)) {
      await prisma.client.update({
        where: { id: existingBooking.clientId },
        data: {
          ...(clientName ? { name: clientName } : {}),
          ...(clientPhone !== undefined ? { phone: clientPhone } : {}),
          ...(clientEmail !== undefined ? { email: clientEmail } : {}),
        },
      });
    }

    // Handle Payment Actions
    if (paymentAction === 'MARK_DEPOSIT_PAID') {
      updateData.status = BookingStatus.CONFIRMED;
    } else if (paymentAction === 'MARK_ALL_PAID') {
      updateData.status = BookingStatus.CONFIRMED;
    } else if (paymentAction === 'COMPLETE_FINANCIAL_CLOSURE') {
      updateData.status = BookingStatus.COMPLETED;
    }

    const updatedBooking = await prisma.booking.update({
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
      await prisma.scheduledPayment.update({
        where: { id: invoiceId },
        data: { status: invoiceStatus as PaymentStatus },
      });
    } else if (paymentAction === 'MARK_DEPOSIT_PAID' || paymentAction === 'MARK_ALL_PAID') {
      await prisma.scheduledPayment.updateMany({
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
      } else if (status === 'CONFIRMED' && existingBooking.event.status === 'PLANNING') {
        eventUpdateData.status = EventStatus.PLANNING;
      }

      await prisma.event.update({
        where: { id: existingBooking.event.id },
        data: eventUpdateData,
      });

      // Sync event services if provided (Full POS Edit)
      if (isEdit && selectedServices && Array.isArray(selectedServices)) {
        // Delete old services
        await prisma.eventService.deleteMany({
          where: { eventId: existingBooking.event.id }
        });

        const tenantId = existingBooking.tenantId || (await prisma.tenant.findFirst())?.id;

        for (const item of selectedServices) {
          let catalogServiceId = item.serviceId;

          if (!catalogServiceId && tenantId) {
            const existingService = await prisma.service.findFirst({
              where: { name: item.name, tenantId },
            });
            if (existingService) {
              catalogServiceId = existingService.id;
            } else {
              const newService = await prisma.service.create({
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
            await prisma.eventService.create({
              data: {
                eventId: existingBooking.event.id,
                serviceId: catalogServiceId,
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
      const hasPayments = existingBooking.scheduledPayments.some(s => s.paidAmount > 0);
      
      if (!hasPayments) {
        // Safe to recreate schedules since no actual payments have been processed yet
        await prisma.scheduledPayment.deleteMany({
          where: { bookingId: id }
        });

        const tenantId = existingBooking.tenantId || (await prisma.tenant.findFirst())?.id || 'default';
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
          const scheduledPayment = await prisma.scheduledPayment.create({
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
            await prisma.paymentTransaction.create({
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
          await prisma.scheduledPayment.create({
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

            await prisma.scheduledPayment.create({
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

    return NextResponse.json({ success: true, booking: updatedBooking });
  } catch (error: unknown) {
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
