import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; eventServiceId: string; reservationId: string }> }
) {
  try {
    const { id: eventId, eventServiceId, reservationId } = await params;

    const existing = await prisma.inventoryReservation.findUnique({
      where: { id: reservationId },
      include: { eventService: true },
    });
    if (!existing || existing.eventServiceId !== eventServiceId || existing.eventService.eventId !== eventId) {
      return NextResponse.json({ error: 'Reservation not found for this event service' }, { status: 404 });
    }

    await prisma.inventoryReservation.delete({ where: { id: reservationId } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to release inventory reservation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
