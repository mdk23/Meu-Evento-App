import { Prisma } from '@prisma/client';
import { resolveRequiredQuantity } from './service-inventory-requirements';

/**
 * Auto-seeds a `BookingServiceResource` row at `PLANNED` per `ServiceInventoryRequirement` template
 * the given catalog service carries — "adding a service to a booking creates resource rows, never a
 * reservation." Category-based requirements are seeded with `inventoryItemId: null` (unresolved) —
 * picking the actual variant happens later, at reserve time, not here.
 *
 * `unitCount` is the BookingService line's own `quantity` (e.g. "10 tables" → PER_UNIT requirements on
 * that line resolve against 10, not the booking's guest count). `startAt`/`endAt` default every seeded
 * row to the parent booking's own span — the resource's real need window can be narrowed later, at
 * reserve time, if it differs from the full booking.
 */
export async function seedResourceRequirementsForBookingService(
  tx: Prisma.TransactionClient,
  params: {
    tenantId: string;
    bookingId: string;
    bookingServiceId: string;
    serviceId: string;
    guestCount: number;
    unitCount: number;
    startAt: Date;
    endAt: Date;
  }
): Promise<void> {
  const requirements = await tx.serviceInventoryRequirement.findMany({
    where: { serviceId: params.serviceId },
    include: { inventoryItem: { select: { name: true } } },
  });
  if (requirements.length === 0) return;

  await tx.bookingServiceResource.createMany({
    data: requirements.map((r) => ({
      tenantId: params.tenantId,
      bookingId: params.bookingId,
      bookingServiceId: params.bookingServiceId,
      inventoryItemId: r.inventoryItemId,
      itemNameSnapshot: r.inventoryItem?.name ?? null,
      requiredQuantity: resolveRequiredQuantity({
        quantityType: r.quantityType,
        quantity: r.quantity,
        guestCount: params.guestCount,
        unitCount: params.unitCount,
      }),
      quantityType: r.quantityType,
      sourceRequirementId: r.id,
      notes: r.notes,
      startAt: params.startAt,
      endAt: params.endAt,
    })),
  });
}
