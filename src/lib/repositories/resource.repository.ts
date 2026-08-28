import { prisma } from '@/lib/prisma';

export class ResourceRepository {
  static async getResourcesData() {
    const [venue, inventory, staff, suppliers, inventoryCategories] = await Promise.all([
      prisma.venue.findFirst({
        select: { id: true, name: true, capacity: true, address: true, description: true },
      }),
      prisma.inventoryItem.findMany({
        where: { active: true },
        orderBy: { name: 'asc' },
        select: { id: true, name: true, totalQuantity: true, seatingCapacity: true, categoryId: true, category: { select: { name: true } } },
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
    ]);

    return { venue, inventory, staff, suppliers, inventoryCategories };
  }
}
