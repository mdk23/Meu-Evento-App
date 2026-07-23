import { prisma } from '@/lib/prisma';
import { FinanceSummaryDTO } from '@/types/dtos';

export class FinanceRepository {
  static async getFinanceSummary(): Promise<FinanceSummaryDTO> {
    const [
      revenueAggregate,
      pendingAggregate,
      expenseAggregate,
      recentInvoicesRaw,
      recentExpensesRaw,
    ] = await Promise.all([
      // DB-native SQL SUM
      prisma.invoice.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID' },
      }),
      prisma.invoice.aggregate({
        _sum: { amount: true },
        where: { status: 'PENDING' },
      }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID' },
      }),
      // Recent Invoices projection
      prisma.invoice.findMany({
        take: 10,
        orderBy: { dueDate: 'desc' },
        select: {
          id: true,
          amount: true,
          status: true,
          dueDate: true,
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

    const totalRevenue = revenueAggregate._sum.amount || 0;
    const pendingInvoicesAmount = pendingAggregate._sum.amount || 0;
    const totalExpensesAmount = expenseAggregate._sum.amount || 0;
    const netProfit = totalRevenue - totalExpensesAmount;

    return {
      totalRevenue,
      pendingInvoicesAmount,
      totalExpensesAmount,
      netProfit,
      recentInvoices: recentInvoicesRaw.map((inv) => ({
        id: inv.id,
        amount: inv.amount,
        status: inv.status,
        dueDate: inv.dueDate.toISOString(),
        clientName: inv.booking?.client?.name || 'N/A',
      })),
      recentExpenses: recentExpensesRaw.map((exp) => ({
        id: exp.id,
        description: exp.description,
        amount: exp.amount,
        category: exp.category,
        status: exp.status,
      })),
    };
  }
}
