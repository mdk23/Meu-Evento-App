import { prisma } from '@/lib/prisma';
import { BookingStatus, Prisma } from '@prisma/client';
import { BookingListDTO, BookingListPageDTO, CalendarBookingDTO } from '@/types/dtos';
import { sumMoney, toDisplayNumber, toMoney } from '@/lib/money';
import { calculateRevenue } from '@/lib/finance';
import { resolvePagination, buildPaginatedResult } from '@/lib/pagination';

const ALL_BOOKING_STATUSES = ['ALL', ...Object.values(BookingStatus)];

const BOOKING_LIST_SELECT = {
  id: true,
  clientId: true,
  bookingType: true,
  eventDate: true,
  guestCount: true,
  status: true,
  notes: true,
  discount: true,
  depositDueDate: true,
  client: {
    select: { name: true, email: true, phone: true },
  },
  event: {
    select: {
      id: true,
      name: true,
    },
  },
  eventServices: {
    select: {
      id: true,
      sellingPrice: true,
      providerType: true,
      service: { select: { id: true, name: true, category: true } },
    },
  },
  scheduledPayments: {
    select: { id: true, name: true, amount: true, paidAmount: true, status: true, description: true, dueDate: true },
  },
} satisfies Prisma.BookingSelect;

type BookingListRow = Prisma.BookingGetPayload<{ select: typeof BOOKING_LIST_SELECT }>;

const CALENDAR_BOOKING_SELECT = {
  id: true,
  startAt: true,
  endAt: true,
  status: true,
  guestCount: true,
  client: { select: { name: true } },
  event: { select: { name: true } },
} satisfies Prisma.BookingSelect;

type CalendarBookingRow = Prisma.BookingGetPayload<{ select: typeof CALENDAR_BOOKING_SELECT }>;

function mapCalendarBookingRow(b: CalendarBookingRow): CalendarBookingDTO {
  return {
    id: b.id,
    clientName: b.client?.name || 'N/A',
    eventTitle: b.event?.name,
    startAt: b.startAt.toISOString(),
    endAt: b.endAt.toISOString(),
    status: b.status,
    guestCount: b.guestCount,
  };
}

function mapBookingRow(b: BookingListRow): BookingListDTO {
  const scheduledPaymentsSum = sumMoney(b.scheduledPayments?.map((sp) => sp.amount) || []);
  const paidAmountSum = sumMoney(b.scheduledPayments?.map((sp) => sp.paidAmount) || []);

  // Revenue source of truth (Phase 9): SUM(EventService.sellingPrice) - discount, not a
  // schedule-vs-contracted MAX() hack — the payment plan is already validated to sum to
  // this exact figure at creation/edit time (see src/lib/payment-plan.ts).
  const totalContractAmount = calculateRevenue(b.eventServices || [], b.discount);

  // The deposit is the earliest-due milestone — that's how the payment plan generator
  // (src/lib/payment-plan.ts) always orders a booking's schedule.
  const sortedSchedules = [...(b.scheduledPayments || [])].sort((a, c) => a.dueDate.getTime() - c.dueDate.getTime());
  const depositSchedule = sortedSchedules[0];
  const depositStatus = (depositSchedule?.status === 'PAID' || b.status === 'CONFIRMED' || b.status === 'COMPLETED')
    ? 'PAID'
    : 'PENDING';
  const depositAmountVal = toDisplayNumber(depositSchedule?.amount ?? 0);
  const totalContractAmountVal = toDisplayNumber(totalContractAmount);
  const depositPercentVal = totalContractAmountVal > 0 ? Math.round((depositAmountVal / totalContractAmountVal) * 100) : 0;

  return {
    id: b.id,
    clientId: b.clientId,
    clientName: b.client?.name || 'N/A',
    clientEmail: b.client?.email,
    clientPhone: b.client?.phone,
    eventTitle: b.event?.name,
    eventDate: b.eventDate.toISOString(),
    guestCount: b.guestCount,
    status: b.status,
    bookingType: b.bookingType,
    notes: b.notes,
    hasEvent: !!b.event,
    totalScheduledAmount: toDisplayNumber(scheduledPaymentsSum),
    paidAmount: toDisplayNumber(paidAmountSum),
    totalContractAmount: totalContractAmountVal,
    downPaymentAmount: depositAmountVal,
    downPaymentPercent: depositPercentVal,
    discount: toDisplayNumber(b.discount ?? toMoney(0)),
    depositStatus,
    depositDueDate: b.depositDueDate ? b.depositDueDate.toISOString() : null,
  };
}

export interface GetBookingListParams {
  page?: number;
  pageSize?: number;
  status?: string;
}

export class BookingRepository {
  static async getBookingList({ page, pageSize, status }: GetBookingListParams = {}): Promise<BookingListPageDTO> {
    const { page: resolvedPage, pageSize: resolvedPageSize, skip, take } = resolvePagination({ page, pageSize });

    const where: Prisma.BookingWhereInput =
      status && status !== 'ALL' && Object.values(BookingStatus).includes(status as BookingStatus)
        ? { status: status as BookingStatus }
        : {};

    // Tab badge counts must reflect every status regardless of the current filter/page, so this
    // is a separate unfiltered groupBy — same pattern as dashboard.repository.ts's status breakdowns.
    const [bookings, total, statusGrouped] = await Promise.all([
      prisma.booking.findMany({
        where,
        orderBy: { eventDate: 'asc' },
        skip,
        take,
        select: BOOKING_LIST_SELECT,
      }),
      prisma.booking.count({ where }),
      prisma.booking.groupBy({ by: ['status'], _count: { status: true } }),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const s of ALL_BOOKING_STATUSES) {
      statusCounts[s] = 0;
    }
    for (const group of statusGrouped) {
      statusCounts[group.status] = group._count.status;
      statusCounts.ALL += group._count.status;
    }

    const items = bookings.map(mapBookingRow);

    return { ...buildPaginatedResult(items, total, resolvedPage, resolvedPageSize), statusCounts };
  }

  /**
   * Full, unpaginated booking list for the calendar view — it renders a whole month grid (plus
   * an hour-by-hour day timeline) and needs every booking's time range to bucket/position
   * client-side, not a single page of results.
   */
  static async getAllBookingsForCalendar(): Promise<CalendarBookingDTO[]> {
    const bookings = await prisma.booking.findMany({
      orderBy: { startAt: 'asc' },
      select: CALENDAR_BOOKING_SELECT,
    });
    return bookings.map(mapCalendarBookingRow);
  }
}
