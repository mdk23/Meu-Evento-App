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
    const { inventoryItemId, quantity, startAt, endAt, resourceRequirementId } = body;

    const parsedQuantity = parseInt(quantity, 10);
    if (!inventoryItemId || !parsedQuantity || parsedQuantity <= 0) {
      return NextResponse.json({ error: 'inventoryItemId and a positive quantity are required' }, { status: 400 });
    }

    const bookingService = await prisma.bookingService.findUnique({
      where: { id: eventServiceId },
      include: { event: true, booking: { select: { tenantId: true } } },
    });
    if (!bookingService || !bookingService.event || bookingService.eventId !== eventId) {
      return NextResponse.json({ error: 'Event service not found for this event' }, { status: 404 });
    }
    assertInternalProvider(bookingService.providerType, bookingService.serviceNameSnapshot || undefined);

    const item = await prisma.inventoryItem.findUnique({ where: { id: inventoryItemId } });
    if (!item) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }

    // Optional — reserving directly against a Phase 14 auto-seeded requirement (rather than the
    // freeform picker) resolves which item fulfills it and bumps `providedQuantity`, so the
    // requirement's own "required vs. provided" bookkeeping stays accurate.
    const resourceRequirement = resourceRequirementId
      ? await prisma.bookingServiceResourceRequirement.findUnique({ where: { id: resourceRequirementId } })
      : null;
    if (resourceRequirementId && (!resourceRequirement || resourceRequirement.bookingServiceId !== eventServiceId)) {
      return NextResponse.json({ error: 'Resource requirement not found for this work order' }, { status: 404 });
    }

    const span = startAt && endAt
      ? { startAt: new Date(startAt), endAt: new Date(endAt) }
      : fullDaySpan(bookingService.event.date);

    const reservation = await prismaTransaction.$transaction(async (tx) => {
      await assertInventoryAvailable(tx, inventoryItemId, parsedQuantity, span.startAt, span.endAt);

      const created = await tx.inventoryReservation.create({
        data: {
          eventId,
          bookingServiceId: eventServiceId,
          inventoryItemId,
          itemNameSnapshot: item.name,
          quantity: parsedQuantity,
          startAt: span.startAt,
          endAt: span.endAt,
          bookingServiceResourceRequirementId: resourceRequirementId || null,
        },
      });

      await tx.inventoryTransaction.create({
        data: {
          tenantId: bookingService.booking.tenantId,
          inventoryItemId,
          eventId,
          bookingServiceId: eventServiceId,
          reservationId: created.id,
          type: 'RESERVE',
          quantity: parsedQuantity,
          createdBy: 'Staff',
        },
      });

      if (resourceRequirement) {
        await tx.bookingServiceResourceRequirement.update({
          where: { id: resourceRequirement.id },
          data: {
            providedQuantity: { increment: parsedQuantity },
            // Resolves a category-based requirement to the specific variant just reserved for it —
            // a no-op (overwrites with the same value) when it was already item-specific.
            inventoryItemId,
            itemNameSnapshot: item.name,
          },
        });
      }

      return created;
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
