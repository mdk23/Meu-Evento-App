import { DashboardRepository } from '@/lib/repositories/dashboard.repository';
import { DashboardDTO, VenueDashboardDTO } from '@/types/dtos';

export class DashboardService {
  static async getDashboardSummary(): Promise<DashboardDTO> {
    return DashboardRepository.getDashboardData();
  }

  static async getEventDashboardSummary(): Promise<DashboardDTO> {
    return DashboardRepository.getEventDashboardData();
  }

  static async getVenueDashboardSummary(): Promise<VenueDashboardDTO> {
    return DashboardRepository.getVenueDashboardData();
  }
}
