import { NextResponse } from 'next/server';
import { prisma, prismaTransaction } from '@/lib/prisma';
import { PaymentStatus, PaymentMethod } from '@prisma/client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const scheduledPayments = await prisma.scheduledPayment.findMany({
      where: { bookingId: id },
      orderBy: { dueDate: 'asc' },
      include: { transactions: true }
    });

    const paymentTransactions = await prisma.paymentTransaction.findMany({
      where: { bookingId: id },
      orderBy: { date: 'desc' },
      include: { scheduledPayment: true }
    });

    return NextResponse.json({ scheduledPayments, paymentTransactions });
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

      // Update Scheduled Payment if linked
      if (scheduledPaymentId) {
        const schedule = await tx.scheduledPayment.findUnique({
          where: { id: scheduledPaymentId }
        });

        if (schedule) {
          const newPaidAmount = schedule.paidAmount + parseFloat(amount);
          let newStatus = schedule.status;

          if (newPaidAmount >= schedule.amount) {
            newStatus = PaymentStatus.PAID;
          } else if (newPaidAmount > 0) {
            newStatus = PaymentStatus.PARTIALLY_PAID;
          }

          await tx.scheduledPayment.update({
            where: { id: scheduledPaymentId },
            data: {
              paidAmount: newPaidAmount,
              status: newStatus
            }
          });
        }
      }

      return newTransaction;
    }, { timeout: 15000, maxWait: 10000 });

    return NextResponse.json({ success: true, transaction }, { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to register payment:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
