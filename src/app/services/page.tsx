import ServicesClient from '@/components/services/ServicesClient';
import { ServiceService } from '@/lib/services/service.service';

export const dynamic = 'force-dynamic';

export default async function ServicesCatalogPage() {
  const services = await ServiceService.getCatalog();
  return <ServicesClient initialServices={services} />;
}
