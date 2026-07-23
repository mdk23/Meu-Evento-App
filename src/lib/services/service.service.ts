import { ServiceRepository } from '@/lib/repositories/service.repository';
import { ServiceCardDTO } from '@/types/dtos';

export class ServiceService {
  static async getCatalog(): Promise<ServiceCardDTO[]> {
    return ServiceRepository.getServiceCatalog();
  }
}
