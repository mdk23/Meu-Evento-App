import { Prisma } from '@prisma/client';
import { resolveRequiredQuantity } from './service-inventory-requirements';

/**
 * Auto-seeds a `BookingServiceResourceRequirement` row per `ServiceInventoryRequirement` template the
 * given catalog service carries (Phase 14) — "adding a service to a booking creates requirement rows,
 * never a reservation" (§16/§21). Category-based requirements are seeded with `inventoryItemId: null`
 * (unresolved) — picking the actual variant happens later, at reserve time (Phase 15+), not here.
 *
 * `unitCount` is the BookingService line's own `quantity` (e.g. "10 tables" → PER_UNIT requirements on
 * that line resolve against 10, not the booking's guest count).
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
  }
): Promise<void> {
  const requirements = await tx.serviceInventoryRequirement.findMany({
    where: { serviceId: params.serviceId },
    include: { inventoryItem: { select: { name: true } } },
  });
  if (requirements.length === 0) return;

  await tx.bookingServiceResourceRequirement.createMany({
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
    })),
  });
}
