import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    const existing = await prisma.inventoryCategory.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    const category = await prisma.inventoryCategory.update({
      where: { id },
      data: {
        name: name !== undefined ? name.trim() : existing.name,
        description: description !== undefined ? (description.trim() || null) : existing.description,
      },
    });

    return NextResponse.json({ success: true, category });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'A category with this name already exists.' }, { status: 409 });
    }
    console.error('Failed to update inventory category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Soft delete: existing InventoryItems/ServiceInventoryRequirements referencing this category
    // (onDelete: Restrict) must never be silently orphaned — deactivating keeps the category
    // resolvable for historical rows while hiding it from the "add item"/"add requirement" pickers.
    await prisma.inventoryCategory.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to deactivate inventory category:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
