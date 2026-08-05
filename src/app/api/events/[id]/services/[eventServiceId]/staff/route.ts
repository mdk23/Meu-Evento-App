import { NextResponse } from 'next/server';
import { prisma, prismaTransaction } from '@/lib/prisma';
import { assertStaffAvailable, fullDaySpan, StaffConflictError } from '@/lib/resource-conflict';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; eventServiceId: string }> }
) {
  try {
    const { id: eventId, eventServiceId } = await params;
    const body = await request.json();
    const { staffId, role, startAt, endAt } = body;

    if (!staffId) {
      return NextResponse.json({ error: 'staffId is required' }, { status: 400 });
    }

    const eventService = await prisma.eventService.findUnique({
      where: { id: eventServiceId },
      include: { event: true },
    });
    if (!eventService || eventService.eventId !== eventId) {
      return NextResponse.json({ error: 'Event service not found for this event' }, { status: 404 });
    }

    const staff = await prisma.staff.findUnique({ where: { id: staffId } });
    if (!staff) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 });
    }

    const span = startAt && endAt
      ? { startAt: new Date(startAt), endAt: new Date(endAt) }
      : fullDaySpan(eventService.event.date);

    const assignment = await prismaTransaction.$transaction(async (tx) => {
      await assertStaffAvailable(tx, staffId, span.startAt, span.endAt);
      return tx.eventServiceStaff.create({
        data: {
          eventServiceId,
          staffId,
          staffNameSnapshot: staff.name,
          role: role || staff.role,
          startAt: span.startAt,
          endAt: span.endAt,
        },
      });
    }, { timeout: 15000, maxWait: 10000 });

    return NextResponse.json({ success: true, assignment }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof StaffConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('Failed to assign staff to work order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
