import { prisma } from '@/lib/prisma';
import CalendarClient from '@/components/calendar/CalendarClient';
import { BookingService } from '@/lib/services/booking.service';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const [bookings, clients, services] = await Promise.all([
    BookingService.getBookings(),
    prisma.client.findMany({ select: { id: true, name: true, companyName: true }, orderBy: { name: 'asc' } }),
    prisma.service.findMany({ select: { id: true, name: true, executionType: true, defaultPrice: true }, orderBy: { name: 'asc' } }),
  ]);

  return (
    <CalendarClient
      initialBookings={bookings}
      clients={clients}
      services={services}
    />
  );
}
