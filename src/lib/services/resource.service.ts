import { ResourceRepository } from '@/lib/repositories/resource.repository';

export class ResourceService {
  static async getResources() {
    return ResourceRepository.getResourcesData();
  }
}
