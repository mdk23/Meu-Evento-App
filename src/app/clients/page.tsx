import ClientsClient from '@/components/clients/ClientsClient';
import { ClientService } from '@/lib/services/client.service';

export const dynamic = 'force-dynamic';

interface ClientsPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function ClientsPage({ searchParams }: ClientsPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1);

  const data = await ClientService.getClients({ page });

  return <ClientsClient data={data} />;
}
