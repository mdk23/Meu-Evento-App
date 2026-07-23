import { FinanceRepository } from '@/lib/repositories/finance.repository';
import { FinanceSummaryDTO } from '@/types/dtos';

export class FinanceService {
  static async getSummary(): Promise<FinanceSummaryDTO> {
    return FinanceRepository.getFinanceSummary();
  }
}
