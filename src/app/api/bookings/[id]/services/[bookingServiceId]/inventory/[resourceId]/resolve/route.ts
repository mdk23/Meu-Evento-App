import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canResolveResource, isItemEligibleForResource } from '@/lib/category-resolution';
import { MatchCriteria } from '@/lib/inventory-type-match';

/**
 * Resolves a type-based `BookingServiceResource` placeholder to the specific `InventoryItem` this
 * booking will use — of the required type, whose attributes satisfy the requirement's match
 * criteria. Done before reserving, so the pre-reserve review and the resource summary can show a
 * concrete item. Resolving is NOT reserving: `status` stays `PLANNED` and no `InventoryTransaction`
 * is written. The reserve endpoint still resolves implicitly as a shortcut for the common path.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; bookingServiceId: string; resourceId: string }> }
) {
  try {
    const { id: bookingId, bookingServiceId, resourceId } = await params;
    const body = await request.json();
    const inventoryItemId = body.inventoryItemId as string | undefined;

    if (!inventoryItemId) {
      return NextResponse.json({ error: 'inventoryItemId is required' }, { status: 400 });
    }

    const existingRow = await prisma.bookingServiceResource.findUnique({
      where: { id: resourceId },
      include: {
        sourceRequirement: { select: { inventoryTypeId: true, matchCriteria: true } },
        booking: { select: { tenantId: true } },
      },
    });
    if (!existingRow || existingRow.bookingServiceId !== bookingServiceId || existingRow.bookingId !== bookingId) {
      return NextResponse.json({ error: 'Resource not found for this booking service' }, { status: 404 });
    }

    const existing = {
      inventoryItemId: existingRow.inventoryItemId,
      status: existingRow.status,
      sourceRequirement: existingRow.sourceRequirement
        ? {
            inventoryTypeId: existingRow.sourceRequirement.inventoryTypeId,
            matchCriteria: (existingRow.sourceRequirement.matchCriteria ?? null) as MatchCriteria | null,
          }
        : null,
    };

    if (!canResolveResource(existing)) {
      return NextResponse.json(
        { error: "This resource isn't an unresolved type placeholder — nothing to resolve." },
        { status: 400 }
      );
    }

    const item = await prisma.inventoryItem.findUnique({
      where: { id: inventoryItemId },
      select: { id: true, name: true, inventoryTypeId: true, attributes: true, tenantId: true, active: true },
    });
    if (!item) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }
    if (!isItemEligibleForResource(item, existing, existingRow.booking.tenantId)) {
      return NextResponse.json(
        { error: "Chosen item isn't an active item of this requirement's type matching its criteria." },
        { status: 400 }
      );
    }

    const updated = await prisma.bookingServiceResource.update({
      where: { id: resourceId },
      data: { inventoryItemId: item.id, itemNameSnapshot: item.name },
    });

    return NextResponse.json({
      success: true,
      resource: {
        ...updated,
        requiredQuantity: updated.requiredQuantity.toString(),
        reservedQuantity: updated.reservedQuantity.toString(),
        usedQuantity: updated.usedQuantity.toString(),
      },
    });
  } catch (error: unknown) {
    console.error('Failed to resolve category resource:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
