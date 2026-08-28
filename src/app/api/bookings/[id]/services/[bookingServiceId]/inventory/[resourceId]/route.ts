import { NextResponse } from 'next/server';
import { prisma, prismaTransaction } from '@/lib/prisma';
import { resolveReservationTransition, ReservationAction } from '@/lib/inventory-lifecycle';

const VALID_ACTIONS: ReservationAction[] = ['CONFIRM', 'ISSUE', 'ALLOCATE', 'USE', 'RETURN', 'RELEASE', 'DAMAGE', 'LOSS'];

/** Actions whose ledger row can move a partial quantity (the operator supplies how much); everything
 * else moves the whole reserved commitment. */
const PARTIAL_QUANTITY_ACTIONS = new Set<ReservationAction>(['DAMAGE', 'LOSS', 'RETURN']);

async function loadScopedResource(bookingId: string, bookingServiceId: string, resourceId: string) {
  const existing = await prisma.bookingServiceResource.findUnique({ where: { id: resourceId } });
  if (!existing || existing.bookingServiceId !== bookingServiceId || existing.bookingId !== bookingId) {
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
  { params }: { params: Promise<{ id: string; bookingServiceId: string; resourceId: string }> }
) {
  try {
    const { id: bookingId, bookingServiceId, resourceId } = await params;
    const body = await request.json();
    const action = body.action as ReservationAction;

    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const existing = await loadScopedResource(bookingId, bookingServiceId, resourceId);
    if (!existing) {
      return NextResponse.json({ error: 'Resource not found for this booking service' }, { status: 404 });
    }

    const transition = resolveReservationTransition(existing.status, action);
    if ('error' in transition) {
      return NextResponse.json({ error: transition.error }, { status: 400 });
    }

    if ((action === 'CONFIRM' || action === 'ISSUE') && !existing.inventoryItemId) {
      return NextResponse.json(
        { error: 'Resolve which inventory item fulfills this requirement before confirming or issuing it.' },
        { status: 400 }
      );
    }

    // DAMAGE / LOSS / partial RETURN can move less than the whole reserved commitment — the operator
    // says how much. Everything else moves the full `reservedQuantity`.
    const reservedNum = Number(existing.reservedQuantity);
    let ledgerQuantity = reservedNum;
    if (PARTIAL_QUANTITY_ACTIONS.has(action) && body.quantity !== undefined) {
      const q = Number(body.quantity);
      if (!Number.isFinite(q) || q <= 0 || q > reservedNum) {
        return NextResponse.json(
          { error: `Quantity must be between 1 and ${reservedNum} (this row's reserved amount).` },
          { status: 400 }
        );
      }
      ledgerQuantity = q;
    }

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 });
    }

    const bookingService = await prisma.bookingService.findUnique({ where: { id: bookingServiceId }, select: { eventId: true } });

    const updated = await prismaTransaction.$transaction(async (tx) => {
      const resource = transition.nextStatus
        ? await tx.bookingServiceResource.update({
            where: { id: resourceId },
            data: {
              status: transition.nextStatus,
              // USE marks the full reserved commitment as now in active use; RETURN closes it back
              // out — the row's own history (requiredQuantity/reservedQuantity) is never touched by
              // either, only this informational counter.
              usedQuantity: action === 'USE' ? existing.reservedQuantity : action === 'RETURN' ? 0 : undefined,
            },
          })
        : existing;

      // A row only reaches an active status (the only ones these actions run from) via the reserve
      // endpoint, which always resolves inventoryItemId first — so it's guaranteed set here.
      // CONFIRM has no transactionType (pure commitment-strength change, no physical movement).
      if (transition.transactionType && existing.inventoryItemId) {
        await tx.inventoryTransaction.create({
          data: {
            tenantId: tenant.id,
            inventoryItemId: existing.inventoryItemId,
            eventId: bookingService?.eventId ?? null,
            bookingServiceId,
            bookingServiceResourceId: resourceId,
            type: transition.transactionType,
            quantity: ledgerQuantity,
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
 * the PATCH action set above) since this is what the existing "remove" button in the resource UI
 * already calls; its *meaning* changed, not its route shape. */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; bookingServiceId: string; resourceId: string }> }
) {
  try {
    const { id: bookingId, bookingServiceId, resourceId } = await params;

    const existing = await loadScopedResource(bookingId, bookingServiceId, resourceId);
    if (!existing) {
      return NextResponse.json({ error: 'Resource not found for this booking service' }, { status: 404 });
    }

    const transition = resolveReservationTransition(existing.status, 'RELEASE');
    if ('error' in transition) {
      return NextResponse.json({ error: transition.error }, { status: 400 });
    }

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 });
    }

    const bookingService = await prisma.bookingService.findUnique({ where: { id: bookingServiceId }, select: { eventId: true } });

    await prismaTransaction.$transaction(async (tx) => {
      await tx.bookingServiceResource.update({ where: { id: resourceId }, data: { status: 'RELEASED' } });
      if (existing.inventoryItemId) {
        await tx.inventoryTransaction.create({
          data: {
            tenantId: tenant.id,
            inventoryItemId: existing.inventoryItemId,
            eventId: bookingService?.eventId ?? null,
            bookingServiceId,
            bookingServiceResourceId: resourceId,
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
