import { ClientRepository, GetClientListParams } from '@/lib/repositories/client.repository';
import { ClientListPageDTO } from '@/types/dtos';

export class ClientService {
  static async getClients(params: GetClientListParams = {}): Promise<ClientListPageDTO> {
    return ClientRepository.getClientList(params);
  }
}
