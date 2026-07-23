import { DashboardRepository } from '@/lib/repositories/dashboard.repository';
import { DashboardDTO } from '@/types/dtos';

export class DashboardService {
  static async getDashboardSummary(): Promise<DashboardDTO> {
    return DashboardRepository.getDashboardData();
  }
}
