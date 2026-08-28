import { prisma } from '@/lib/prisma';
import { PackageCardDTO } from '@/types/dtos';
import { toDisplayNumber } from '@/lib/money';
import { computePackageSeating, SeatingReq } from '@/lib/seating';

export class PackageRepository {
  /** `tenantId` is optional — omitted today (single-tenant, no identity layer); wired through so a
   * later auth pass can scope the catalog without touching call sites. */
  static async getPackageCatalog(tenantId?: string): Promise<PackageCardDTO[]> {
    const packages = await prisma.package.findMany({
      where: tenantId ? { tenantId } : {},
      orderBy: [{ context: 'asc' }, { name: 'asc' }],
      include: {
        items: {
          orderBy: { order: 'asc' },
          include: {
            service: {
              include: {
                inventoryRequirements: {
                  select: {
                    inventoryItemId: true,
                    categoryId: true,
                    quantity: true,
                    quantityType: true,
                    inventoryItem: { select: { seatingCapacity: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    return packages.map((p) => {
      // Flatten every service's inventory requirements into one list, resolved later against the
      // package's own intended capacity — the seating-sufficiency preview (prompt-2 §4/§23).
      const seatingReqs: SeatingReq[] = p.items.flatMap((pi) =>
        pi.service.inventoryRequirements.map((r) => ({
          quantityType: r.quantityType,
          quantity: toDisplayNumber(r.quantity),
          unitCount: toDisplayNumber(pi.quantity),
          seatingCapacity: r.inventoryItem?.seatingCapacity ?? 0,
          isCategoryOnly: !r.inventoryItemId && !!r.categoryId,
        }))
      );

      return {
        id: p.id,
        name: p.name,
        description: p.description,
        context: p.context,
        pricingMode: p.pricingMode,
        price: p.price !== null ? toDisplayNumber(p.price) : null,
        capacity: p.capacity,
        seatingSummary: p.capacity != null ? computePackageSeating(seatingReqs, p.capacity) : null,
        version: p.version,
        active: p.active,
        services: p.items.map((pi) => ({
          serviceId: pi.serviceId,
          name: pi.service.name,
          category: pi.service.category,
          context: pi.service.context,
          defaultExecutionType: pi.service.defaultProviderType,
          priceType: pi.service.priceType,
          defaultPrice: toDisplayNumber(pi.service.defaultPrice),
          quantity: toDisplayNumber(pi.quantity),
          priceOverride: pi.priceOverride !== null ? toDisplayNumber(pi.priceOverride) : null,
        })),
      };
    });
  }
}
