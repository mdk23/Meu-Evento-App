import BookingsClient from '@/components/bookings/BookingsClient';
import { BookingService } from '@/lib/services/booking.service';

export const dynamic = 'force-dynamic';

export default async function BookingsPage() {
  const bookings = await BookingService.getBookings();

  return <BookingsClient initialBookings={bookings} />;
}
