import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BookingStatus, BookingType, EventStatus } from '@prisma/client';

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

    return NextResponse.json({ bookings, clients, services });
  } catch (error: unknown) {
    console.error('Failed to fetch bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { clientId, bookingType, eventDate, guestCount, notes, selectedServices } = body;

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      return NextResponse.json({ error: 'No tenant registered' }, { status: 400 });
    }

    if (!clientId || !eventDate) {
      return NextResponse.json({ error: 'Client and Event Date are required' }, { status: 400 });
    }

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return NextResponse.json({ error: 'Selected client not found' }, { status: 404 });
    }

    const parsedDate = new Date(eventDate);
    const parsedGuestCount = parseInt(guestCount || '0', 10);

    // 1. Create Booking
    const booking = await prisma.booking.create({
      data: {
        tenantId: tenant.id,
        clientId,
        bookingType: bookingType || BookingType.SPACE_AND_SERVICES,
        eventDate: parsedDate,
        guestCount: parsedGuestCount,
        status: BookingStatus.CONFIRMED,
        notes: notes || '',
      },
    });

    // 2. Automatically create linked Execution Event
    const event = await prisma.event.create({
      data: {
        bookingId: booking.id,
        name: `${client.name} Event`,
        date: parsedDate,
        guestCount: parsedGuestCount,
        status: EventStatus.PLANNING,
        notes: notes || '',
      },
    });

    // 3. Attach any initially selected services to the Event
    let totalSellingPrice = 0;
    if (Array.isArray(selectedServices) && selectedServices.length > 0) {
      for (const item of selectedServices) {
        const catalogService = await prisma.service.findUnique({ where: { id: item.serviceId } });
        if (catalogService) {
          const price = item.price || catalogService.defaultPrice;
          totalSellingPrice += price;

          await prisma.eventService.create({
            data: {
              eventId: event.id,
              serviceId: catalogService.id,
              providerType: catalogService.executionType,
              sellingPrice: price,
              cost: item.cost || (price * 0.4), // default estimated cost 40%
              status: 'PLANNING',
            },
          });
        }
      }
    }

    // 4. Create Initial Invoice for Booking if selling price > 0
    if (totalSellingPrice > 0) {
      await prisma.invoice.create({
        data: {
          tenantId: tenant.id,
          bookingId: booking.id,
          amount: totalSellingPrice,
          status: 'PENDING',
          dueDate: parsedDate,
        },
      });
    }

    return NextResponse.json({ success: true, booking, event }, { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to create booking:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
