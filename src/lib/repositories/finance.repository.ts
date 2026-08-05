import { prisma } from '@/lib/prisma';
import { FinanceSummaryDTO } from '@/types/dtos';
import { subtractMoneyFloor0, toDisplayNumber } from '@/lib/money';

export class FinanceRepository {
  static async getFinanceSummary(): Promise<FinanceSummaryDTO> {
    const [
      revenueAggregate,
      pendingAggregate,
      expenseAggregate,
      recentPaymentsRaw,
      recentExpensesRaw,
    ] = await Promise.all([
      // DB-native SQL SUM
      prisma.paymentTransaction.aggregate({
        _sum: { amount: true },
      }),
      prisma.scheduledPayment.aggregate({
        _sum: { amount: true, paidAmount: true },
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID' },
      }),
      // Recent Payments projection
      prisma.paymentTransaction.findMany({
        take: 10,
        orderBy: { date: 'desc' },
        select: {
          id: true,
          amount: true,
          method: true,
          date: true,
          scheduledPayment: {
            select: { status: true }
          },
          booking: {
            select: {
              client: { select: { name: true } },
            },
          },
        },
      }),
      // Recent Expenses projection
      prisma.expense.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          description: true,
          amount: true,
          category: true,
          status: true,
        },
      }),
    ]);

    const totalRevenue = toDisplayNumber(revenueAggregate._sum.amount);
    const pendingInvoicesAmount = toDisplayNumber(subtractMoneyFloor0(pendingAggregate._sum.amount, pendingAggregate._sum.paidAmount));
    const totalExpensesAmount = toDisplayNumber(expenseAggregate._sum.amount);
    const netProfit = totalRevenue - totalExpensesAmount;

    return {
      totalRevenue,
      pendingInvoicesAmount,
      totalExpensesAmount,
      netProfit,
      recentPayments: recentPaymentsRaw.map((pt) => ({
        id: pt.id,
        amount: toDisplayNumber(pt.amount),
        status: pt.scheduledPayment?.status || 'PAID',
        date: pt.date.toISOString(),
        clientName: pt.booking?.client?.name || 'N/A',
        method: pt.method,
      })),
      recentExpenses: recentExpensesRaw.map((exp) => ({
        id: exp.id,
        description: exp.description,
        amount: toDisplayNumber(exp.amount),
        category: exp.category,
        status: exp.status,
      })),
    };
  }
}
