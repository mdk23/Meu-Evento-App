import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WorkOrderStatus, SupplierStatus, ServicePaymentStatus, ExecutionType, ExpenseStatus } from '@prisma/client';
import { serializeDecimals, toDisplayNumber } from '@/lib/money';
import { deriveEventStatus } from '@/lib/event-progress';

/**
 * Recomputes and writes the event's derived status (Phase 10: "Do not manually control
 * progress") from its current set of services. Called after every service create/update/delete —
 * this is the automatic path that supersedes any prior manual override the next time it runs.
 */
async function recalculateEventStatus(eventId: string): Promise<void> {
  const services = await prisma.eventService.findMany({
    where: { eventId },
    select: { sellingPrice: true, status: true },
  });
  const nextStatus = deriveEventStatus(services);
  await prisma.event.update({ where: { id: eventId }, data: { status: nextStatus } });
}

/**
 * Keeps a supplier-cost Expense in sync with an EXTERNAL EventService (Phase 9: "supplier cost
 * creates expense"). INTERNAL services never generate one — their cost is tracked directly on
 * `EventService.cost` instead. Deletes the linked Expense if the service stops being external or
 * its supplier cost drops to zero, so stale expense rows don't linger.
 */
async function syncSupplierExpense(params: {
  eventServiceId: string;
  eventId: string;
  tenantId: string;
  providerType: string;
  supplierId: string | null;
  supplierCost: number;
  serviceName: string;
  paymentStatus: string;
}) {
  const { eventServiceId, eventId, tenantId, providerType, supplierId, supplierCost, serviceName, paymentStatus } = params;

  const existingExpense = await prisma.expense.findFirst({ where: { eventServiceId } });

  if (providerType !== ExecutionType.EXTERNAL || supplierCost <= 0) {
    if (existingExpense) {
      await prisma.expense.delete({ where: { id: existingExpense.id } });
    }
    return;
  }

  const expenseStatus = paymentStatus === ServicePaymentStatus.PAID ? ExpenseStatus.PAID : ExpenseStatus.PENDING;
  const description = `Supplier cost — ${serviceName}`;

  if (existingExpense) {
    await prisma.expense.update({
      where: { id: existingExpense.id },
      data: { amount: supplierCost, supplierId, status: expenseStatus, description },
    });
  } else {
    await prisma.expense.create({
      data: {
        tenantId,
        eventId,
        eventServiceId,
        supplierId,
        description,
        amount: supplierCost,
        category: 'Supplier Cost',
        status: expenseStatus,
      },
    });
  }
}

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

    const resolvedProviderType = providerType || catalogService.defaultExecutionType;
    const parsedCost = parseFloat(cost || 0);

    const newEventService = await prisma.eventService.create({
      data: {
        eventId,
        serviceId,
        serviceNameSnapshot: catalogService.name,
        providerType: resolvedProviderType,
        sellingPrice: sellingPrice ? parseFloat(sellingPrice) : toDisplayNumber(catalogService.defaultPrice),
        cost: parsedCost,
        status: WorkOrderStatus.PLANNING,
        supplierId: supplierId || null,
        supplierCost: parsedCost,
        supplierStatus: resolvedProviderType === ExecutionType.EXTERNAL ? SupplierStatus.REQUESTED : null,
        notes: notes || '',
      },
    });

    await syncSupplierExpense({
      eventServiceId: newEventService.id,
      eventId,
      tenantId: catalogService.tenantId,
      providerType: resolvedProviderType,
      supplierId: supplierId || null,
      supplierCost: parsedCost,
      serviceName: catalogService.name,
      paymentStatus: ServicePaymentStatus.UNPAID,
    });
    await recalculateEventStatus(eventId);

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

    const existing = await prisma.eventService.findUnique({
      where: { id: eventServiceId },
      include: { service: true },
    });
    if (!existing || existing.eventId !== eventId) {
      return NextResponse.json({ error: 'Event service not found for this event' }, { status: 404 });
    }

    const resolvedSupplierId = supplierId !== undefined ? (supplierId || null) : existing.supplierId;
    const resolvedPaymentStatus = paymentStatus && Object.values(ServicePaymentStatus).includes(paymentStatus)
      ? (paymentStatus as ServicePaymentStatus)
      : existing.paymentStatus;

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
        paymentStatus: resolvedPaymentStatus,
        notes: notes || undefined,
      },
    });

    await syncSupplierExpense({
      eventServiceId: updated.id,
      eventId,
      tenantId: existing.service.tenantId,
      providerType: updated.providerType,
      supplierId: resolvedSupplierId,
      supplierCost: toDisplayNumber(updated.supplierCost),
      serviceName: existing.serviceNameSnapshot || existing.service.name,
      paymentStatus: updated.paymentStatus,
    });
    await recalculateEventStatus(eventId);

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
    await recalculateEventStatus(eventId);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to delete event service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
