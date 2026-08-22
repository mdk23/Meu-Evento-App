import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ExecutionType } from '@prisma/client';
import { serializeDecimals } from '@/lib/money';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, category, defaultExecutionType, priceType, defaultPrice, fieldSchema } = body;

    const existingService = await prisma.service.findUnique({
      where: { id },
    });

    if (!existingService) {
      return NextResponse.json({ error: 'Service not found' }, { status: 404 });
    }

    const updatedService = await prisma.service.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existingService.name,
        category: category !== undefined ? category : existingService.category,
        defaultProviderType:
          defaultExecutionType === 'EXTERNAL'
            ? ExecutionType.EXTERNAL
            : defaultExecutionType === 'INTERNAL'
            ? ExecutionType.INTERNAL
            : existingService.defaultProviderType,
        priceType: priceType !== undefined ? priceType : existingService.priceType,
        defaultPrice: defaultPrice !== undefined ? parseFloat(defaultPrice) : existingService.defaultPrice,
        fieldSchema: Array.isArray(fieldSchema) ? fieldSchema : undefined,
      },
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
