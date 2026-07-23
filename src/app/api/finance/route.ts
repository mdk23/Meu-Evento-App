import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ExpenseStatus, InvoiceStatus } from '@prisma/client';

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
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

    const totalRevenue = invoices.filter(i => i.status === 'PAID').reduce((a: number, b: any) => a + b.amount, 0);
    const pendingRevenue = invoices.filter(i => i.status === 'PENDING').reduce((a: number, b: any) => a + b.amount, 0);
    const totalExpenses = expenses.filter(e => e.status === 'PAID').reduce((a: number, b: any) => a + b.amount, 0);
    const pendingExpenses = expenses.filter(e => e.status === 'PENDING').reduce((a: number, b: any) => a + b.amount, 0);
    const netProfit = totalRevenue - totalExpenses;

    const suppliers = await prisma.supplier.findMany();
    const bookings = await prisma.booking.findMany({ include: { client: true, event: true } });

    return NextResponse.json({
      invoices,
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
    });
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
      const invoice = await prisma.invoice.create({
        data: {
          tenantId: tenant.id,
          bookingId,
          amount: parseFloat(amount),
          status: InvoiceStatus.PENDING,
          dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      });
      return NextResponse.json({ success: true, invoice }, { status: 201 });
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
      return NextResponse.json({ success: true, expense }, { status: 201 });
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
      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: status as InvoiceStatus,
          paidAt: status === 'PAID' ? new Date() : null,
        },
      });
      return NextResponse.json({ success: true, invoice: updatedInvoice });
    }

    if (expenseId) {
      const updatedExpense = await prisma.expense.update({
        where: { id: expenseId },
        data: {
          status: status as ExpenseStatus,
        },
      });
      return NextResponse.json({ success: true, expense: updatedExpense });
    }

    return NextResponse.json({ error: 'invoiceId or expenseId required' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Failed to update financial status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
