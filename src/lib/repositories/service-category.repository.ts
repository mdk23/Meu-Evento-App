import { prisma } from '@/lib/prisma';

export class ServiceCategoryRepository {
  static async getCategories() {
    return prisma.serviceCategory.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, description: true },
    });
  }
}
