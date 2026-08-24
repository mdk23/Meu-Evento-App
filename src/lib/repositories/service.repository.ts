import { prisma } from '@/lib/prisma';
import { ServiceCardDTO } from '@/types/dtos';
import { toDisplayNumber } from '@/lib/money';

export class ServiceRepository {
  static async getServiceCatalog(): Promise<ServiceCardDTO[]> {
    const services = await prisma.service.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        category: true,
        scope: true,
        defaultProviderType: true,
        priceType: true,
        defaultPrice: true,
        inventoryRequirements: {
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            inventoryItemId: true,
            inventoryItem: { select: { name: true } },
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
      scope: s.scope,
      defaultExecutionType: s.defaultProviderType,
      priceType: s.priceType,
      defaultPrice: toDisplayNumber(s.defaultPrice),
      inventoryRequirements: s.inventoryRequirements.map((r) => ({
        id: r.id,
        inventoryItemId: r.inventoryItemId,
        inventoryItemName: r.inventoryItem?.name || null,
        categoryId: r.categoryId,
        categoryName: r.category?.name || null,
        quantity: toDisplayNumber(r.quantity),
        quantityType: r.quantityType,
        optional: r.optional,
        notes: r.notes,
      })),
    }));
  }
}
