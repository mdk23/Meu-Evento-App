import { Prisma } from '@prisma/client';
import { BookingListDTO } from '@/types/dtos';
import { DecimalToNumber } from '@/lib/money';

/**
 * `Decimal` fields never survive the API boundary as `Decimal` — `src/lib/money.ts`'s `serializeDecimals`
 * converts every one to a plain number before `GET /api/bookings/[id]`'s response is sent.
 */
export type BookingDrawerPayload = DecimalToNumber<Prisma.BookingGetPayload<{
  include: {
    client: true;
    event: { include: { eventServices: { include: { service: true; supplier: true } } } };
    scheduledPayments: true;
  };
}>>;

/**
 * `selectedBooking` starts as a `BookingListDTO` (from the grid) and gets merged with the full
 * `GET /api/bookings/[id]` payload once it loads — the payload fields are optional to reflect that
 * they're absent until the fetch resolves. `eventDate`/`depositDueDate` stay the DTO's `string` shape
 * since `fetch().json()` serializes Prisma `Date`s back to ISO strings.
 */
export type BookingDrawerDetail = BookingListDTO &
  Partial<Omit<BookingDrawerPayload, 'eventDate' | 'depositDueDate' | 'createdAt' | 'updatedAt' | 'status' | 'bookingType' | 'discount'>>;

export interface EditableBookingFields {
  editClientName: string;
  editClientPhone: string;
  editClientEmail: string;
  editEventTitle: string;
  editBookingType: string;
  editDate: string;
  editGuests: number;
  editDiscount: number;
  editDownPaymentPercent: number;
  editDepositDueDate: string;
  editNotes: string;
}
