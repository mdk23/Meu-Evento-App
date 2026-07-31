import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PaymentStatus } from '@prisma/client';

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

    await prisma.$transaction(async (tx) => {
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
          const newPaidAmount = Math.max(0, schedule.paidAmount - transaction.amount);
          
          let newStatus = schedule.status;
          if (newPaidAmount === 0) {
            newStatus = PaymentStatus.PENDING;
          } else if (newPaidAmount < schedule.amount) {
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
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete payment transaction:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
