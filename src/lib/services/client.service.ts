import { ClientRepository } from '@/lib/repositories/client.repository';
import { ClientCardDTO } from '@/types/dtos';

export class ClientService {
  static async getClients(): Promise<ClientCardDTO[]> {
    return ClientRepository.getClientList();
  }
}
