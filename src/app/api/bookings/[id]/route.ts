import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { BookingStatus, EventStatus } from '@prisma/client';

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
        invoices: true,
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
    const { status, eventDate, guestCount, notes, eventStatus } = body;

    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      include: { event: true, invoices: true },
    });

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};
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

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        client: true,
        event: true,
        invoices: true,
      },
    });

    // Sync Event Status if linked event exists
    if (existingBooking.event) {
      const eventUpdateData: any = {};

      if (eventDate) {
        eventUpdateData.date = new Date(eventDate);
      }
      if (guestCount !== undefined) {
        eventUpdateData.guestCount = parseInt(guestCount, 10);
      }

      // Sync lifecycle rule:
      // Booking: RESERVED -> CONFIRMED (when initial deposit made) -> COMPLETED (event completed + financial closure)
      // Event: PLANNING -> READY (all payments done) -> IN_PROGRESS -> COMPLETED
      if (eventStatus && Object.values(EventStatus).includes(eventStatus as EventStatus)) {
        eventUpdateData.status = eventStatus;
      } else if (status === 'CONFIRMED' && existingBooking.event.status === 'PLANNING') {
        // Initial deposit made -> Booking becomes CONFIRMED, Event stays PLANNING until ready
        eventUpdateData.status = 'PLANNING';
      } else if (status === 'COMPLETED') {
        eventUpdateData.status = 'COMPLETED';
      }

      await prisma.event.update({
        where: { id: existingBooking.event.id },
        data: eventUpdateData,
      });
    }

    // Auto-update Invoice status if Booking status is CONFIRMED (deposit made)
    if (status === 'CONFIRMED' && existingBooking.invoices.length > 0) {
      const pendingInvoice = existingBooking.invoices.find((i) => i.status === 'PENDING');
      if (pendingInvoice) {
        await prisma.invoice.update({
          where: { id: pendingInvoice.id },
          data: { status: 'PAID' },
        });
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
