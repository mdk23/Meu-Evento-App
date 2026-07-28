import { prisma } from '@/lib/prisma';
import BookingPOSTerminal from '@/components/bookings/BookingPOSTerminal';

export const dynamic = 'force-dynamic';

export default async function CreateBookingPage() {
  const clients = await prisma.client.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, phone: true, email: true },
  });
  const services = await prisma.service.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, category: true, executionType: true, defaultPrice: true, priceType: true },
  });
  const spaces = await prisma.space.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, capacity: true, description: true },
  });
  const bookings = await prisma.booking.findMany({
    select: {
      id: true,
      eventDate: true,
      status: true,
      client: { select: { name: true } },
    },
  });

  return (
    <BookingPOSTerminal
      initialClients={clients}
      initialServices={services}
      initialSpaces={spaces}
      initialBookings={bookings}
    />
  );
}
