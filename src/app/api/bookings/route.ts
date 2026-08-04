import { NextResponse } from 'next/server';
import { prisma, prismaTransaction } from '@/lib/prisma';
import { BookingStatus, BookingType, EventStatus, ExecutionType } from '@prisma/client';
import { assertNoBookingConflict, BookingConflictError } from '@/lib/booking-conflict';

export async function GET() {
  try {
    const bookings = await prisma.booking.findMany({
      orderBy: { eventDate: 'asc' },
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

    const clients = await prisma.client.findMany({ orderBy: { name: 'asc' } });
    const services = await prisma.service.findMany({ orderBy: { name: 'asc' } });
    const spaces = await prisma.space.findMany({ orderBy: { name: 'asc' } });

    return NextResponse.json({ bookings, clients, services, spaces });
  } catch (error: unknown) {
    console.error('Failed to fetch bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      clientId,
      newClient,
      bookingType,
      eventDate,
      guestCount,
      notes,
      title,
      selectedServices,
      status: requestedStatus,
      totalAmount,
      discount,
      downPaymentAmount,
      downPaymentPercent,
      depositDueDate,
      installmentCount,
      installmentAmount,
    } = body;

    let tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      tenant = await prisma.tenant.create({
        data: {
          name: 'Royal Events Co.',
          email: 'contact@royalevents.co',
        },
      });
    }

    let targetClientId = clientId;

    // Create new client on the fly if needed
    if ((!targetClientId || targetClientId === 'NEW') && newClient?.name) {
      const createdClient = await prisma.client.create({
        data: {
          tenantId: tenant.id,
          name: newClient.name,
          phone: newClient.phone || '',
          email: newClient.email || '',
          notes: 'Cadastrado via Ponto de Venda (POS)',
        },
      });
      targetClientId = createdClient.id;
    }

    if (!targetClientId || !eventDate) {
      return NextResponse.json({ error: 'Cliente e Data do Evento são obrigatórios' }, { status: 400 });
    }

    const client = await prisma.client.findUnique({ where: { id: targetClientId } });
    if (!client) {
      return NextResponse.json({ error: 'Cliente selecionado não foi encontrado' }, { status: 404 });
    }

    const parsedDate = new Date(eventDate);
    const parsedGuestCount = parseInt(guestCount || '0', 10);
    const finalStatus =
      requestedStatus === 'CONFIRMED' ? BookingStatus.CONFIRMED
      : requestedStatus === 'WAITING_LIST' ? BookingStatus.WAITING_LIST
      : BookingStatus.RESERVED;

    const discountVal = parseFloat(discount || '0');
    const downPaymentAmtVal = parseFloat(downPaymentAmount || '0');
    const downPaymentPctVal = parseInt(downPaymentPercent || '0', 10);
    const installmentCountVal = parseInt(installmentCount || '1', 10);
    const installmentAmtVal = parseFloat(installmentAmount || '0');

    // Default deposit due date to 14 days/2 weeks from now if not specified
    const parsedDepositDueDate = depositDueDate
      ? new Date(depositDueDate)
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const formattedNotes = [
      `Desconto POS: R$ ${discountVal}`,
      `Entrada: ${downPaymentAmtVal.toLocaleString('pt-MZ')} MT (${downPaymentPctVal}%)`,
      `Parcelamento: ${installmentCountVal}x sem juros (Restante: ${Math.round(installmentAmtVal).toLocaleString('pt-MZ')} MT/mês)`,
      notes ? `Observações: ${notes}` : '',
    ].filter(Boolean).join('\n');

    // Create the Booking, its linked Event, attached services, and payment schedule atomically —
    // a partial failure here must not leave a Booking/Event without its services or payments.
    const { booking, event } = await prismaTransaction.$transaction(async (tx) => {
      // Only WAITING_LIST bookings are allowed to stack on an already-booked date —
      // the venue has a single Space, so any other status must have the date free.
      if (finalStatus !== BookingStatus.WAITING_LIST) {
        await assertNoBookingConflict(tx, parsedDate);
      }

      // 1. Create Booking
      const booking = await tx.booking.create({
        data: {
          tenantId: tenant.id,
          clientId: targetClientId,
          bookingType: bookingType || BookingType.SPACE_AND_SERVICES,
          eventDate: parsedDate,
          guestCount: parsedGuestCount,
          status: finalStatus,
          notes: formattedNotes,
          discount: discountVal,
          downPaymentAmount: downPaymentAmtVal,
          downPaymentPercent: downPaymentPctVal,
          depositDueDate: parsedDepositDueDate,
          installmentCount: installmentCountVal,
          installmentAmount: installmentAmtVal,
        },
      });

      // 2. Automatically create linked Execution Event
      const event = await tx.event.create({
        data: {
          bookingId: booking.id,
          name: title || `${client.name} Event`,
          date: parsedDate,
          guestCount: parsedGuestCount,
          status: EventStatus.PLANNING,
          notes: formattedNotes,
        },
      });

      // 3. Attach selected services / items to the Event
      if (Array.isArray(selectedServices) && selectedServices.length > 0) {
        for (const item of selectedServices) {
          let catalogServiceId = item.serviceId;

          if (!catalogServiceId) {
            const existingService = await tx.service.findFirst({
              where: { name: item.name, tenantId: tenant.id },
            });

            if (existingService) {
              catalogServiceId = existingService.id;
            } else {
              const newService = await tx.service.create({
                data: {
                  tenantId: tenant.id,
                  name: item.name,
                  category: item.category || 'GERAL',
                  executionType: item.providerType === 'EXTERNAL' ? ExecutionType.EXTERNAL : ExecutionType.INTERNAL,
                  priceType: item.priceType || 'FIXED',
                  defaultPrice: item.price || 0,
                },
              });
              catalogServiceId = newService.id;
            }
          }

          const itemSellingPrice = item.totalPrice || item.price || 0;

          await tx.eventService.create({
            data: {
              eventId: event.id,
              serviceId: catalogServiceId,
              providerType: item.providerType === 'EXTERNAL' ? ExecutionType.EXTERNAL : ExecutionType.INTERNAL,
              sellingPrice: itemSellingPrice,
              cost: item.cost || (itemSellingPrice * 0.4),
              status: 'PLANNING',
              notes: item.details || '',
            },
          });
        }
      }

      // 4. Create Scheduled Payments: Deposit (Entrada) + Monthly Installments
      // Initial Deposit
      if (downPaymentAmtVal > 0) {
        const depositStatus = finalStatus === BookingStatus.CONFIRMED ? 'PAID' : 'PENDING';
        const scheduledPayment = await tx.scheduledPayment.create({
          data: {
            tenantId: tenant.id,
            bookingId: booking.id,
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
              tenantId: tenant.id,
              bookingId: booking.id,
              scheduledPaymentId: scheduledPayment.id,
              amount: downPaymentAmtVal,
              method: 'CASH', // Defaulting for POS, can be configured later
              recordedBy: 'POS Terminal',
              notes: 'Initial Deposit paid at booking',
            }
          });
        }
      }

      // Single Payment Remaining Balance
      if (installmentCountVal === 1 && (totalAmount - downPaymentAmtVal) > 0) {
        await tx.scheduledPayment.create({
          data: {
            tenantId: tenant.id,
            bookingId: booking.id,
            name: 'Remaining Balance (Saldo Final)',
            amount: Math.max(0, totalAmount - downPaymentAmtVal),
            status: 'PENDING',
            dueDate: parsedDate,
          },
        });
      }

      // Installments
      if (installmentCountVal > 1 && installmentAmtVal > 0) {
        const remainingInstallments = installmentCountVal - 1;
        for (let i = 1; i <= remainingInstallments; i++) {
          // Calculate due date monthly from today, capped at eventDate
          const installmentDueDate = new Date();
          installmentDueDate.setMonth(installmentDueDate.getMonth() + i);
          if (installmentDueDate > parsedDate) {
            installmentDueDate.setTime(parsedDate.getTime());
          }

          await tx.scheduledPayment.create({
            data: {
              tenantId: tenant.id,
              bookingId: booking.id,
              name: `Installment ${i} of ${remainingInstallments}`,
              amount: installmentAmtVal,
              status: 'PENDING',
              dueDate: installmentDueDate,
            },
          });
        }
      }

      return { booking, event };
    }, { timeout: 15000, maxWait: 10000 });

    return NextResponse.json({ success: true, booking, event }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof BookingConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('Failed to create booking in POS:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
