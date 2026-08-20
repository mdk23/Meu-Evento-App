import { prisma } from '@/lib/prisma';
import { DashboardDTO, SpaceDashboardDTO } from '@/types/dtos';
import { subtractMoneyFloor0, toDisplayNumber } from '@/lib/money';
import { calculateRevenue, calculateInternalCost, calculateSupplierCost } from '@/lib/finance';

const NON_BLOCKING_STATUSES = ['CANCELLED', 'WAITING_LIST'] as const;

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
      // 2. PostgreSQL DB aggregate for Pending Amount — active plan only, so a superseded plan
      // version's milestones don't get double-counted alongside its replacement.
      prisma.scheduledPayment.aggregate({
        where: { plan: { active: true } },
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

  /** Same shape as `getDashboardData`, scoped to EVENT-kind bookings only — this is what "Overview"
   * shows while you're in the Event workspace. Filtering through `booking: { kind: 'EVENT' }` also
   * fixes a real gap in the unscoped query: a demoted booking keeps its `Event` record ("kept, not
   * deleted" — see `booking-crossover.ts`), so without this filter a Space booking that used to be
   * an Event would still show up in operational panels it no longer belongs to. */
  static async getEventDashboardData(): Promise<DashboardDTO> {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

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
      prisma.paymentTransaction.aggregate({ where: { booking: { kind: 'EVENT' } }, _sum: { amount: true } }),
      prisma.scheduledPayment.aggregate({
        where: { plan: { active: true }, booking: { kind: 'EVENT' } },
        _sum: { amount: true, paidAmount: true },
      }),
      prisma.eventService.findMany({
        where: { booking: { kind: 'EVENT' } },
        select: { sellingPrice: true, cost: true, supplierCost: true, providerType: true },
      }),
      prisma.booking.aggregate({ where: { kind: 'EVENT' }, _sum: { discount: true } }),
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { eventServiceId: null, event: { booking: { kind: 'EVENT' } } },
      }),
      prisma.booking.count({ where: { kind: 'EVENT' } }),
      prisma.client.count(),
      prisma.event.findMany({
        where: { date: { gte: todayStart, lte: todayEnd }, booking: { kind: 'EVENT' } },
        select: {
          id: true,
          name: true,
          date: true,
          guestCount: true,
          status: true,
          booking: { select: { client: { select: { name: true } } } },
        },
      }),
      prisma.event.findMany({
        where: { date: { gte: todayStart }, booking: { kind: 'EVENT' } },
        orderBy: { date: 'asc' },
        take: 6,
        select: {
          id: true,
          name: true,
          date: true,
          guestCount: true,
          booking: { select: { client: { select: { name: true } } } },
          eventServices: { select: { id: true, providerType: true, service: { select: { name: true } } } },
        },
      }),
      prisma.eventService.groupBy({
        by: ['status'],
        _count: { status: true },
        where: { booking: { kind: 'EVENT' } },
      }),
      prisma.eventService.groupBy({
        by: ['supplierStatus'],
        _count: { supplierStatus: true },
        where: { supplierStatus: { not: null }, booking: { kind: 'EVENT' } },
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
      kpis: { revenue, totalCollected, pendingAmount, internalCost, supplierCost, totalCosts, netProfit, totalBookings, totalClients },
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
        serviceSummary: e.eventServices.map((es) => ({ id: es.id, name: es.service.name, providerType: es.providerType })),
      })),
      serviceStatusSummary,
      supplierStatusSummary,
    };
  }

  /** Space-workspace Overview — no `Event`/service-execution concept applies here (SPACE bookings
   * are commercial-only by design), so this reads straight off `Booking` instead of `Event`, and
   * swaps the operational "Service Execution Status" panel for a payment-collection snapshot. */
  static async getSpaceDashboardData(): Promise<SpaceDashboardDTO> {
    const now = new Date();
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [
      collectedResult,
      pendingResult,
      eventServicesAll,
      discountAgg,
      totalBookings,
      upcomingCount,
      overdueCount,
      todaysBookingsRaw,
      upcomingBookingsRaw,
      tenant,
    ] = await Promise.all([
      prisma.paymentTransaction.aggregate({ where: { booking: { kind: 'SPACE' } }, _sum: { amount: true } }),
      prisma.scheduledPayment.aggregate({
        where: { plan: { active: true }, booking: { kind: 'SPACE' } },
        _sum: { amount: true, paidAmount: true },
      }),
      prisma.eventService.findMany({
        where: { booking: { kind: 'SPACE' } },
        select: { sellingPrice: true },
      }),
      prisma.booking.aggregate({ where: { kind: 'SPACE' }, _sum: { discount: true } }),
      prisma.booking.count({ where: { kind: 'SPACE' } }),
      prisma.booking.count({
        where: { kind: 'SPACE', startAt: { gte: now }, status: { notIn: [...NON_BLOCKING_STATUSES] } },
      }),
      prisma.scheduledPayment.count({
        where: { plan: { active: true }, status: 'OVERDUE', booking: { kind: 'SPACE' } },
      }),
      prisma.booking.findMany({
        where: { kind: 'SPACE', eventDate: { gte: todayStart, lte: todayEnd } },
        select: { id: true, guestCount: true, status: true, startAt: true, endAt: true, client: { select: { name: true } } },
      }),
      prisma.booking.findMany({
        where: { kind: 'SPACE', startAt: { gte: now }, status: { notIn: [...NON_BLOCKING_STATUSES] } },
        orderBy: { startAt: 'asc' },
        take: 6,
        select: { id: true, guestCount: true, status: true, eventDate: true, client: { select: { name: true } } },
      }),
      prisma.tenant.findFirst({ include: { space: true } }),
    ]);

    const revenue = toDisplayNumber(calculateRevenue(eventServicesAll, discountAgg._sum.discount));
    const totalCollected = toDisplayNumber(collectedResult._sum.amount);
    const pendingAmount = toDisplayNumber(subtractMoneyFloor0(pendingResult._sum.amount, pendingResult._sum.paidAmount));

    return {
      kpis: { revenue, totalCollected, pendingAmount, totalBookings, upcomingCount, overdueCount },
      todaysBookings: todaysBookingsRaw.map((b) => ({
        id: b.id,
        clientName: b.client?.name || 'N/A',
        guestCount: b.guestCount,
        status: b.status,
        startAt: b.startAt.toISOString(),
        endAt: b.endAt.toISOString(),
      })),
      upcomingBookings: upcomingBookingsRaw.map((b) => ({
        id: b.id,
        clientName: b.client?.name || 'N/A',
        guestCount: b.guestCount,
        eventDate: b.eventDate.toISOString(),
        status: b.status,
      })),
      space: tenant?.space ? { name: tenant.space.name, capacity: tenant.space.capacity, address: tenant.space.address } : null,
    };
  }
}
