import { prisma } from '@/lib/prisma';
import { InventoryTypeRepository } from '@/lib/repositories/inventory-type.repository';

export class ResourceRepository {
  static async getResourcesData() {
    const [venue, inventory, staff, suppliers, inventoryCategories, inventoryTypes] = await Promise.all([
      prisma.venue.findFirst({
        select: { id: true, name: true, capacity: true, address: true, description: true },
      }),
      prisma.inventoryItem.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
        select: {
          id: true,
          name: true,
          sku: true,
          totalQuantity: true,
          unit: true,
          attributes: true,
          inventoryTypeId: true,
          inventoryType: {
            select: {
              id: true,
              name: true,
              code: true,
              attributeDefs: true,
              category: { select: { id: true, name: true } },
            },
          },
        },
      }),
      prisma.staff.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, role: true, email: true, phone: true },
      }),
      prisma.supplier.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, category: true, email: true, phone: true },
      }),
      prisma.inventoryCategory.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true },
      }),
      InventoryTypeRepository.getTypes(),
    ]);

    return { venue, inventory, staff, suppliers, inventoryCategories, inventoryTypes };
  }
}
