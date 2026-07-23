import { prisma } from '@/lib/prisma';
import { EventOverviewDTO } from '@/types/dtos';

export class EventRepository {
  static async getEventList(): Promise<EventOverviewDTO[]> {
    const events = await prisma.event.findMany({
      orderBy: { date: 'asc' },
      select: {
        id: true,
        bookingId: true,
        name: true,
        date: true,
        guestCount: true,
        status: true,
        booking: {
          select: {
            client: {
              select: {
                name: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        _count: {
          select: {
            eventServices: true,
            guests: true,
          },
        },
      },
    });

    return events.map((evt) => ({
      id: evt.id,
      bookingId: evt.bookingId,
      name: evt.name,
      date: evt.date.toISOString(),
      guestCount: evt.guestCount,
      status: evt.status,
      clientName: evt.booking?.client?.name || 'N/A',
      clientEmail: evt.booking?.client?.email,
      clientPhone: evt.booking?.client?.phone,
      serviceCount: evt._count.eventServices,
      guestCountRegistered: evt._count.guests,
    }));
  }

  static async getEventDetailOverview(eventId: string) {
    return prisma.event.findUnique({
      where: { id: eventId },
      select: {
        id: true,
        bookingId: true,
        name: true,
        date: true,
        guestCount: true,
        status: true,
        notes: true,
        booking: {
          select: {
            id: true,
            status: true,
            client: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                companyName: true,
              },
            },
          },
        },
      },
    });
  }
}
