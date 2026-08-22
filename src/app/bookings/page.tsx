import BookingsClient from '@/components/bookings/BookingsClient';
import { BookingService } from '@/lib/services/booking.service';

export const dynamic = 'force-dynamic';

interface BookingsPageProps {
  searchParams: Promise<{ page?: string; status?: string; context?: string }>;
}

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10) || 1);
  const status = (params.status || 'ALL').toUpperCase();
  const kind = params.context?.toUpperCase();

  const data = await BookingService.getBookings({ page, status, kind });

  return <BookingsClient data={data} statusFilter={status} contextFilter={kind === 'SPACE' || kind === 'EVENT' ? kind : undefined} />;
}
