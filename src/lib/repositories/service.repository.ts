import { prisma } from '@/lib/prisma';
import { ServiceCardDTO } from '@/types/dtos';
import { toDisplayNumber } from '@/lib/money';

export class ServiceRepository {
  /** `tenantId` is optional — omitted today (single-tenant, no identity layer); wired through so a
   * later auth pass can scope the catalog without touching call sites. */
  static async getServiceCatalog(tenantId?: string): Promise<ServiceCardDTO[]> {
    const services = await prisma.service.findMany({
      where: { active: true, ...(tenantId ? { tenantId } : {}) },
      orderBy: [{ featured: 'desc' }, { name: 'asc' }],
      select: {
        id: true,
        name: true,
        category: true,
        context: true,
        defaultProviderType: true,
        priceType: true,
        defaultPrice: true,
        featured: true,
        inventoryRequirements: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            inventoryItemId: true,
            inventoryItem: { select: { name: true } },
            inventoryTypeId: true,
            inventoryType: { select: { name: true } },
            matchCriteria: true,
            categoryId: true,
            category: { select: { name: true } },
            quantity: true,
            quantityType: true,
            optional: true,
            notes: true,
          },
        },
      },
    });

    return services.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      context: s.context,
      defaultExecutionType: s.defaultProviderType,
      priceType: s.priceType,
      defaultPrice: toDisplayNumber(s.defaultPrice),
      featured: s.featured,
      inventoryRequirements: s.inventoryRequirements.map((r) => ({
        id: r.id,
        inventoryItemId: r.inventoryItemId,
        inventoryItemName: r.inventoryItem?.name || null,
        inventoryTypeId: r.inventoryTypeId,
        inventoryTypeName: r.inventoryType?.name || null,
        matchCriteria: (r.matchCriteria ?? null) as Record<string, unknown> | null,
        categoryId: r.categoryId,
        categoryName: r.category?.name || null,
        quantity: toDisplayNumber(r.quantity),
        // MANUAL was removed as an option — any legacy row still carrying it displays as Fixed
        // until the service is re-saved (its stored behaviour is unchanged in the meantime).
        quantityType: r.quantityType === 'MANUAL' ? 'FIXED' : r.quantityType,
        optional: r.optional,
        notes: r.notes,
      })),
    }));
  }
}
