import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
            invoices: true,
          },
        },
        eventServices: {
          include: {
            service: true,
            supplier: true,
          },
        },
        guests: true,
        expenses: {
          include: {
            supplier: true,
          },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const tenant = await prisma.tenant.findFirst({
      include: {
        space: true,
        suppliers: true,
        staff: true,
        inventoryItems: true,
        services: true,
      },
    });

    return NextResponse.json({ event, space: tenant?.space, suppliers: tenant?.suppliers, staff: tenant?.staff, catalogServices: tenant?.services });
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

    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        status: body.status,
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
