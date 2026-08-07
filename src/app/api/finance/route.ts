import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ExpenseStatus, PaymentStatus } from '@prisma/client';
import { serializeDecimals, subtractMoneyFloor0, sumMoney, toDisplayNumber } from '@/lib/money';
import { calculateRevenue, calculateInternalCost, calculateSupplierCost } from '@/lib/finance';

export async function GET() {
  try {
    const scheduledPayments = await prisma.scheduledPayment.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        booking: {
          include: {
            client: true,
            event: true,
          },
        },
      },
    });

    const expenses = await prisma.expense.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        event: true,
        supplier: true,
      },
    });

    // Revenue/cost source of truth (Phase 9) — see src/lib/finance.ts
    const [eventServicesAll, discountAgg] = await Promise.all([
      prisma.eventService.findMany({ select: { sellingPrice: true, cost: true, supplierCost: true, providerType: true } }),
      prisma.booking.aggregate({ _sum: { discount: true } }),
    ]);

    const totalRevenue = toDisplayNumber(calculateRevenue(eventServicesAll, discountAgg._sum.discount));
    const pendingRevenue = toDisplayNumber(sumMoney(scheduledPayments.filter(i => i.status === 'PENDING').map(b => subtractMoneyFloor0(b.amount, b.paidAmount))));
    const internalCost = toDisplayNumber(calculateInternalCost(eventServicesAll));
    const supplierCost = toDisplayNumber(calculateSupplierCost(eventServicesAll));
    const otherExpenses = toDisplayNumber(sumMoney(expenses.filter(e => !e.eventServiceId).map(e => e.amount)));
    const totalExpenses = internalCost + supplierCost + otherExpenses;
    const pendingExpenses = toDisplayNumber(sumMoney(expenses.filter(e => e.status === 'PENDING').map(b => b.amount)));
    const netProfit = totalRevenue - totalExpenses;

    const suppliers = await prisma.supplier.findMany();
    const bookings = await prisma.booking.findMany({ include: { client: true, event: true } });

    return NextResponse.json(serializeDecimals({
      invoices: scheduledPayments, // Aliased to invoices for backwards compatibility with UI
      expenses,
      suppliers,
      bookings,
      summary: {
        totalRevenue,
        pendingRevenue,
        totalExpenses,
        pendingExpenses,
        netProfit,
      },
    }));
  } catch (error: unknown) {
    console.error('Failed to fetch financial audit:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, bookingId, eventId, supplierId, amount, category, description, dueDate } = body;

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 });
    }

    if (type === 'INVOICE') {
      if (!bookingId || !amount) {
        return NextResponse.json({ error: 'Booking and Amount are required for invoice' }, { status: 400 });
      }
      const scheduledPayment = await prisma.scheduledPayment.create({
        data: {
          tenantId: tenant.id,
          bookingId,
          name: 'Manual Invoice',
          amount: parseFloat(amount),
          status: 'PENDING',
          dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      return NextResponse.json(serializeDecimals({ success: true, invoice: scheduledPayment }), { status: 201 });
    }

    if (type === 'EXPENSE') {
      if (!description || !amount) {
        return NextResponse.json({ error: 'Description and Amount are required for expense' }, { status: 400 });
      }
      const expense = await prisma.expense.create({
        data: {
          tenantId: tenant.id,
          eventId: eventId || null,
          supplierId: supplierId || null,
          description,
          amount: parseFloat(amount),
          category: category || 'General Operational Cost',
          status: ExpenseStatus.PENDING,
        },
      });
      return NextResponse.json(serializeDecimals({ success: true, expense }), { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid financial record type' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Failed to create financial transaction:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { invoiceId, expenseId, status } = body;

    if (invoiceId) {
      const updatedScheduledPayment = await prisma.scheduledPayment.update({
        where: { id: invoiceId },
        data: {
          status: status as PaymentStatus,
          paidAmount: status === 'PAID' ? undefined : 0, // Incomplete but prevents crash
        },
      });
      return NextResponse.json(serializeDecimals({ success: true, invoice: updatedScheduledPayment }));
    }

    if (expenseId) {
      const updatedExpense = await prisma.expense.update({
        where: { id: expenseId },
        data: {
          status: status as ExpenseStatus,
        },
      });
      return NextResponse.json(serializeDecimals({ success: true, expense: updatedExpense }));
    }

    return NextResponse.json({ error: 'invoiceId or expenseId required' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Failed to update financial status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
