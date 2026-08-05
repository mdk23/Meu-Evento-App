import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WorkOrderStatus, SupplierStatus, ServicePaymentStatus, ExecutionType } from '@prisma/client';
import { serializeDecimals, toDisplayNumber } from '@/lib/money';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const eventId = resolvedParams.id;
    const body = await request.json();
    const { serviceId, sellingPrice, cost, providerType, supplierId, notes } = body;

    const catalogService = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!catalogService) {
      return NextResponse.json({ error: 'Service catalog item not found' }, { status: 404 });
    }

    const resolvedProviderType = providerType || catalogService.executionType;

    const newEventService = await prisma.eventService.create({
      data: {
        eventId,
        serviceId,
        serviceNameSnapshot: catalogService.name,
        providerType: resolvedProviderType,
        sellingPrice: sellingPrice ? parseFloat(sellingPrice) : toDisplayNumber(catalogService.defaultPrice),
        cost: parseFloat(cost || 0),
        status: WorkOrderStatus.PLANNING,
        supplierId: supplierId || null,
        supplierCost: parseFloat(cost || 0),
        supplierStatus: resolvedProviderType === ExecutionType.EXTERNAL ? SupplierStatus.REQUESTED : null,
        notes: notes || '',
      },
    });

    return NextResponse.json(serializeDecimals({ success: true, eventService: newEventService }), { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to add service to event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: eventId } = await params;
    const body = await request.json();
    const {
      eventServiceId,
      status,
      customFields,
      sellingPrice,
      cost,
      supplierId,
      supplierCost,
      supplierStatus,
      paymentStatus,
      notes
    } = body;

    if (!eventServiceId) {
      return NextResponse.json({ error: 'eventServiceId is required' }, { status: 400 });
    }

    const existing = await prisma.eventService.findUnique({ where: { id: eventServiceId } });
    if (!existing || existing.eventId !== eventId) {
      return NextResponse.json({ error: 'Event service not found for this event' }, { status: 404 });
    }

    const updated = await prisma.eventService.update({
      where: { id: eventServiceId },
      data: {
        status: status && Object.values(WorkOrderStatus).includes(status) ? (status as WorkOrderStatus) : undefined,
        customFields: typeof customFields === 'object' ? JSON.stringify(customFields) : customFields,
        sellingPrice: sellingPrice !== undefined ? parseFloat(sellingPrice) : undefined,
        cost: cost !== undefined ? parseFloat(cost) : undefined,
        supplierId: supplierId || undefined,
        supplierCost: supplierCost !== undefined ? parseFloat(supplierCost) : undefined,
        supplierStatus:
          existing.providerType === ExecutionType.INTERNAL
            ? null
            : supplierStatus && Object.values(SupplierStatus).includes(supplierStatus)
            ? (supplierStatus as SupplierStatus)
            : undefined,
        paymentStatus: paymentStatus && Object.values(ServicePaymentStatus).includes(paymentStatus) ? (paymentStatus as ServicePaymentStatus) : undefined,
        notes: notes || undefined,
      },
    });

    return NextResponse.json(serializeDecimals({ success: true, eventService: updated }));
  } catch (error: unknown) {
    console.error('Failed to update event service work order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: eventId } = await params;
    const { searchParams } = new URL(request.url);
    const eventServiceId = searchParams.get('eventServiceId');

    if (!eventServiceId) {
      return NextResponse.json({ error: 'eventServiceId query param is required' }, { status: 400 });
    }

    const existing = await prisma.eventService.findUnique({ where: { id: eventServiceId } });
    if (!existing || existing.eventId !== eventId) {
      return NextResponse.json({ error: 'Event service not found for this event' }, { status: 404 });
    }

    await prisma.eventService.delete({
      where: { id: eventServiceId },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to delete event service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
