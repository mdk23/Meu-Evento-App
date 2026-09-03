import { prisma } from '@/lib/prisma';
import { InventoryTypeDTO } from '@/types/dtos';
import { readAttributeDefs } from '@/lib/inventory-attributes';

export class InventoryTypeRepository {
  /** Active types with their category name, for pickers and the Settings manager. */
  static async getTypes(tenantId?: string): Promise<InventoryTypeDTO[]> {
    const types = await prisma.inventoryType.findMany({
      where: { active: true, ...(tenantId ? { tenantId } : {}) },
      orderBy: [{ category: { name: 'asc' } }, { name: 'asc' }],
      select: {
        id: true,
        categoryId: true,
        category: { select: { name: true } },
        name: true,
        code: true,
        attributeDefs: true,
        active: true,
      },
    });

    return types.map((t) => ({
      id: t.id,
      categoryId: t.categoryId,
      categoryName: t.category.name,
      name: t.name,
      code: t.code,
      attributeDefs: readAttributeDefs(t.attributeDefs),
      active: t.active,
    }));
  }
}
