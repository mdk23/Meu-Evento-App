import { NextResponse } from 'next/server';
import { prisma, prismaTransaction } from '@/lib/prisma';
import { resolveReservationTransition, ReservationAction } from '@/lib/inventory-lifecycle';

const VALID_ACTIONS: ReservationAction[] = ['CONFIRM', 'ALLOCATE', 'USE', 'RETURN', 'RELEASE', 'CANCEL'];

async function loadScopedReservation(eventId: string, eventServiceId: string, reservationId: string) {
  const existing = await prisma.inventoryReservation.findUnique({
    where: { id: reservationId },
    include: { bookingService: true },
  });
  if (!existing || existing.bookingServiceId !== eventServiceId || existing.bookingService.eventId !== eventId) {
    return null;
  }
  return existing;
}

/** Advances a reservation through the Hold→Confirm→Allocate→Use→Return lifecycle (Phase 15) —
 * validates the transition, updates `status` when the action changes it, and logs the matching
 * `InventoryTransaction` row. See `resolveReservationTransition` for the full state machine. */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; eventServiceId: string; reservationId: string }> }
) {
  try {
    const { id: eventId, eventServiceId, reservationId } = await params;
    const body = await request.json();
    const action = body.action as ReservationAction;

    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const existing = await loadScopedReservation(eventId, eventServiceId, reservationId);
    if (!existing) {
      return NextResponse.json({ error: 'Reservation not found for this event service' }, { status: 404 });
    }

    const transition = resolveReservationTransition(existing.status, action);
    if ('error' in transition) {
      return NextResponse.json({ error: transition.error }, { status: 400 });
    }

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 });
    }

    const updated = await prismaTransaction.$transaction(async (tx) => {
      const reservation = transition.nextStatus
        ? await tx.inventoryReservation.update({ where: { id: reservationId }, data: { status: transition.nextStatus } })
        : existing;

      if (transition.transactionType) {
        await tx.inventoryTransaction.create({
          data: {
            tenantId: tenant.id,
            inventoryItemId: existing.inventoryItemId,
            eventId,
            bookingServiceId: eventServiceId,
            reservationId,
            type: transition.transactionType,
            quantity: existing.quantity,
            createdBy: 'Staff',
          },
        });
      }

      return reservation;
    });

    return NextResponse.json({ success: true, reservation: { ...updated, quantity: updated.quantity.toString() } });
  } catch (error: unknown) {
    console.error('Failed to transition inventory reservation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** Releasing a reservation is a status change (RELEASED), never a hard delete — the whole point of
 * Phase 13's status/ledger design is that a reservation's history survives it no longer being active.
 * Kept as DELETE (not folded into the PATCH action set above) since this is what the existing "remove"
 * button in the work order UI already calls; its *meaning* changed, not its route shape. */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; eventServiceId: string; reservationId: string }> }
) {
  try {
    const { id: eventId, eventServiceId, reservationId } = await params;

    const existing = await loadScopedReservation(eventId, eventServiceId, reservationId);
    if (!existing) {
      return NextResponse.json({ error: 'Reservation not found for this event service' }, { status: 404 });
    }

    const transition = resolveReservationTransition(existing.status, 'RELEASE');
    if ('error' in transition) {
      return NextResponse.json({ error: transition.error }, { status: 400 });
    }

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 });
    }

    await prismaTransaction.$transaction(async (tx) => {
      await tx.inventoryReservation.update({ where: { id: reservationId }, data: { status: 'RELEASED' } });
      await tx.inventoryTransaction.create({
        data: {
          tenantId: tenant.id,
          inventoryItemId: existing.inventoryItemId,
          eventId,
          bookingServiceId: eventServiceId,
          reservationId,
          type: 'RELEASE',
          quantity: existing.quantity,
          createdBy: 'Staff',
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to release inventory reservation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
