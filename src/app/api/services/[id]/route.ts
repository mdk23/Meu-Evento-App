import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ExecutionType } from '@prisma/client';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, category, executionType, priceType, defaultPrice } = body;

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
        executionType:
          executionType === 'EXTERNAL'
            ? ExecutionType.EXTERNAL
            : executionType === 'INTERNAL'
            ? ExecutionType.INTERNAL
            : existingService.executionType,
        priceType: priceType !== undefined ? priceType : existingService.priceType,
        defaultPrice: defaultPrice !== undefined ? parseFloat(defaultPrice) : existingService.defaultPrice,
      },
    });

    return NextResponse.json({ success: true, service: updatedService });
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

    // Check if service is referenced in any bookings/eventServices
    const eventServicesCount = await prisma.eventService.count({
      where: { serviceId: id },
    });

    if (eventServicesCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete service that is linked to active events.' },
        { status: 400 }
      );
    }

    await prisma.service.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to delete service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
