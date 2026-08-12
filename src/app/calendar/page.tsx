import CalendarClient from '@/components/calendar/CalendarClient';
import { BookingService } from '@/lib/services/booking.service';

export const dynamic = 'force-dynamic';

export default async function CalendarPage() {
  const bookings = await BookingService.getBookingsForCalendar();

  return <CalendarClient initialBookings={bookings} />;
}
