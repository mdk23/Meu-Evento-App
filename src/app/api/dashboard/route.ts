import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { serializeDecimals, subtractMoneyFloor0, sumMoney, toDisplayNumber } from '@/lib/money';

export async function GET() {
  try {
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      return NextResponse.json({
        kpis: { revenue: 0, pending: 0, netProfit: 0, totalBookings: 0 },
        todaysEvents: [],
        upcomingEvents: [],
        serviceStatusSummary: {},
      });
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Today's Events
    const todaysEvents = await prisma.event.findMany({
      where: {
        date: { gte: todayStart, lte: todayEnd },
      },
      include: {
        booking: { include: { client: true } },
        eventServices: { include: { service: true } },
      },
    });

    // Upcoming Events
    const upcomingEvents = await prisma.event.findMany({
      where: {
        date: { gte: todayStart },
      },
      orderBy: { date: 'asc' },
      take: 6,
      include: {
        booking: { include: { client: true } },
        eventServices: { include: { service: true } },
      },
    });

    // Financial KPIs
    const paidTransactions = await prisma.paymentTransaction.findMany();
    const revenue = toDisplayNumber(sumMoney(paidTransactions.map((pt) => pt.amount)));

    const scheduledPayments = await prisma.scheduledPayment.findMany({ where: { plan: { active: true } } });
    const pendingAmount = toDisplayNumber(
      sumMoney(scheduledPayments.map((sp) => subtractMoneyFloor0(sp.amount, sp.paidAmount)))
    );

    const paidExpenses = await prisma.expense.findMany({
      where: { status: 'PAID' },
    });
    const totalCosts = toDisplayNumber(sumMoney(paidExpenses.map((exp) => exp.amount)));
    const netProfit = revenue - totalCosts;

    const totalBookings = await prisma.booking.count();
    const totalClients = await prisma.client.count();

    // Service Status Breakdown
    const allEventServices = await prisma.eventService.findMany({
      select: { status: true },
    });

    const serviceStatusSummary = allEventServices.reduce((acc: Record<string, number>, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});

    return NextResponse.json(serializeDecimals({
      tenant,
      kpis: {
        revenue,
        pendingAmount,
        totalCosts,
        netProfit,
        totalBookings,
        totalClients,
      },
      todaysEvents,
      upcomingEvents,
      serviceStatusSummary,
    }));
  } catch (error: unknown) {
    console.error('Failed to load dashboard endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
