import { NextResponse } from 'next/server';
import { prisma, prismaTransaction } from '@/lib/prisma';
import { PaymentStatus } from '@prisma/client';
import { isMoneyGreaterThan, isMoneyPositive, subtractMoneyFloor0 } from '@/lib/money';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; transactionId: string }> }
) {
  try {
    const { id, transactionId } = await params;

    const transaction = await prisma.paymentTransaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (transaction.bookingId !== id) {
      return NextResponse.json({ error: 'Transaction does not belong to this booking' }, { status: 400 });
    }

    await prismaTransaction.$transaction(async (tx) => {
      // 1. Delete the transaction
      await tx.paymentTransaction.delete({
        where: { id: transactionId },
      });

      // 2. Rollback the scheduled payment amount
      if (transaction.scheduledPaymentId) {
        const schedule = await tx.scheduledPayment.findUnique({
          where: { id: transaction.scheduledPaymentId },
        });

        if (schedule) {
          const newPaidAmount = subtractMoneyFloor0(schedule.paidAmount, transaction.amount);

          let newStatus = schedule.status;
          if (!isMoneyPositive(newPaidAmount)) {
            newStatus = PaymentStatus.PENDING;
          } else if (isMoneyGreaterThan(schedule.amount, newPaidAmount)) {
            newStatus = PaymentStatus.PARTIALLY_PAID;
          }

          await tx.scheduledPayment.update({
            where: { id: schedule.id },
            data: {
              paidAmount: newPaidAmount,
              status: newStatus,
            },
          });
        }
      }
    }, { timeout: 15000, maxWait: 10000 });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to delete payment transaction:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
