import { prisma } from '@/lib/prisma';
import BookingsClient from '@/components/bookings/BookingsClient';
import { BookingService } from '@/lib/services/booking.service';

export const dynamic = 'force-dynamic';

export default async function BookingsPage() {
  const [bookings, clients, services] = await Promise.all([
    BookingService.getBookings(),
    prisma.client.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } }),
    prisma.service.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, category: true, executionType: true, defaultPrice: true } })
  ]);

  return (
    <BookingsClient 
      initialBookings={bookings}
      clients={clients}
      services={services}
    />
  );
}
