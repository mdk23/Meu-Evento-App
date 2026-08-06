import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import BookingPaymentsClient from '@/components/bookings/payments/BookingPaymentsClient';
import { serializeDecimals, sumMoney, toDisplayNumber } from '@/lib/money';

export default async function BookingPaymentsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      client: true,
      event: {
        include: {
          eventServices: true
        }
      }
    }
  });

  if (!booking) {
    notFound();
  }

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

  // Calculate total contract amount just in case it's not stored
  const totalContractAmount = toDisplayNumber(sumMoney(booking.event?.eventServices.map((service) => service.sellingPrice) || []));
  const totalScheduledAmount = toDisplayNumber(sumMoney(scheduledPayments.map((sp) => sp.amount)));

  const serializedBooking = serializeDecimals({
    ...booking,
    totalContractAmount: Math.max(totalContractAmount, totalScheduledAmount), // Fallback
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
    eventDate: booking.eventDate.toISOString(),
    depositDueDate: booking.depositDueDate?.toISOString() || null,
  });

  const serializedSchedules = serializeDecimals(scheduledPayments.map(sp => ({
    ...sp,
    dueDate: sp.dueDate.toISOString(),
    createdAt: sp.createdAt.toISOString(),
    updatedAt: sp.updatedAt.toISOString(),
  })));

  const serializedTransactions = serializeDecimals(paymentTransactions.map(pt => ({
    ...pt,
    date: pt.date.toISOString(),
    createdAt: pt.createdAt.toISOString(),
  })));

  return (
    <BookingPaymentsClient
      booking={serializedBooking}
      initialScheduledPayments={serializedSchedules}
      initialTransactions={serializedTransactions}
    />
  );
}
