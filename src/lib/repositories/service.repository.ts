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
        fieldSchema: true,
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
      fieldSchema: s.fieldSchema,
    }));
  }
}
