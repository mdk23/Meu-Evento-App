import { NextResponse } from 'next/server';
import { prisma, prismaTransaction } from '@/lib/prisma';
import { assertReuseQuantityAvailable, InventoryConflictError } from '@/lib/resource-conflict';

/**
 * Fulfills a `BookingServiceResourceRequirement` by reusing another service's already-active
 * reservation instead of creating a new one (§20-21/§38) — the cross-workspace "Space already
 * reserved 300 chairs, Event's Decoration needs 200 of them" scenario. Never creates an
 * `InventoryReservation` or `InventoryTransaction` — reuse is a bookkeeping link
 * (`reuseReservationId` + `providedQuantity`) against stock that's already committed, not a new
 * physical movement.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; eventServiceId: string }> }
) {
  try {
    const { id: eventId, eventServiceId } = await params;
    const body = await request.json();
    const { resourceRequirementId, reuseReservationId, quantity } = body;

    const parsedQuantity = parseInt(quantity, 10);
    if (!resourceRequirementId || !reuseReservationId || !parsedQuantity || parsedQuantity <= 0) {
      return NextResponse.json({ error: 'resourceRequirementId, reuseReservationId, and a positive quantity are required' }, { status: 400 });
    }

    const requirement = await prisma.bookingServiceResourceRequirement.findUnique({ where: { id: resourceRequirementId } });
    if (!requirement || requirement.bookingServiceId !== eventServiceId) {
      return NextResponse.json({ error: 'Resource requirement not found for this work order' }, { status: 404 });
    }

    const reservation = await prisma.inventoryReservation.findUnique({ where: { id: reuseReservationId } });
    if (!reservation || reservation.eventId !== eventId) {
      return NextResponse.json({ error: 'Reservation not found for this event' }, { status: 404 });
    }
    if (reservation.bookingServiceId === eventServiceId) {
      return NextResponse.json({ error: 'Cannot reuse a reservation this same work order already holds' }, { status: 400 });
    }

    const updated = await prismaTransaction.$transaction(async (tx) => {
      await assertReuseQuantityAvailable(tx, reuseReservationId, parsedQuantity);

      return tx.bookingServiceResourceRequirement.update({
        where: { id: resourceRequirementId },
        data: {
          providedQuantity: { increment: parsedQuantity },
          reuseReservationId,
          inventoryItemId: reservation.inventoryItemId,
          itemNameSnapshot: reservation.itemNameSnapshot,
        },
      });
    }, { timeout: 15000, maxWait: 10000 });

    return NextResponse.json({ success: true, requirement: { ...updated, requiredQuantity: updated.requiredQuantity.toString(), providedQuantity: updated.providedQuantity.toString() } });
  } catch (error: unknown) {
    if (error instanceof InventoryConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('Failed to reuse inventory reservation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
