import PackagesClient from '@/components/services/PackagesClient';
import { PackageCatalogService } from '@/lib/services/package.service';
import { ServiceService } from '@/lib/services/service.service';

export const dynamic = 'force-dynamic';

interface PackagesPageProps {
  searchParams: Promise<{ scope?: string }>;
}

export default async function PackagesPage({ searchParams }: PackagesPageProps) {
  const params = await searchParams;
  const scope = params.scope?.toUpperCase();

  const [packages, services] = await Promise.all([
    PackageCatalogService.getCatalog(),
    ServiceService.getCatalog(),
  ]);

  return (
    <PackagesClient
      initialPackages={packages}
      initialServices={services}
      initialScopeFilter={scope === 'VENUE' || scope === 'EVENT' ? scope : 'ALL'}
    />
  );
}
