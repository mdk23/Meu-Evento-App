import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const bookingId = 'cms8mkn0j0001bcb0twd5agmj';
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      scheduledPayments: true,
      paymentTransactions: true,
    }
  });

  console.log(JSON.stringify(booking, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
