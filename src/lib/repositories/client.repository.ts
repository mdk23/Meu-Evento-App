import { prisma } from '@/lib/prisma';
import { ClientCardDTO, ClientListPageDTO } from '@/types/dtos';
import { sumMoney, toDisplayNumber } from '@/lib/money';
import { resolvePagination, buildPaginatedResult } from '@/lib/pagination';

export interface GetClientListParams {
  page?: number;
  pageSize?: number;
}

export class ClientRepository {
  static async getClientList({ page, pageSize }: GetClientListParams = {}): Promise<ClientListPageDTO> {
    const { page: resolvedPage, pageSize: resolvedPageSize, skip, take } = resolvePagination({ page, pageSize });

    const [clients, total] = await Promise.all([
      prisma.client.findMany({
        orderBy: { name: 'asc' },
        skip,
        take,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          companyName: true,
          notes: true,
          _count: {
            select: { bookings: true },
          },
          bookings: {
            select: {
              scheduledPayments: {
                where: { status: 'PAID', plan: { active: true } },
                select: { amount: true },
              },
            },
          },
        },
      }),
      prisma.client.count(),
    ]);

    const items: ClientCardDTO[] = clients.map((c) => {
      const totalSpent = sumMoney(c.bookings.flatMap((b) => b.scheduledPayments.map((sp) => sp.amount)));

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        companyName: c.companyName,
        bookingCount: c._count.bookings,
        totalSpent: toDisplayNumber(totalSpent),
        notes: c.notes,
      };
    });

    return buildPaginatedResult(items, total, resolvedPage, resolvedPageSize);
  }
}
