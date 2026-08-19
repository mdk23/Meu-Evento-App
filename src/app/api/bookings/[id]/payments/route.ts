import { NextResponse } from 'next/server';
import { prisma, prismaTransaction } from '@/lib/prisma';
import { PaymentMethod } from '@prisma/client';
import { serializeDecimals } from '@/lib/money';
import { syncScheduledPaymentAllocations } from '@/lib/payment-allocation';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scheduledPayments = await prisma.scheduledPayment.findMany({
      where: { bookingId: id, plan: { active: true } },
      orderBy: [{ dueDate: 'asc' }, { orderNumber: 'asc' }, { createdAt: 'asc' }],
      include: { transactions: true }
    });

    const paymentTransactions = await prisma.paymentTransaction.findMany({
      where: { bookingId: id },
      orderBy: { date: 'desc' },
      include: { scheduledPayment: true }
    });

    return NextResponse.json(serializeDecimals({ scheduledPayments, paymentTransactions }));
  } catch (error: unknown) {
    console.error('Failed to fetch payments:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { amount, method, reference, notes, recordedBy, scheduledPaymentId, date } = body;

    const booking = await prisma.booking.findUnique({
      where: { id }
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const transaction = await prismaTransaction.$transaction(async (tx) => {
      // Create transaction
      const newTransaction = await tx.paymentTransaction.create({
        data: {
          tenantId: booking.tenantId,
          bookingId: id,
          amount: parseFloat(amount),
          method: method as PaymentMethod,
          reference: reference || null,
          recordedBy: recordedBy || 'System',
          notes: notes || null,
          date: date ? new Date(date) : new Date(),
          scheduledPaymentId: scheduledPaymentId || null,
        }
      });

      // Recalculate every scheduled payment's allocation from scratch (this transaction plus every
      // other one on the booking) rather than crediting only the targeted schedule — this is what
      // lets an overpayment cascade into the next milestone instead of over-crediting one row.
      await syncScheduledPaymentAllocations(tx, id);

      return newTransaction;
    }, { timeout: 15000, maxWait: 10000 });

    return NextResponse.json(serializeDecimals({ success: true, transaction }), { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to register payment:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
