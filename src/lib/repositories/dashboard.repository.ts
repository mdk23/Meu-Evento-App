import { prisma } from '@/lib/prisma';
import { DashboardDTO } from '@/types/dtos';
import { subtractMoneyFloor0, toDisplayNumber } from '@/lib/money';
import { calculateRevenue, calculateInternalCost, calculateSupplierCost } from '@/lib/finance';

export class DashboardRepository {
  static async getDashboardData(): Promise<DashboardDTO> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Parallel execution of DB-native aggregate & select queries
    const [
      collectedResult,
      pendingResult,
      eventServicesAll,
      discountAgg,
      otherExpensesAgg,
      totalBookings,
      totalClients,
      todaysEventsRaw,
      upcomingEventsRaw,
      serviceStatusGrouped,
      supplierStatusGrouped,
    ] = await Promise.all([
      // 1. PostgreSQL DB aggregate for cash actually collected (a distinct figure from Revenue)
      prisma.paymentTransaction.aggregate({
        _sum: { amount: true },
      }),
      // 2. PostgreSQL DB aggregate for Pending Amount
      prisma.scheduledPayment.aggregate({
        _sum: { amount: true, paidAmount: true },
      }),
      // 3. Revenue/cost source of truth (Phase 9): every EventService's selling price and cost fields
      prisma.eventService.findMany({
        select: { sellingPrice: true, cost: true, supplierCost: true, providerType: true },
      }),
      prisma.booking.aggregate({ _sum: { discount: true } }),
      // General operational expenses not already counted via supplierCost above (avoids double-counting)
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { eventServiceId: null },
      }),
      // 4. Counts
      prisma.booking.count(),
      prisma.client.count(),
      // 5. Today's Events (Selective Projection)
      prisma.event.findMany({
        where: { date: { gte: todayStart, lte: todayEnd } },
        select: {
          id: true,
          name: true,
          date: true,
          guestCount: true,
          status: true,
          booking: {
            select: {
              client: { select: { name: true } },
            },
          },
        },
      }),
      // 6. Upcoming Events (Selective Projection)
      prisma.event.findMany({
        where: { date: { gte: todayStart } },
        orderBy: { date: 'asc' },
        take: 6,
        select: {
          id: true,
          name: true,
          date: true,
          guestCount: true,
          booking: {
            select: {
              client: { select: { name: true } },
            },
          },
          eventServices: {
            select: {
              id: true,
              providerType: true,
              service: { select: { name: true } },
            },
          },
        },
      }),
      // 7. PostgreSQL DB groupBy for Service Work Order Status Breakdown
      prisma.eventService.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      // 8. PostgreSQL DB groupBy for External Supplier Status Breakdown (null = INTERNAL services, excluded)
      prisma.eventService.groupBy({
        by: ['supplierStatus'],
        _count: { supplierStatus: true },
        where: { supplierStatus: { not: null } },
      }),
    ]);

    const revenue = toDisplayNumber(calculateRevenue(eventServicesAll, discountAgg._sum.discount));
    const totalCollected = toDisplayNumber(collectedResult._sum.amount);
    const pendingAmount = toDisplayNumber(subtractMoneyFloor0(pendingResult._sum.amount, pendingResult._sum.paidAmount));
    const internalCost = toDisplayNumber(calculateInternalCost(eventServicesAll));
    const supplierCost = toDisplayNumber(calculateSupplierCost(eventServicesAll));
    const otherExpenses = toDisplayNumber(otherExpensesAgg._sum.amount);
    const totalCosts = internalCost + supplierCost + otherExpenses;
    const netProfit = revenue - totalCosts;

    const serviceStatusSummary: Record<string, number> = {};
    for (const item of serviceStatusGrouped) {
      serviceStatusSummary[item.status] = item._count.status;
    }

    const supplierStatusSummary: Record<string, number> = {};
    for (const item of supplierStatusGrouped) {
      if (item.supplierStatus) {
        supplierStatusSummary[item.supplierStatus] = item._count.supplierStatus;
      }
    }

    return {
      kpis: {
        revenue,
        totalCollected,
        pendingAmount,
        internalCost,
        supplierCost,
        totalCosts,
        netProfit,
        totalBookings,
        totalClients,
      },
      todaysEvents: todaysEventsRaw.map((e) => ({
        id: e.id,
        name: e.name,
        date: e.date.toISOString(),
        guestCount: e.guestCount,
        status: e.status,
        clientName: e.booking?.client?.name || 'N/A',
      })),
      upcomingEvents: upcomingEventsRaw.map((e) => ({
        id: e.id,
        name: e.name,
        date: e.date.toISOString(),
        guestCount: e.guestCount,
        clientName: e.booking?.client?.name || 'N/A',
        serviceSummary: e.eventServices.map((es) => ({
          id: es.id,
          name: es.service.name,
          providerType: es.providerType,
        })),
      })),
      serviceStatusSummary,
      supplierStatusSummary,
    };
  }
}
