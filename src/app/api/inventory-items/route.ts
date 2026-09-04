import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { resolveItemWrite } from '@/lib/inventory-item-write';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, sku, inventoryTypeId, quantity, unit, description, attributes } = body;

    if (!name || !String(name).trim()) return NextResponse.json({ error: 'Item name is required' }, { status: 400 });
    if (!inventoryTypeId) return NextResponse.json({ error: 'Inventory type is required' }, { status: 400 });

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'No tenant found' }, { status: 400 });

    const w = await resolveItemWrite(tenant.id, inventoryTypeId, attributes);
    if (!w.ok) return NextResponse.json({ error: w.error }, { status: w.status });

    const item = await prisma.inventoryItem.create({
      data: {
        tenantId: tenant.id,
        name: String(name).trim(),
        sku: sku && String(sku).trim() ? String(sku).trim() : null,
        inventoryTypeId,
        totalQuantity: parseInt(String(quantity ?? '0'), 10) || 0,
        unit: unit && String(unit).trim() ? String(unit).trim() : undefined,
        description: description && String(description).trim() ? String(description).trim() : null,
        attributes: w.attributes as unknown as Prisma.InputJsonValue,
      },
      include: { inventoryType: { include: { category: true } } },
    });

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'An item with this SKU already exists.' }, { status: 409 });
    }
    console.error('Failed to create inventory item:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
