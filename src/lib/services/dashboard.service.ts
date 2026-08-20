import { DashboardRepository } from '@/lib/repositories/dashboard.repository';
import { DashboardDTO, SpaceDashboardDTO } from '@/types/dtos';

export class DashboardService {
  static async getDashboardSummary(): Promise<DashboardDTO> {
    return DashboardRepository.getDashboardData();
  }

  static async getEventDashboardSummary(): Promise<DashboardDTO> {
    return DashboardRepository.getEventDashboardData();
  }

  static async getSpaceDashboardSummary(): Promise<SpaceDashboardDTO> {
    return DashboardRepository.getSpaceDashboardData();
  }
}
