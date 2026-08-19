import PackagesClient from '@/components/services/PackagesClient';
import { PackageCatalogService } from '@/lib/services/package.service';
import { ServiceService } from '@/lib/services/service.service';

export const dynamic = 'force-dynamic';

export default async function PackagesPage() {
  const [packages, services] = await Promise.all([
    PackageCatalogService.getCatalog(),
    ServiceService.getCatalog(),
  ]);

  return <PackagesClient initialPackages={packages} initialServices={services} />;
}
