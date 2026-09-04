import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { ExecutionType, QuantityType, PriceType } from '@prisma/client';
import { serializeDecimals } from '@/lib/money';
import { resolveServiceRequirements } from '@/lib/service-requirement-write';

function resolveQuantityType(value: unknown): QuantityType {
  return value === 'PER_GUEST' || value === 'PER_UNIT' || value === 'GUESTS_PER_UNIT'
    ? (value as QuantityType)
    : QuantityType.FIXED;
}

function isPriceType(value: unknown): value is PriceType {
  return value === 'FIXED' || value === 'PER_GUEST' || value === 'PER_HOUR' || value === 'PER_UNIT';
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, category, context, defaultExecutionType, priceType, defaultPrice, inventoryRequirements, featured } = body;

    const existingService = await prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const resolved = await resolveServiceRequirements(existingService.tenantId, inventoryRequirements);
    if (!resolved.ok) {
      return NextResponse.json({ error: resolved.error }, { status: 400 });
    }

    // Replacing the requirement list wholesale (delete-then-recreate), same pattern used for
    // PackageItem sync — these are small template lists, not worth diffing.
    const updatedService = await prisma.$transaction(async (tx) => {
      if (Array.isArray(inventoryRequirements)) {
        await tx.serviceInventoryRequirement.deleteMany({ where: { serviceId: id } });
        if (resolved.rows.length > 0) {
          await tx.serviceInventoryRequirement.createMany({
            data: resolved.rows.map((r, index) => ({
              tenantId: existingService.tenantId,
              serviceId: id,
              inventoryItemId: r.inventoryItemId,
              inventoryTypeId: r.inventoryTypeId,
              matchCriteria: r.matchCriteria === null ? Prisma.DbNull : (r.matchCriteria as unknown as Prisma.InputJsonValue),
              quantity: parseInt(String(r.quantity ?? 1), 10) || 1,
              quantityType: resolveQuantityType(r.quantityType),
              optional: r.optional,
              notes: r.notes || null,
              sortOrder: index,
            })),
          });
        }
      }

      return tx.service.update({
        where: { id },
        data: {
          name: name !== undefined ? name : existingService.name,
          category: category !== undefined ? category : existingService.category,
          context: context === 'VENUE' || context === 'EVENT' || context === 'BOTH' ? context : existingService.context,
          defaultProviderType:
            defaultExecutionType === 'EXTERNAL'
              ? ExecutionType.EXTERNAL
              : defaultExecutionType === 'INTERNAL'
              ? ExecutionType.INTERNAL
              : existingService.defaultProviderType,
          priceType: isPriceType(priceType) ? priceType : existingService.priceType,
          defaultPrice: defaultPrice !== undefined ? parseFloat(defaultPrice) : existingService.defaultPrice,
          featured: typeof featured === 'boolean' ? featured : existingService.featured,
        },
        include: { inventoryRequirements: true },
      });
    });

    return NextResponse.json(serializeDecimals({ success: true, service: updatedService }));
  } catch (error: unknown) {
    console.error('Failed to update service:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Soft delete: work-order history must never be destroyed, so deactivating (rather than
    // removing the row) is always safe regardless of how many event services reference this
    // catalog entry — each one already carries its own `serviceNameSnapshot`.
    await prisma.service.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to deactivate service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
