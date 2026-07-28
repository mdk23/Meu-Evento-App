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
    const {
      status,
      eventDate,
      guestCount,
      notes,
      eventStatus,
      paymentAction,
      invoiceId,
      invoiceStatus,
    } = body;

    const existingBooking = await prisma.booking.findUnique({
      where: { id },
      include: { event: true, invoices: true },
    });

    if (!existingBooking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // 1. Prepare update data for Booking
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
        invoices: true,
      },
    });

    // 2. Handle Invoice Updates
    if (invoiceId && invoiceStatus) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: invoiceStatus },
      });
    } else if (paymentAction === 'MARK_DEPOSIT_PAID' || paymentAction === 'MARK_ALL_PAID') {
      await prisma.invoice.updateMany({
        where: { bookingId: id },
        data: { status: 'PAID' },
      });
    }

    // 3. Sync Event Status according to lifecycle rules:
    // Event: PLANNING -> READY (when all payments are done) -> IN_PROGRESS -> COMPLETED
    if (existingBooking.event) {
      const eventUpdateData: any = {};

      if (eventDate) {
        eventUpdateData.date = new Date(eventDate);
      }
      if (guestCount !== undefined) {
        eventUpdateData.guestCount = parseInt(guestCount, 10);
      }

      if (eventStatus && Object.values(EventStatus).includes(eventStatus as EventStatus)) {
        eventUpdateData.status = eventStatus;
      } else if (paymentAction === 'MARK_ALL_PAID') {
        // "Ready for Event when all payments are done"
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
