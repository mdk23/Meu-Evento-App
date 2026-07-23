import { prisma } from '@/lib/prisma';

export class ResourceRepository {
  static async getResourcesData() {
    const [space, inventory, staff, suppliers] = await Promise.all([
      prisma.space.findFirst({
        select: { id: true, name: true, capacity: true, address: true, description: true },
      }),
      prisma.inventoryItem.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, quantity: true, category: true },
      }),
      prisma.staff.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, role: true, email: true, phone: true },
      }),
      prisma.supplier.findMany({
        orderBy: { name: 'asc' },
        select: { id: true, name: true, category: true, email: true, phone: true },
      }),
    ]);

    return { space, inventory, staff, suppliers };
  }
}
