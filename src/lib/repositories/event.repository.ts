import { prisma } from '@/lib/prisma';
import { EventOverviewDTO, EventListPageDTO } from '@/types/dtos';
import { resolvePagination, buildPaginatedResult } from '@/lib/pagination';

export interface GetEventListParams {
  page?: number;
  pageSize?: number;
}

export class EventRepository {
  static async getEventList({ page, pageSize }: GetEventListParams = {}): Promise<EventListPageDTO> {
    const { page: resolvedPage, pageSize: resolvedPageSize, skip, take } = resolvePagination({ page, pageSize });

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        orderBy: { date: 'asc' },
        skip,
        take,
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
              bookingServices: true,
              guests: true,
            },
          },
        },
      }),
      prisma.event.count(),
    ]);

    const items: EventOverviewDTO[] = events.map((evt) => ({
      id: evt.id,
      bookingId: evt.bookingId,
      name: evt.name,
      date: evt.date.toISOString(),
      guestCount: evt.guestCount,
      status: evt.status,
      clientName: evt.booking?.client?.name || 'N/A',
      clientEmail: evt.booking?.client?.email,
      clientPhone: evt.booking?.client?.phone,
      serviceCount: evt._count.bookingServices,
      guestCountRegistered: evt._count.guests,
    }));

    return buildPaginatedResult(items, total, resolvedPage, resolvedPageSize);
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
