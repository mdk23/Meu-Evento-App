import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ExecutionType, ServiceWorkOrderStatus } from '@prisma/client';

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

    const newEventService = await prisma.eventService.create({
      data: {
        eventId,
        serviceId,
        providerType: providerType || catalogService.executionType,
        sellingPrice: parseFloat(sellingPrice || catalogService.defaultPrice),
        cost: parseFloat(cost || 0),
        status: ServiceWorkOrderStatus.PLANNING,
        supplierId: supplierId || null,
        supplierCost: parseFloat(cost || 0),
        supplierStatus: ServiceWorkOrderStatus.REQUESTED,
        notes: notes || '',
      },
    });

    return NextResponse.json({ success: true, eventService: newEventService }, { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to add service to event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await params;
    const body = await request.json();
    const { 
      eventServiceId, 
      status, 
      customFields, 
      tasks, 
      assignedStaff, 
      reservedInventory, 
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

    const updated = await prisma.eventService.update({
      where: { id: eventServiceId },
      data: {
        status: status as ServiceWorkOrderStatus,
        customFields: typeof customFields === 'object' ? JSON.stringify(customFields) : customFields,
        tasks: typeof tasks === 'object' ? JSON.stringify(tasks) : tasks,
        assignedStaff: typeof assignedStaff === 'object' ? JSON.stringify(assignedStaff) : assignedStaff,
        reservedInventory: typeof reservedInventory === 'object' ? JSON.stringify(reservedInventory) : reservedInventory,
        sellingPrice: sellingPrice !== undefined ? parseFloat(sellingPrice) : undefined,
        cost: cost !== undefined ? parseFloat(cost) : undefined,
        supplierId: supplierId || undefined,
        supplierCost: supplierCost !== undefined ? parseFloat(supplierCost) : undefined,
        supplierStatus: supplierStatus as ServiceWorkOrderStatus,
        paymentStatus: paymentStatus || undefined,
        notes: notes || undefined,
      },
    });

    return NextResponse.json({ success: true, eventService: updated });
  } catch (error: unknown) {
    console.error('Failed to update event service work order:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventServiceId = searchParams.get('eventServiceId');

    if (!eventServiceId) {
      return NextResponse.json({ error: 'eventServiceId query param is required' }, { status: 400 });
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
