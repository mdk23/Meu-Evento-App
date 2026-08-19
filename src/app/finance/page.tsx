import { prisma } from '@/lib/prisma';
import FinanceClient from '@/components/finance/FinanceClient';
import { FinanceService } from '@/lib/services/finance.service';
import { serializeDecimals } from '@/lib/money';

export const dynamic = 'force-dynamic';

export default async function FinancePage() {
  const [summary, suppliers, bookings, invoices, expenses] = await Promise.all([
    FinanceService.getSummary(),
    prisma.supplier.findMany({ where: { active: true }, select: { id: true, name: true, category: true }, orderBy: { name: 'asc' } }),
    prisma.booking.findMany({ select: { id: true, eventDate: true, client: { select: { name: true } } }, orderBy: { eventDate: 'desc' } }),
    prisma.scheduledPayment.findMany({ where: { plan: { active: true } }, select: { id: true, amount: true, status: true, dueDate: true, booking: { select: { client: { select: { name: true } } } } }, orderBy: { dueDate: 'desc' } }),
    prisma.expense.findMany({ select: { id: true, description: true, amount: true, category: true, status: true, supplier: { select: { name: true } } }, orderBy: { createdAt: 'desc' } }),
  ]);

  return (
    <FinanceClient
      initialSummary={summary}
      suppliers={suppliers}
      bookings={bookings}
      invoices={serializeDecimals(invoices)}
      expenses={serializeDecimals(expenses)}
    />
  );
}
