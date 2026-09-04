import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { serializeDecimals } from '@/lib/money';
import { computeInventoryStockSummary } from '@/lib/inventory-accounting';
import { InventoryItemRepository } from '@/lib/repositories/inventory-item.repository';
import { resolveItemWrite } from '@/lib/inventory-item-write';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const item = await InventoryItemRepository.getItemDetail(id);
    if (!item) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }

    const stockSummary = computeInventoryStockSummary(item.totalQuantity, item.bookingResources, item.transactions);

    return NextResponse.json(serializeDecimals({ item, stockSummary }));
  } catch (error: unknown) {
    console.error('Failed to fetch inventory item detail:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, sku, inventoryTypeId, quantity, unit, description, attributes } = body;

    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }

    const data: Prisma.InventoryItemUpdateInput = {};
    if (name !== undefined) data.name = String(name).trim();
    if (sku !== undefined) data.sku = sku && String(sku).trim() ? String(sku).trim() : null;
    if (quantity !== undefined) data.totalQuantity = parseInt(String(quantity), 10) || 0;
    if (unit !== undefined && String(unit).trim()) data.unit = String(unit).trim();
    if (description !== undefined) data.description = description && String(description).trim() ? String(description).trim() : null;

    // Re-resolve the type-governed parts whenever the type or the attribute values change.
    if (inventoryTypeId !== undefined || attributes !== undefined) {
      const targetTypeId = inventoryTypeId ?? existing.inventoryTypeId;
      const rawAttrs = attributes !== undefined ? attributes : existing.attributes;
      const w = await resolveItemWrite(existing.tenantId, targetTypeId, rawAttrs);
      if (!w.ok) return NextResponse.json({ error: w.error }, { status: w.status });
      data.inventoryType = { connect: { id: targetTypeId } };
      data.attributes = w.attributes as unknown as Prisma.InputJsonValue;
    }

    const item = await prisma.inventoryItem.update({
      where: { id },
      data,
      include: { inventoryType: { include: { category: true } } },
    });

    return NextResponse.json({ success: true, item });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'An item with this SKU already exists.' }, { status: 409 });
    }
    console.error('Failed to update inventory item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Soft delete: past reservations/transactions keep their own `itemNameSnapshot`, but the row
    // itself must survive (onDelete: Restrict on every historical FK pointing at it) — deactivating
    // hides it from new "add to booking"/"reserve" pickers without breaking history.
    await prisma.inventoryItem.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to deactivate inventory item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
