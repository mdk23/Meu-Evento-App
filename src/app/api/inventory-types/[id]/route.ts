import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { validateAttributeDefs } from '@/lib/inventory-attributes';

const CODE_RE = /^[A-Z][A-Z0-9_]*$/;

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { categoryId, name, code, attributeDefs } = body;

    const existing = await prisma.inventoryType.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: 'Type not found' }, { status: 404 });

    const data: Prisma.InventoryTypeUpdateInput = {};

    if (name !== undefined) {
      if (!String(name).trim()) return NextResponse.json({ error: 'Type name is required' }, { status: 400 });
      data.name = String(name).trim();
    }
    if (code !== undefined) {
      if (!CODE_RE.test(String(code))) {
        return NextResponse.json({ error: 'Code must be UPPER_SNAKE_CASE.' }, { status: 400 });
      }
      data.code = String(code);
    }
    if (categoryId !== undefined) {
      const category = await prisma.inventoryCategory.findFirst({
        where: { id: categoryId, tenantId: existing.tenantId },
        select: { id: true },
      });
      if (!category) return NextResponse.json({ error: 'Category not found for this tenant' }, { status: 403 });
      data.category = { connect: { id: category.id } };
    }
    if (attributeDefs !== undefined) {
      const defs = validateAttributeDefs(attributeDefs ?? []);
      if (!defs.ok) return NextResponse.json({ error: defs.error }, { status: 400 });
      data.attributeDefs = defs.defs as unknown as Prisma.InputJsonValue;
    }

    const type = await prisma.inventoryType.update({
      where: { id },
      data,
      include: { category: { select: { name: true } } },
    });
    return NextResponse.json({ success: true, type });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'A type with this code or name already exists.' }, { status: 409 });
    }
    console.error('Failed to update inventory type:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Soft-deactivate only — items and requirements referencing this type keep resolving it.
    await prisma.inventoryType.update({ where: { id }, data: { active: false } });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to deactivate inventory type:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
