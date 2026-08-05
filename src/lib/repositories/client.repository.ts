import { prisma } from '@/lib/prisma';
import { ClientCardDTO } from '@/types/dtos';
import { sumMoney, toDisplayNumber } from '@/lib/money';

export class ClientRepository {
  static async getClientList(): Promise<ClientCardDTO[]> {
    const clients = await prisma.client.findMany({
      orderBy: { name: 'asc' },
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
              where: { status: 'PAID' },
              select: { amount: true },
            },
          },
        },
      },
    });

    return clients.map((c) => {
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
  }
}
