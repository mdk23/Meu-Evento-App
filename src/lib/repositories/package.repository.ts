import { prisma } from '@/lib/prisma';
import { PackageCardDTO } from '@/types/dtos';
import { toDisplayNumber } from '@/lib/money';

export class PackageRepository {
  static async getPackageCatalog(): Promise<PackageCardDTO[]> {
    const packages = await prisma.servicePackage.findMany({
      orderBy: [{ scope: 'asc' }, { name: 'asc' }],
      include: {
        services: {
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
      services: p.services.map((ps) => ({
        serviceId: ps.serviceId,
        name: ps.service.name,
        category: ps.service.category,
        defaultExecutionType: ps.service.defaultExecutionType,
        priceType: ps.service.priceType,
        defaultPrice: toDisplayNumber(ps.service.defaultPrice),
      })),
    }));
  }
}
