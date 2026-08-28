import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeDecimals } from '@/lib/money';
import { computeReuseCandidatesForRequirement } from '@/lib/reuse-candidates';
import { computeEventResourceSummary } from '@/lib/event-resource-summary';
import { ACTIVE_RESOURCE_STATUSES } from '@/lib/resource-conflict';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        booking: {
          include: {
            client: true,
            scheduledPayments: { where: { plan: { active: true } } },
            paymentTransactions: { orderBy: { date: 'desc' }, include: { scheduledPayment: true } },
          },
        },
        bookingServices: {
          include: {
            service: true,
            supplier: true,
            serviceTasks: true,
            staffAssignments: { include: { staff: true } },
            resources: {
              include: {
                inventoryItem: true,
                transactions: true,
                sourceRequirement: { select: { categoryId: true, category: { select: { name: true } } } },
              },
            },
          },
        },
        guests: true,
        expenses: {
          include: {
            supplier: true,
          },
        },
        statusOverrides: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Reuse candidates are computed here, not fetched via a Prisma include — they're a cross-service
    // comparison ("Venue already reserved this, reuse it?"), not a relation. Flatten once across the
    // whole event so `computeReuseCandidatesForRequirement` can compare each row against every
    // *other* service's active resources for the same item.
    const allResources = event.bookingServices.flatMap((bs) =>
      bs.resources.map((r) => ({
        id: r.id,
        bookingServiceId: r.bookingServiceId,
        inventoryItemId: r.inventoryItemId,
        itemNameSnapshot: r.itemNameSnapshot,
        categoryName: r.sourceRequirement?.category?.name ?? null,
        requiredQuantity: Number(r.requiredQuantity),
        reservedQuantity: Number(r.reservedQuantity),
        status: r.status,
        reusedFromResourceId: r.reusedFromResourceId,
      }))
    );
    const serviceLabels = Object.fromEntries(
      event.bookingServices.map((bs) => [bs.id, bs.service?.name || bs.serviceNameSnapshot || 'Service'])
    );

    // Event Resources tab needs tenant-wide availability per resolved item — not just this event's
    // own resources — so a shortage can be told apart from a coverable gap. Batched into 2 queries
    // regardless of how many distinct items this event's resources reference.
    const resolvedItemIds = Array.from(new Set(allResources.map((r) => r.inventoryItemId).filter((v): v is string => !!v)));
    const [itemsForAvailability, resourcesForAvailability] = await Promise.all([
      resolvedItemIds.length > 0
        ? prisma.inventoryItem.findMany({ where: { id: { in: resolvedItemIds } }, select: { id: true, totalQuantity: true } })
        : Promise.resolve([]),
      resolvedItemIds.length > 0
        ? prisma.bookingServiceResource.findMany({
            where: { inventoryItemId: { in: resolvedItemIds }, status: { in: ACTIVE_RESOURCE_STATUSES }, reusedFromResourceId: null },
            select: { inventoryItemId: true, reservedQuantity: true },
          })
        : Promise.resolve([]),
    ]);
    const availableByItemId: Record<string, number> = {};
    for (const item of itemsForAvailability) {
      const reservedElsewhere = resourcesForAvailability
        .filter((r) => r.inventoryItemId === item.id)
        .reduce((sum, r) => sum + Number(r.reservedQuantity), 0);
      availableByItemId[item.id] = Math.max(item.totalQuantity - reservedElsewhere, 0);
    }

    const resourceSummary = computeEventResourceSummary(allResources, availableByItemId, serviceLabels);

    const eventWithReuseCandidates = {
      ...event,
      bookingServices: event.bookingServices.map((bs) => ({
        ...bs,
        resources: bs.resources.map((r) => ({
          ...r,
          reuseCandidates: computeReuseCandidatesForRequirement(
            {
              id: r.id,
              bookingServiceId: r.bookingServiceId,
              inventoryItemId: r.inventoryItemId,
              itemNameSnapshot: r.itemNameSnapshot,
              reservedQuantity: Number(r.reservedQuantity),
              status: r.status,
              reusedFromResourceId: r.reusedFromResourceId,
            },
            allResources,
            serviceLabels
          ),
        })),
      })),
    };

    // Only active catalog entries should be selectable when assigning staff/inventory/suppliers/services
    // to a work order — an already-assigned (now-inactive) one still displays fine via the bookingServices
    // include above, since that's a live join on whatever is actually assigned, not this picker list.
    const tenant = await prisma.tenant.findFirst({
      include: {
        venue: true,
        suppliers: { where: { active: true } },
        staff: { where: { active: true } },
        inventoryItems: { where: { active: true } },
        services: { where: { active: true } },
      },
    });

    return NextResponse.json(serializeDecimals({
      event: eventWithReuseCandidates,
      resourceSummary,
      venue: tenant?.venue,
      suppliers: tenant?.suppliers,
      staff: tenant?.staff,
      catalogServices: tenant?.services,
      inventoryItems: tenant?.inventoryItems,
    }));
  } catch (error: unknown) {
    console.error('Failed to fetch event detail:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();

    // Status is intentionally not accepted here — it's derived from service progress
    // automatically, or changed via the audited override path (PATCH /api/bookings/[id]).
    const updatedEvent = await prisma.event.update({
      where: { id },
      data: {
        name: body.name,
        notes: body.notes,
        guestCount: body.guestCount ? parseInt(body.guestCount, 10) : undefined,
      },
    });

    return NextResponse.json({ success: true, event: updatedEvent });
  } catch (error: unknown) {
    console.error('Failed to update event:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
