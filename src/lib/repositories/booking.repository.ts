import { prisma } from '@/lib/prisma';
import { BookingListDTO } from '@/types/dtos';

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
        downPaymentAmount: true,
        downPaymentPercent: true,
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
        invoices: {
          select: { id: true, amount: true, status: true, description: true, dueDate: true },
        },
      },
    });

    return bookings.map((b) => {
      const invoicesSum = b.invoices.reduce((sum, inv) => sum + inv.amount, 0);
      const paidInvoiceAmount = b.invoices
        .filter((inv) => inv.status === 'PAID')
        .reduce((sum, inv) => sum + inv.amount, 0);

      const eventServicesSum = b.event?.eventServices?.reduce((sum, es) => sum + es.sellingPrice, 0) || 0;
      const servicesMinusDiscount = Math.max(0, eventServicesSum - (b.discount || 0));
      const depositImpliedTotal = (b.downPaymentPercent && b.downPaymentPercent > 0 && b.downPaymentAmount)
        ? (b.downPaymentAmount * 100) / b.downPaymentPercent
        : 0;

      const totalContractAmount = Math.max(invoicesSum, servicesMinusDiscount, depositImpliedTotal);
      
      const depositInvoice = b.invoices.find(inv => inv.description?.toLowerCase().includes('entrada') || inv.description?.toLowerCase().includes('deposit'));
      const depositStatus = (depositInvoice?.status === 'PAID' || b.status === 'CONFIRMED' || b.status === 'COMPLETED')
        ? 'PAID'
        : 'PENDING';

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
        totalInvoiceAmount: invoicesSum,
        paidInvoiceAmount,
        totalContractAmount,
        downPaymentAmount: b.downPaymentAmount || 0,
        downPaymentPercent: b.downPaymentPercent || 0,
        discount: b.discount || 0,
        depositStatus,
        depositDueDate: b.depositDueDate ? b.depositDueDate.toISOString() : null,
      };
    });
  }
}
