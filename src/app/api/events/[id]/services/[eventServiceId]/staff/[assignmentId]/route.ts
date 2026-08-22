import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; eventServiceId: string; assignmentId: string }> }
) {
  try {
    const { id: eventId, eventServiceId, assignmentId } = await params;

    const existing = await prisma.bookingServiceStaff.findUnique({
      where: { id: assignmentId },
      include: { bookingService: true },
    });
    if (!existing || existing.bookingServiceId !== eventServiceId || existing.bookingService.eventId !== eventId) {
      return NextResponse.json({ error: 'Assignment not found for this event service' }, { status: 404 });
    }

    await prisma.bookingServiceStaff.delete({ where: { id: assignmentId } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to unassign staff from work order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
