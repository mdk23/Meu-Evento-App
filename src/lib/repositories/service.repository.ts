import { prisma } from '@/lib/prisma';
import { ServiceCardDTO } from '@/types/dtos';

export class ServiceRepository {
  static async getServiceCatalog(): Promise<ServiceCardDTO[]> {
    const services = await prisma.service.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        category: true,
        executionType: true,
        priceType: true,
        defaultPrice: true,
      },
    });

    return services.map((s) => ({
      id: s.id,
      name: s.name,
      category: s.category,
      executionType: s.executionType,
      priceType: s.priceType,
      defaultPrice: s.defaultPrice,
    }));
  }
}
