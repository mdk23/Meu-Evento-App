import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { validateAttributeDefs } from '@/lib/inventory-attributes';

const CODE_RE = /^[A-Z][A-Z0-9_]*$/;

export async function GET() {
  try {
    const types = await prisma.inventoryType.findMany({
      where: { active: true },
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
      include: { category: { select: { name: true } } },
    });
    return NextResponse.json({ types });
  } catch (error: unknown) {
    console.error('Failed to fetch inventory types:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { categoryId, name, code, attributeDefs } = body;

    if (!name || !name.trim()) return NextResponse.json({ error: 'Type name is required' }, { status: 400 });
    if (!code || !CODE_RE.test(String(code))) {
      return NextResponse.json({ error: 'Code must be UPPER_SNAKE_CASE (a letter, then letters/digits/_).' }, { status: 400 });
    }
    if (!categoryId) return NextResponse.json({ error: 'Category is required' }, { status: 400 });

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) return NextResponse.json({ error: 'No tenant found' }, { status: 400 });

    // Tenant ownership — never trust a client-sent parent id.
    const category = await prisma.inventoryCategory.findFirst({
      where: { id: categoryId, tenantId: tenant.id },
      select: { id: true },
    });
    if (!category) return NextResponse.json({ error: 'Category not found for this tenant' }, { status: 403 });

    const defs = validateAttributeDefs(attributeDefs ?? []);
    if (!defs.ok) return NextResponse.json({ error: defs.error }, { status: 400 });

    const type = await prisma.inventoryType.create({
      data: {
        tenantId: tenant.id,
        categoryId: category.id,
        name: name.trim(),
        code: String(code),
        attributeDefs: defs.defs as unknown as Prisma.InputJsonValue,
      },
      include: { category: { select: { name: true } } },
    });

    return NextResponse.json({ success: true, type }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      return NextResponse.json({ error: 'A type with this code or name already exists.' }, { status: 409 });
    }
    console.error('Failed to create inventory type:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
