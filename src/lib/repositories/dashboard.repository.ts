import { prisma } from '@/lib/prisma';
import { DashboardDTO } from '@/types/dtos';

export class DashboardRepository {
  static async getDashboardData(): Promise<DashboardDTO> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Parallel execution of DB-native aggregate & select queries
    const [
      revenueResult,
      pendingResult,
      expenseResult,
      totalBookings,
      totalClients,
      todaysEventsRaw,
      upcomingEventsRaw,
      serviceStatusGrouped,
    ] = await Promise.all([
      // 1. PostgreSQL DB aggregate for Paid Revenue
      prisma.invoice.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID' },
      }),
      // 2. PostgreSQL DB aggregate for Pending Invoices
      prisma.invoice.aggregate({
        _sum: { amount: true },
        where: { status: 'PENDING' },
      }),
      // 3. PostgreSQL DB aggregate for Paid Expenses
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID' },
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
    ]);

    const revenue = revenueResult._sum.amount || 0;
    const pendingAmount = pendingResult._sum.amount || 0;
    const totalCosts = expenseResult._sum.amount || 0;
    const netProfit = revenue - totalCosts;

    const serviceStatusSummary: Record<string, number> = {};
    for (const item of serviceStatusGrouped) {
      serviceStatusSummary[item.status] = item._count.status;
    }

    return {
      kpis: {
        revenue,
        pendingAmount,
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
    };
  }
}
