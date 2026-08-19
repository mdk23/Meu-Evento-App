import { NextResponse } from 'next/server';
import { prisma, prismaTransaction } from '@/lib/prisma';
import {
  assertInternalProvider,
  assertInventoryAvailable,
  fullDaySpan,
  ExternalProviderReservationError,
  InventoryConflictError,
} from '@/lib/resource-conflict';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; eventServiceId: string }> }
) {
  try {
    const { id: eventId, eventServiceId } = await params;
    const body = await request.json();
    const { inventoryItemId, quantity, startAt, endAt } = body;

    const parsedQuantity = parseInt(quantity, 10);
    if (!inventoryItemId || !parsedQuantity || parsedQuantity <= 0) {
      return NextResponse.json({ error: 'inventoryItemId and a positive quantity are required' }, { status: 400 });
    }

    const eventService = await prisma.eventService.findUnique({
      where: { id: eventServiceId },
      include: { event: true },
    });
    if (!eventService || !eventService.event || eventService.eventId !== eventId) {
      return NextResponse.json({ error: 'Event service not found for this event' }, { status: 404 });
    }
    assertInternalProvider(eventService.providerType, eventService.serviceNameSnapshot || undefined);

    const item = await prisma.inventoryItem.findUnique({ where: { id: inventoryItemId } });
    if (!item) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }

    const span = startAt && endAt
      ? { startAt: new Date(startAt), endAt: new Date(endAt) }
      : fullDaySpan(eventService.event.date);

    const reservation = await prismaTransaction.$transaction(async (tx) => {
      await assertInventoryAvailable(tx, inventoryItemId, parsedQuantity, span.startAt, span.endAt);
      return tx.inventoryReservation.create({
        data: {
          eventId,
          eventServiceId,
          inventoryItemId,
          itemNameSnapshot: item.name,
          quantity: parsedQuantity,
          startAt: span.startAt,
          endAt: span.endAt,
        },
      });
    }, { timeout: 15000, maxWait: 10000 });

    return NextResponse.json({ success: true, reservation }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof InventoryConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    if (error instanceof ExternalProviderReservationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Failed to reserve inventory for work order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
