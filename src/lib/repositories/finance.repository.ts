import { prisma } from '@/lib/prisma';
import { FinanceSummaryDTO } from '@/types/dtos';
import { subtractMoneyFloor0, toDisplayNumber } from '@/lib/money';
import { calculateRevenue, calculateInternalCost, calculateSupplierCost } from '@/lib/finance';

export class FinanceRepository {
  static async getFinanceSummary(): Promise<FinanceSummaryDTO> {
    const [
      collectedAggregate,
      pendingAggregate,
      eventServicesAll,
      discountAgg,
      otherExpensesAgg,
      recentPaymentsRaw,
      recentExpensesRaw,
    ] = await Promise.all([
      // Cash actually received — a distinct figure from Revenue (see src/lib/finance.ts)
      prisma.paymentTransaction.aggregate({
        _sum: { amount: true },
      }),
      prisma.scheduledPayment.aggregate({
        _sum: { amount: true, paidAmount: true },
      }),
      // Revenue/cost source of truth (Phase 9)
      prisma.eventService.findMany({
        select: { sellingPrice: true, cost: true, supplierCost: true, providerType: true },
      }),
      prisma.booking.aggregate({ _sum: { discount: true } }),
      // General operational expenses not already counted via supplierCost (avoids double-counting)
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { eventServiceId: null },
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

    const totalRevenue = toDisplayNumber(calculateRevenue(eventServicesAll, discountAgg._sum.discount));
    const totalCollected = toDisplayNumber(collectedAggregate._sum.amount);
    const pendingInvoicesAmount = toDisplayNumber(subtractMoneyFloor0(pendingAggregate._sum.amount, pendingAggregate._sum.paidAmount));
    const internalCost = toDisplayNumber(calculateInternalCost(eventServicesAll));
    const supplierCost = toDisplayNumber(calculateSupplierCost(eventServicesAll));
    const otherExpenses = toDisplayNumber(otherExpensesAgg._sum.amount);
    const totalExpensesAmount = internalCost + supplierCost + otherExpenses;
    const netProfit = totalRevenue - totalExpensesAmount;

    return {
      totalRevenue,
      totalCollected,
      pendingInvoicesAmount,
      internalCost,
      supplierCost,
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
