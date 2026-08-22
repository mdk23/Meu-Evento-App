import { EventDetailPayload } from '../types';
import BookingPaymentsClient from '@/components/bookings/payments/BookingPaymentsClient';
import { SerializedBooking, SerializedSchedule, SerializedTransaction } from '@/components/bookings/payments/types';

interface PaymentsTabProps {
  event: EventDetailPayload;
}

/** Reuses the booking-level payments UI wholesale rather than rebuilding it — every endpoint it
 * calls (register payment, edit schedule) is already keyed off `bookingId`, which is exactly
 * `event.booking.id` here. The only work is reshaping this payload into the `SerializedBooking`
 * shape that component expects (it was built for the booking detail page, which reads
 * `booking.event.bookingServices`; the event detail page has the same data one level up, as its own
 * top-level `bookingServices`). */
export default function PaymentsTab({ event }: PaymentsTabProps) {
  const serviceRevenue = event.bookingServices.reduce((sum, es) => sum + es.sellingPrice, 0);
  const totalContractAmount = Math.max(0, serviceRevenue - (event.booking.discount || 0));

  const booking = {
    ...event.booking,
    event: { id: event.id, name: event.name, bookingServices: event.bookingServices },
    totalContractAmount,
  } as unknown as SerializedBooking;

  const scheduledPayments = event.booking.scheduledPayments as unknown as SerializedSchedule[];
  const transactions = event.booking.paymentTransactions as unknown as SerializedTransaction[];

  return (
    <BookingPaymentsClient
      booking={booking}
      initialScheduledPayments={scheduledPayments}
      initialTransactions={transactions}
    />
  );
}
