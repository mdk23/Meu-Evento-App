import { PackageRepository } from '@/lib/repositories/package.repository';
import { PackageCardDTO } from '@/types/dtos';

export class PackageCatalogService {
  static async getCatalog(): Promise<PackageCardDTO[]> {
    return PackageRepository.getPackageCatalog();
  }
}
