import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeDecimals } from '@/lib/money';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            client: true,
            scheduledPayments: { where: { plan: { active: true } } },
          },
        },
        eventServices: {
          include: {
            service: true,
            supplier: true,
            serviceTasks: true,
            staffAssignments: { include: { staff: true } },
            inventoryReservations: { include: { inventoryItem: true } },
          },
        },
        guests: true,
        expenses: {
          include: {
            supplier: true,
          },
        },
        statusOverrides: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Only active catalog entries should be selectable when assigning staff/inventory/suppliers/services
    // to a work order — an already-assigned (now-inactive) one still displays fine via the eventServices
    // include above, since that's a live join on whatever is actually assigned, not this picker list.
    const tenant = await prisma.tenant.findFirst({
      include: {
        space: true,
        suppliers: { where: { active: true } },
        staff: { where: { active: true } },
        inventoryItems: { where: { active: true } },
        services: { where: { active: true } },
      },
    });

    return NextResponse.json(serializeDecimals({
      event,
      space: tenant?.space,
      suppliers: tenant?.suppliers,
      staff: tenant?.staff,
      catalogServices: tenant?.services,
      inventoryItems: tenant?.inventoryItems,
    }));
  } catch (error: unknown) {
    console.error('Failed to fetch event detail:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    // Status is intentionally not accepted here — it's derived from service progress
    // automatically, or changed via the audited override path (PATCH /api/bookings/[id]).
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        name: body.name,
        notes: body.notes,
        guestCount: body.guestCount ? parseInt(body.guestCount, 10) : undefined,
      },
    });

    return NextResponse.json({ success: true, event: updatedEvent });
  } catch (error: unknown) {
    console.error('Failed to update event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
