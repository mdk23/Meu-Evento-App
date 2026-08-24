import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeDecimals } from '@/lib/money';
import { computeInventoryStockSummary } from '@/lib/inventory-accounting';
import { InventoryItemRepository } from '@/lib/repositories/inventory-item.repository';

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

    const stockSummary = computeInventoryStockSummary(item.totalQuantity, item.reservations, item.transactions);

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
    const { name, categoryId, quantity } = body;

    const existing = await prisma.inventoryItem.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Inventory item not found' }, { status: 404 });
    }

    if (categoryId) {
      const category = await prisma.inventoryCategory.findUnique({ where: { id: categoryId } });
      if (!category) {
        return NextResponse.json({ error: 'Category not found' }, { status: 400 });
      }
    }

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        categoryId: categoryId !== undefined ? categoryId : existing.categoryId,
        totalQuantity: quantity !== undefined ? parseInt(quantity, 10) : existing.totalQuantity,
      },
      include: { category: true },
    });

    return NextResponse.json({ success: true, item });
  } catch (error: unknown) {
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
