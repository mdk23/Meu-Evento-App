import ClientsClient from '@/components/clients/ClientsClient';
import { ClientService } from '@/lib/services/client.service';

export const dynamic = 'force-dynamic';

export default async function ClientsPage() {
  const clients = await ClientService.getClients();
  return <ClientsClient initialClients={clients} />;
}
