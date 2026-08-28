import { NextResponse } from 'next/server';
import { prisma, prismaTransaction } from '@/lib/prisma';
import { assertReuseQuantityAvailable, InventoryConflictError } from '@/lib/resource-conflict';

/**
 * Fulfills a `BookingServiceResource` row by reusing another service's already-active resource on
 * the same booking instead of creating a fresh reservation — the cross-workspace "Venue already
 * reserved 300 chairs, Event's Decoration needs 200 of them" scenario. Never touches the target's
 * own `reservedQuantity` or creates an `InventoryTransaction` — reuse is a bookkeeping link
 * (`reusedFromResourceId`) against stock that's already committed, not a new physical movement.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; bookingServiceId: string }> }
) {
  try {
    const { id: bookingId, bookingServiceId } = await params;
    const body = await request.json();
    const { resourceRequirementId, reuseReservationId, quantity } = body;

    const parsedQuantity = parseInt(quantity, 10);
    if (!resourceRequirementId || !reuseReservationId || !parsedQuantity || parsedQuantity <= 0) {
      return NextResponse.json({ error: 'resourceRequirementId, reuseReservationId, and a positive quantity are required' }, { status: 400 });
    }

    const resource = await prisma.bookingServiceResource.findUnique({ where: { id: resourceRequirementId } });
    if (!resource || resource.bookingServiceId !== bookingServiceId) {
      return NextResponse.json({ error: 'Resource requirement not found for this service' }, { status: 404 });
    }

    const target = await prisma.bookingServiceResource.findUnique({ where: { id: reuseReservationId } });
    if (!target || target.bookingId !== bookingId) {
      return NextResponse.json({ error: 'Resource not found for this booking' }, { status: 404 });
    }
    if (target.bookingServiceId === bookingServiceId) {
      return NextResponse.json({ error: 'Cannot reuse a resource this same service already holds' }, { status: 400 });
    }

    const updated = await prismaTransaction.$transaction(async (tx) => {
      await assertReuseQuantityAvailable(tx, reuseReservationId, parsedQuantity);

      return tx.bookingServiceResource.update({
        where: { id: resourceRequirementId },
        data: {
          reservedQuantity: { increment: parsedQuantity },
          reusedFromResourceId: reuseReservationId,
          status: resource.status === 'PLANNED' ? 'RESERVED' : resource.status,
          // Resolves a category-based row to the specific variant just claimed for it — a no-op
          // (overwrites with the same value) when it was already item-specific.
          inventoryItemId: target.inventoryItemId,
          itemNameSnapshot: target.itemNameSnapshot,
        },
      });
    }, { timeout: 15000, maxWait: 10000 });

    return NextResponse.json({ success: true, requirement: { ...updated, requiredQuantity: updated.requiredQuantity.toString(), providedQuantity: updated.reservedQuantity.toString() } });
  } catch (error: unknown) {
    if (error instanceof InventoryConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('Failed to reuse inventory reservation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
