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
        client: {
          select: { name: true },
        },
        event: {
          select: { id: true },
        },
        invoices: {
          select: { amount: true, status: true },
        },
      },
    });

    return bookings.map((b) => {
      const totalInvoiceAmount = b.invoices.reduce((sum, inv) => sum + inv.amount, 0);
      const paidInvoiceAmount = b.invoices
        .filter((inv) => inv.status === 'PAID')
        .reduce((sum, inv) => sum + inv.amount, 0);

      return {
        id: b.id,
        clientId: b.clientId,
        clientName: b.client?.name || 'N/A',
        eventDate: b.eventDate.toISOString(),
        guestCount: b.guestCount,
        status: b.status,
        bookingType: b.bookingType,
        notes: b.notes,
        hasEvent: !!b.event,
        totalInvoiceAmount,
        paidInvoiceAmount,
      };
    });
  }
}
