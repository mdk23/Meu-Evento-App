import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { canResolveResource, isItemEligibleForResource } from '@/lib/category-resolution';

/**
 * Resolves a category-based `BookingServiceResource` placeholder to the specific in-category
 * `InventoryItem` this booking will use — before reserving, so the pre-reserve review and the
 * resource summary can show a concrete item. Resolving is NOT reserving: `status` stays `PLANNED`
 * and no `InventoryTransaction` is written (§16 — a template/placeholder never holds stock). The
 * reserve endpoint still resolves implicitly as a shortcut for the common path.
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

    const existing = await prisma.bookingServiceResource.findUnique({
      where: { id: resourceId },
      include: { sourceRequirement: { select: { categoryId: true } }, booking: { select: { tenantId: true } } },
    });
    if (!existing || existing.bookingServiceId !== bookingServiceId || existing.bookingId !== bookingId) {
      return NextResponse.json({ error: 'Resource not found for this booking service' }, { status: 404 });
    }

    if (!canResolveResource(existing)) {
      return NextResponse.json(
        { error: "This resource isn't an unresolved category placeholder — nothing to resolve." },
        { status: 400 }
      );
    }

    const item = await prisma.inventoryItem.findUnique({
      where: { id: inventoryItemId },
      select: { id: true, name: true, categoryId: true, tenantId: true, active: true },
    });
    if (!item) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }
    if (!isItemEligibleForResource(item, existing, existing.booking.tenantId)) {
      return NextResponse.json(
        { error: "Chosen item isn't an active item in this requirement's category." },
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
