import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeDecimals } from '@/lib/money';
import { computeReuseCandidatesForRequirement } from '@/lib/reuse-candidates';
import { computeResourceSummary } from '@/lib/event-resource-summary';
import { ACTIVE_RESOURCE_STATUSES } from '@/lib/resource-conflict';

/**
 * Booking-scoped resource data — every `BookingService` on this booking with its `resources`, plus
 * reuse candidates, a Required/Reserved/Available/Shortage summary, and the tenant's inventory
 * catalog for the reserve pickers. Reachable for any booking regardless of whether it has an Event:
 * no `eventId` anywhere in this query.
 */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: bookingId } = await params;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        bookingServices: {
          include: {
            service: true,
            resources: {
              include: {
                inventoryItem: true,
                transactions: true,
                sourceRequirement: { select: { categoryId: true, category: { select: { name: true } } } },
              },
            },
          },
        },
      },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const allResources = booking.bookingServices.flatMap((bs) =>
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
        transactions: r.transactions.map((t) => ({ type: t.type, quantity: Number(t.quantity) })),
      }))
    );
    const serviceLabels = Object.fromEntries(
      booking.bookingServices.map((bs) => [bs.id, bs.service?.name || bs.serviceNameSnapshot || 'Service'])
    );

    // Tenant-wide availability per resolved item — not just this booking's own resources — so a real
    // shortage can be told apart from a coverable gap. Batched into 2 queries regardless of how many
    // distinct items this booking references.
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

    const resourceSummary = computeResourceSummary(allResources, availableByItemId, serviceLabels);

    const bookingWithReuseCandidates = {
      ...booking,
      bookingServices: booking.bookingServices.map((bs) => ({
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

    const tenant = await prisma.tenant.findFirst({
      include: { inventoryItems: { where: { active: true } } },
    });

    return NextResponse.json(serializeDecimals({
      booking: bookingWithReuseCandidates,
      resourceSummary,
      inventoryItems: tenant?.inventoryItems ?? [],
    }));
  } catch (error: unknown) {
    console.error('Failed to fetch booking resources:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
