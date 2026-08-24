import { NextResponse } from 'next/server';
import { prisma, prismaTransaction } from '@/lib/prisma';
import { resolveReservationTransition, ReservationAction } from '@/lib/inventory-lifecycle';

const VALID_ACTIONS: ReservationAction[] = ['ALLOCATE', 'USE', 'RETURN', 'RELEASE'];

async function loadScopedResource(eventId: string, eventServiceId: string, resourceId: string) {
  const existing = await prisma.bookingServiceResource.findUnique({
    where: { id: resourceId },
    include: { bookingService: true },
  });
  if (!existing || existing.bookingServiceId !== eventServiceId || existing.bookingService.eventId !== eventId) {
    return null;
  }
  return existing;
}

/** Advances a resource through the Reserve→Allocate→Use→Return lifecycle — validates the
 * transition, updates `status` when the action changes it, and logs the matching
 * `InventoryTransaction` row. See `resolveReservationTransition` for the full state machine.
 * "Reserve" itself isn't exposed here — a resource becomes RESERVED via `POST .../inventory`,
 * which sets both the reserved quantity and the status together in one write. */
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

    const existing = await loadScopedResource(eventId, eventServiceId, reservationId);
    if (!existing) {
      return NextResponse.json({ error: 'Resource not found for this event service' }, { status: 404 });
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
      const resource = transition.nextStatus
        ? await tx.bookingServiceResource.update({
            where: { id: reservationId },
            data: {
              status: transition.nextStatus,
              // USE marks the full reserved commitment as now in active use; RETURN closes it back
              // out — the row's own history (requiredQuantity/reservedQuantity) is never touched by
              // either, only this informational counter.
              usedQuantity: action === 'USE' ? existing.reservedQuantity : action === 'RETURN' ? 0 : undefined,
            },
          })
        : existing;

      // A row only reaches RESERVED/IN_USE (the only statuses these actions run from) via the
      // reserve endpoint, which always resolves inventoryItemId first — so it's guaranteed set here.
      if (transition.transactionType && existing.inventoryItemId) {
        await tx.inventoryTransaction.create({
          data: {
            tenantId: tenant.id,
            inventoryItemId: existing.inventoryItemId,
            eventId,
            bookingServiceId: eventServiceId,
            bookingServiceResourceId: reservationId,
            type: transition.transactionType,
            quantity: existing.reservedQuantity,
            createdBy: 'Staff',
          },
        });
      }

      return resource;
    });

    return NextResponse.json({
      success: true,
      reservation: {
        ...updated,
        requiredQuantity: updated.requiredQuantity.toString(),
        reservedQuantity: updated.reservedQuantity.toString(),
        usedQuantity: updated.usedQuantity.toString(),
      },
    });
  } catch (error: unknown) {
    console.error('Failed to transition inventory reservation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** Releasing a resource is a status change (RELEASED), never a hard delete — its history (and
 * anything reusing its stock) survives it no longer being active. Kept as DELETE (not folded into
 * the PATCH action set above) since this is what the existing "remove" button in the work order UI
 * already calls; its *meaning* changed, not its route shape. */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; eventServiceId: string; reservationId: string }> }
) {
  try {
    const { id: eventId, eventServiceId, reservationId } = await params;

    const existing = await loadScopedResource(eventId, eventServiceId, reservationId);
    if (!existing) {
      return NextResponse.json({ error: 'Resource not found for this event service' }, { status: 404 });
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
      await tx.bookingServiceResource.update({ where: { id: reservationId }, data: { status: 'RELEASED' } });
      if (existing.inventoryItemId) {
        await tx.inventoryTransaction.create({
          data: {
            tenantId: tenant.id,
            inventoryItemId: existing.inventoryItemId,
            eventId,
            bookingServiceId: eventServiceId,
            bookingServiceResourceId: reservationId,
            type: 'RELEASE',
            quantity: existing.reservedQuantity,
            createdBy: 'Staff',
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to release inventory reservation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
