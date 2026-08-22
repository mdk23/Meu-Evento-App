import ServicesClient from '@/components/services/ServicesClient';
import { ServiceService } from '@/lib/services/service.service';

export const dynamic = 'force-dynamic';

interface ServicesPageProps {
  searchParams: Promise<{ scope?: string }>;
}

export default async function ServicesCatalogPage({ searchParams }: ServicesPageProps) {
  const params = await searchParams;
  const scope = params.scope?.toUpperCase();

  const services = await ServiceService.getCatalog();

  return (
    <ServicesClient
      initialServices={services}
      initialScopeFilter={scope === 'SPACE' || scope === 'EVENT' ? scope : 'ALL'}
    />
  );
}
