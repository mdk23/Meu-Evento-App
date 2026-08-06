import { prisma } from '@/lib/prisma';
import { BookingListDTO } from '@/types/dtos';
import { maxMoney, subtractMoneyFloor0, sumMoney, toDisplayNumber, toMoney } from '@/lib/money';

export class BookingRepository {
  static async getBookingList(): Promise<BookingListDTO[]> {
    const bookings = await prisma.booking.findMany({
      orderBy: { eventDate: 'asc' },
      select: {
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
            eventServices: {
              select: {
                id: true,
                sellingPrice: true,
                providerType: true,
                service: { select: { id: true, name: true, category: true } },
              },
            },
          },
        },
        scheduledPayments: {
          select: { id: true, name: true, amount: true, paidAmount: true, status: true, description: true, dueDate: true },
        },
      },
    });

    return bookings.map((b) => {
      const scheduledPaymentsSum = sumMoney(b.scheduledPayments?.map((sp) => sp.amount) || []);
      const paidAmountSum = sumMoney(b.scheduledPayments?.map((sp) => sp.paidAmount) || []);

      const eventServicesSum = sumMoney(b.event?.eventServices?.map((es) => es.sellingPrice) || []);
      const servicesMinusDiscount = subtractMoneyFloor0(eventServicesSum, b.discount || 0);

      const totalContractAmount = maxMoney(scheduledPaymentsSum, servicesMinusDiscount);

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
    });
  }
}
