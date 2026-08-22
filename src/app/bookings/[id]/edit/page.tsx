import { prisma } from '@/lib/prisma';
import BookingPOSTerminal from '@/components/bookings/BookingPOSTerminal';
import BookingPaymentsClient from '@/components/bookings/payments/BookingPaymentsClient';
import { notFound } from 'next/navigation';
import { serializeDecimals, sumMoney, toDisplayNumber } from '@/lib/money';
import { PackageCatalogService } from '@/lib/services/package.service';

export const dynamic = 'force-dynamic';

export default async function EditBookingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Fetch the booking we want to edit
  const initialBookingData = await prisma.booking.findUnique({
    where: { id },
    include: {
      client: true,
      event: {
        include: {
          bookingServices: {
            include: { service: true }
          }
        }
      },
      bookingServices: {
        include: { service: true }
      },
      scheduledPayments: { where: { plan: { active: true } } },
    }
  });

  if (!initialBookingData) {
    notFound();
  }

  // Fetch catalog data
  const clients = await prisma.client.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, phone: true, email: true },
  });

  const services = await prisma.service.findMany({
    where: { active: true },
    orderBy: { name: 'asc' },
    select: { id: true, name: true, category: true, defaultProviderType: true, defaultPrice: true, priceType: true },
  });
  
  const spaces = await prisma.space.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, capacity: true, description: true },
  });
  
  const bookings = await prisma.booking.findMany({
    select: {
      id: true,
      eventDate: true,
      startAt: true,
      endAt: true,
      spaceId: true,
      status: true,
      client: { select: { name: true } },
    },
  });

  const paymentTransactions = await prisma.paymentTransaction.findMany({
    where: { bookingId: id },
    orderBy: { date: 'desc' },
    include: { scheduledPayment: true }
  });

  const packages = (await PackageCatalogService.getCatalog()).filter((p) => p.active);

  const totalContractAmount = toDisplayNumber(sumMoney(initialBookingData.bookingServices.map((service) => service.sellingPrice)));
  const totalScheduledAmount = toDisplayNumber(sumMoney(initialBookingData.scheduledPayments.map((sp) => sp.amount)));

  const serializedBooking = serializeDecimals({
    ...initialBookingData,
    totalContractAmount: Math.max(totalContractAmount, totalScheduledAmount),
    createdAt: initialBookingData.createdAt.toISOString(),
    updatedAt: initialBookingData.updatedAt.toISOString(),
    eventDate: initialBookingData.eventDate.toISOString(),
    depositDueDate: initialBookingData.depositDueDate?.toISOString() || null,
  });

  const serializedSchedules = serializeDecimals(initialBookingData.scheduledPayments.map(sp => ({
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
    <BookingPOSTerminal
      initialClients={clients}
      initialServices={serializeDecimals(services)}
      initialSpaces={spaces}
      initialBookings={bookings}
      initialBookingData={serializeDecimals(initialBookingData)}
      initialPackages={packages}
      paymentsTabComponent={
        <BookingPaymentsClient
          booking={serializedBooking}
          initialScheduledPayments={serializedSchedules}
          initialTransactions={serializedTransactions}
        />
      }
    />
  );
}
