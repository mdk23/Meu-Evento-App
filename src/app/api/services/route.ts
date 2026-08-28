import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ExecutionType, ServiceContext, PriceType, QuantityType } from '@prisma/client';
import { serializeDecimals } from '@/lib/money';

function resolveContext(value: unknown): ServiceContext {
  return value === 'VENUE' || value === 'EVENT' ? (value as ServiceContext) : ServiceContext.BOTH;
}

function resolvePriceType(value: unknown): PriceType {
  return value === 'PER_GUEST' || value === 'PER_HOUR' || value === 'PER_UNIT'
    ? (value as PriceType)
    : PriceType.FIXED;
}

function resolveQuantityType(value: unknown): QuantityType {
  return value === 'PER_GUEST' || value === 'PER_UNIT' ? (value as QuantityType) : QuantityType.FIXED;
}

interface InventoryRequirementInput {
  inventoryItemId?: string | null;
  categoryId?: string | null;
  quantity?: number | string;
  quantityType?: string;
  optional?: boolean;
  notes?: string | null;
}

/** Validates each requirement names a fulfillment target (item or category — matches the DB CHECK
 * constraint on `service_inventory_requirements`) before it ever reaches a write. */
function validateRequirements(requirements: unknown): { error: string } | { rows: InventoryRequirementInput[] } {
  if (!Array.isArray(requirements)) return { rows: [] };
  for (const r of requirements as InventoryRequirementInput[]) {
    if (!r.inventoryItemId && !r.categoryId) {
      return { error: 'Each inventory requirement needs either a specific item or a category.' };
    }
  }
  return { rows: requirements as InventoryRequirementInput[] };
}

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      orderBy: { category: 'asc' },
    });
    return NextResponse.json(serializeDecimals({ services }));
  } catch (error: unknown) {
    console.error('Failed to fetch catalog services:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, context, defaultExecutionType, priceType, defaultPrice, inventoryRequirements } = body;

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 });
    }

    if (!name || !category) {
      return NextResponse.json({ error: 'Name and Category are required' }, { status: 400 });
    }

    const validated = validateRequirements(inventoryRequirements);
    if ('error' in validated) {
      return NextResponse.json({ error: validated.error }, { status: 400 });
    }

    const service = await prisma.service.create({
      data: {
        tenantId: tenant.id,
        name,
        category,
        context: resolveContext(context),
        defaultProviderType: defaultExecutionType === 'EXTERNAL' ? ExecutionType.EXTERNAL : ExecutionType.INTERNAL,
        priceType: resolvePriceType(priceType),
        defaultPrice: parseFloat(defaultPrice || 0),
        inventoryRequirements: {
          create: validated.rows.map((r, index) => ({
            tenantId: tenant.id,
            inventoryItemId: r.inventoryItemId || null,
            categoryId: r.categoryId || null,
            quantity: parseInt(String(r.quantity ?? 1), 10) || 1,
            quantityType: resolveQuantityType(r.quantityType),
            optional: !!r.optional,
            notes: r.notes || null,
            sortOrder: index,
          })),
        },
      },
      include: { inventoryRequirements: true },
    });

    return NextResponse.json(serializeDecimals({ success: true, service }), { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to create catalog service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
