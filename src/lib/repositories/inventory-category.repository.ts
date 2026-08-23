import { prisma } from '@/lib/prisma';

export class InventoryCategoryRepository {
  static async getCategories() {
    return prisma.inventoryCategory.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, description: true },
    });
  }
}
