import ResourcesClient from '@/components/resources/ResourcesClient';
import { ResourceService } from '@/lib/services/resource.service';

export const dynamic = 'force-dynamic';

export default async function ResourcesPage() {
  const data = await ResourceService.getResources();
  return <ResourcesClient initialData={data} />;
}
