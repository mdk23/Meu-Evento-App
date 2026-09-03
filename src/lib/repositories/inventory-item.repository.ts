import { prisma } from '@/lib/prisma';

export class InventoryItemRepository {
  /** Lean listing for pickers (Service editor's requirement rows) — not the full resource-page shape. */
  static async getItemOptions() {
    return prisma.inventoryItem.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, inventoryTypeId: true, categoryId: true, attributes: true },
    });
  }

  /** Full detail for the item detail page — stock, every booked resource row, and the full
   * movement ledger, each with enough context (event/service name) to be readable on its own. */
  static async getItemDetail(id: string) {
    return prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        category: true,
        inventoryType: { include: { category: true } },
        bookingResources: {
          orderBy: { startAt: 'desc' },
          include: {
            bookingService: {
              select: {
                service: { select: { name: true } },
                serviceNameSnapshot: true,
                event: { select: { name: true } },
              },
            },
          },
        },
        transactions: {
          orderBy: { createdAt: 'desc' },
          include: {
            event: { select: { name: true } },
            bookingService: { select: { service: { select: { name: true } }, serviceNameSnapshot: true } },
          },
        },
      },
    });
  }
}
