import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; eventServiceId: string }> }
) {
  try {
    const { id: eventId, eventServiceId } = await params;
    const body = await request.json();
    const { title, assignedTo, dueDate } = body;

    if (!title || !String(title).trim()) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    const bookingService = await prisma.bookingService.findUnique({ where: { id: eventServiceId } });
    if (!bookingService || bookingService.eventId !== eventId) {
      return NextResponse.json({ error: 'Event service not found for this event' }, { status: 404 });
    }

    const task = await prisma.bookingServiceTask.create({
      data: {
        bookingServiceId: eventServiceId,
        title: String(title).trim(),
        assignedTo: assignedTo || null,
        dueDate: dueDate ? new Date(dueDate) : null,
      },
    });

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to create work order task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
