import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeDecimals } from '@/lib/money';
import { computeReuseCandidatesForRequirement } from '@/lib/reuse-candidates';

/**
 * Booking-scoped resource data — every `BookingService` on this booking with its `resources`, plus
 * reuse candidates and the tenant's inventory catalog for the reserve pickers. Reachable for any
 * booking regardless of whether it has an Event: no `eventId` anywhere in this query.
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
        reservedQuantity: Number(r.reservedQuantity),
        status: r.status,
        reusedFromResourceId: r.reusedFromResourceId,
      }))
    );
    const serviceLabels = Object.fromEntries(
      booking.bookingServices.map((bs) => [bs.id, bs.service?.name || bs.serviceNameSnapshot || 'Service'])
    );

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
      inventoryItems: tenant?.inventoryItems ?? [],
    }));
  } catch (error: unknown) {
    console.error('Failed to fetch booking resources:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
