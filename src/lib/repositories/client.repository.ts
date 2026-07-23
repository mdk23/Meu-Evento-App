import { prisma } from '@/lib/prisma';
import { ClientCardDTO } from '@/types/dtos';

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
        _count: {
          select: { bookings: true },
        },
        bookings: {
          select: {
            invoices: {
              where: { status: 'PAID' },
              select: { amount: true },
            },
          },
        },
      },
    });

    return clients.map((c) => {
      const totalSpent = c.bookings.reduce((sum, b) => {
        return sum + b.invoices.reduce((invSum, inv) => invSum + inv.amount, 0);
      }, 0);

      return {
        id: c.id,
        name: c.name,
        email: c.email,
        phone: c.phone,
        companyName: c.companyName,
        bookingCount: c._count.bookings,
        totalSpent,
      };
    });
  }
}
