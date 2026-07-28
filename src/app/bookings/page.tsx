import { prisma } from '@/lib/prisma';
import BookingsClient from '@/components/bookings/BookingsClient';
import { BookingService } from '@/lib/services/booking.service';

export const dynamic = 'force-dynamic';

export default async function BookingsPage() {
  // Execute sequentially to prevent connection pool contention on serverless DB
  const bookings = await BookingService.getBookings();
  const clients = await prisma.client.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true },
  });
  const services = await prisma.service.findMany({
    orderBy: { name: 'asc' },
    select: { id: true, name: true, category: true, executionType: true, defaultPrice: true },
  });

  return (
    <BookingsClient 
      initialBookings={bookings}
      clients={clients}
      services={services}
    />
  );
}
