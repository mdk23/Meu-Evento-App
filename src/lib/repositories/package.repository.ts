import { prisma } from '@/lib/prisma';
import { PackageCardDTO } from '@/types/dtos';
import { toDisplayNumber } from '@/lib/money';

export class PackageRepository {
  static async getPackageCatalog(): Promise<PackageCardDTO[]> {
    const packages = await prisma.package.findMany({
      orderBy: [{ scope: 'asc' }, { name: 'asc' }],
      include: {
        items: {
          orderBy: { order: 'asc' },
          include: { service: true },
        },
      },
    });

    return packages.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      scope: p.scope,
      active: p.active,
      services: p.items.map((pi) => ({
        serviceId: pi.serviceId,
        name: pi.service.name,
        category: pi.service.category,
        scope: pi.service.scope,
        defaultExecutionType: pi.service.defaultProviderType,
        priceType: pi.service.priceType,
        defaultPrice: toDisplayNumber(pi.service.defaultPrice),
        quantity: toDisplayNumber(pi.quantity),
        priceOverride: pi.priceOverride !== null ? toDisplayNumber(pi.priceOverride) : null,
      })),
    }));
  }
}
