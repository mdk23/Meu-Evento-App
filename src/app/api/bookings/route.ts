import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BookingStatus, BookingType, EventStatus, ExecutionType } from '@prisma/client';

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
        invoices: true,
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
      shift,
      startTime,
      endTime,
      selectedServices,
      status: requestedStatus,
      totalAmount,
      discount,
      downPayment,
      installments,
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
    const finalStatus = requestedStatus === 'CONFIRMED' ? BookingStatus.CONFIRMED : BookingStatus.RESERVED;

    const formattedNotes = [
      title ? `Título: ${title}` : '',
      shift ? `Turno: ${shift}` : '',
      startTime && endTime ? `Horário: ${startTime} - ${endTime}` : '',
      discount ? `Desconto POS: R$ ${discount}` : '',
      downPayment ? `Entrada: ${downPayment}` : '',
      installments ? `Parcelamento: ${installments}` : '',
      notes || '',
    ].filter(Boolean).join(' | ');

    // 1. Create Booking
    const booking = await prisma.booking.create({
      data: {
        tenantId: tenant.id,
        clientId: targetClientId,
        bookingType: bookingType || BookingType.SPACE_AND_SERVICES,
        eventDate: parsedDate,
        guestCount: parsedGuestCount,
        status: finalStatus,
        notes: formattedNotes,
      },
    });

    // 2. Automatically create linked Execution Event
    const event = await prisma.event.create({
      data: {
        bookingId: booking.id,
        name: title || `${client.name} Event`,
        date: parsedDate,
        guestCount: parsedGuestCount,
        status: finalStatus === BookingStatus.CONFIRMED ? EventStatus.READY : EventStatus.PLANNING,
        notes: formattedNotes,
      },
    });

    // 3. Attach selected services / items to the Event
    let calculatedSellingTotal = totalAmount || 0;
    if (Array.isArray(selectedServices) && selectedServices.length > 0) {
      for (const item of selectedServices) {
        let catalogServiceId = item.serviceId;

        // If service is ad-hoc or space item not yet in catalog, find or create
        if (!catalogServiceId) {
          const existingService = await prisma.service.findFirst({
            where: { name: item.name, tenantId: tenant.id },
          });

          if (existingService) {
            catalogServiceId = existingService.id;
          } else {
            const newService = await prisma.service.create({
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

        await prisma.eventService.create({
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

    // 4. Create Initial Invoice for Booking
    const invoiceAmount = calculatedSellingTotal > 0 ? calculatedSellingTotal : 0;
    if (invoiceAmount > 0) {
      await prisma.invoice.create({
        data: {
          tenantId: tenant.id,
          bookingId: booking.id,
          amount: invoiceAmount,
          status: finalStatus === BookingStatus.CONFIRMED ? 'PAID' : 'PENDING',
          dueDate: parsedDate,
        },
      });
    }

    return NextResponse.json({ success: true, booking, event }, { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to create booking in POS:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
