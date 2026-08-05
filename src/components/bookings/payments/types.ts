import { Prisma } from '@prisma/client';
import { DecimalToNumber } from '@/lib/money';

type SerializedDates<T, K extends keyof T> = Omit<T, K> & { [P in K]: string };

export type SerializedBooking = SerializedDates<
  Omit<
    DecimalToNumber<Prisma.BookingGetPayload<{ include: { client: true; event: { include: { eventServices: true } } } }>>,
    'depositDueDate'
  >,
  'createdAt' | 'updatedAt' | 'eventDate'
> & {
  depositDueDate: string | null;
  totalContractAmount: number;
};

/** `transactions` is intentionally not included: the two pages that supply this prop query scheduledPayments
 * with different levels of relation depth, and the payments table never reads `sp.transactions` directly. */
export type SerializedSchedule = SerializedDates<
  DecimalToNumber<Prisma.ScheduledPaymentGetPayload<object>>,
  'dueDate' | 'createdAt' | 'updatedAt'
>;

export type SerializedTransaction = SerializedDates<
  DecimalToNumber<Prisma.PaymentTransactionGetPayload<{ include: { scheduledPayment: true } }>>,
  'date' | 'createdAt'
>;

/** Draft row in the schedule editor: `id` is empty for a not-yet-saved milestone, `amount` tracks the raw input value. */
export interface ScheduleFormItem {
  id: string;
  name: string;
  amount: number | string;
  dueDate: string;
  paidAmount: number;
  status: string;
}
