import { prisma } from '@/lib/prisma';
import { BookingKind } from '@prisma/client';
import { calculateRevenue } from '@/lib/finance';
import { toDisplayNumber } from '@/lib/money';
import { WorkspaceSummaryDTO } from '@/types/dtos';

const NON_BLOCKING_STATUSES = ['CANCELLED', 'WAITING_LIST'] as const;

export class WorkspaceRepository {
  /** Powers the workspace-picker landing page: booking count, dates held, and contracted value for one kind. */
  static async getWorkspaceSummary(kind: BookingKind): Promise<WorkspaceSummaryDTO> {
    const now = new Date();

    const [bookingCount, upcomingCount, eventServices, discountAgg] = await Promise.all([
      prisma.booking.count({ where: { kind } }),
      prisma.booking.count({
        where: { kind, startAt: { gte: now }, status: { notIn: [...NON_BLOCKING_STATUSES] } },
      }),
      // Revenue source of truth (src/lib/finance.ts) — EventService already carries `bookingId`
      // directly, so this doesn't need to route through Event at all.
      prisma.eventService.findMany({
        where: { booking: { kind } },
        select: { sellingPrice: true },
      }),
      prisma.booking.aggregate({ where: { kind }, _sum: { discount: true } }),
    ]);

    return {
      bookingCount,
      upcomingCount,
      contractedValue: toDisplayNumber(calculateRevenue(eventServices, discountAgg._sum.discount)),
    };
  }
}
