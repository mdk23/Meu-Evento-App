import { NextResponse } from 'next/server';
import { prisma, prismaTransaction } from '@/lib/prisma';
import { syncScheduledPaymentAllocations } from '@/lib/payment-allocation';

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

      // 2. Recalculate every scheduled payment's allocation from what's left — same engine, same
      // reasoning as recording a payment: this is a full recompute, not a hand-rolled rollback.
      await syncScheduledPaymentAllocations(tx, id);
    }, { timeout: 15000, maxWait: 10000 });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to delete payment transaction:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
