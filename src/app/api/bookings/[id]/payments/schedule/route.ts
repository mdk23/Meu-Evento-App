import { NextResponse } from 'next/server';
import { prisma, prismaTransaction } from '@/lib/prisma';
import { isMoneyGreaterThan, isMoneyPositive } from '@/lib/money';
import { validatePaymentPlan } from '@/lib/payment-plan';
import { syncScheduledPaymentAllocations } from '@/lib/payment-allocation';

interface ScheduleInput {
  id?: string;
  name: string;
  amount: string | number;
  dueDate: string;
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const schedules: ScheduleInput[] = body.schedules;
    const totalContractAmount = parseFloat(body.totalContractAmount || '0');

    const booking = await prisma.booking.findUnique({
      where: { id }
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Authoritative validation: due dates must be on/before the event and chronological, and
    // the amounts must sum to the contract total. The client (EditScheduleModal) already checks
    // the sum, but every rule needs to be enforced here too since this is the real boundary.
    const validation = validatePaymentPlan({
      milestones: schedules.map((s) => ({ name: s.name, amount: parseFloat(String(s.amount)), dueDate: s.dueDate })),
      totalAmount: totalContractAmount,
      eventDate: booking.eventDate,
    });
    if (!validation.valid) {
      return NextResponse.json({ error: validation.errors[0] || 'Invalid payment schedule.' }, { status: 400 });
    }

    await prismaTransaction.$transaction(async (tx) => {
      // Get existing schedules
      const existingSchedules = await tx.scheduledPayment.findMany({
        where: { bookingId: id }
      });

      const incomingIds = schedules.filter((s) => s.id).map((s) => s.id);
      
      // Prevent deleting schedules that have payments
      const schedulesToDelete = existingSchedules.filter(es => !incomingIds.includes(es.id));
      for (const s of schedulesToDelete) {
        if (isMoneyPositive(s.paidAmount)) {
          throw new Error(`Cannot delete schedule "${s.name}" because it has been partially or fully paid.`);
        }
        await tx.scheduledPayment.delete({ where: { id: s.id } });
      }

      // Upsert schedules. Status/paidAmount are deliberately not set here — they're recalculated
      // for the whole plan by syncScheduledPaymentAllocations below, against every existing
      // PaymentTransaction (spec: editing the plan must reallocate money already received against
      // the new milestones, never touch the transactions themselves).
      for (const s of schedules) {
        if (s.id) {
          const existing = existingSchedules.find(es => es.id === s.id);
          if (existing && isMoneyGreaterThan(existing.paidAmount, parseFloat(String(s.amount)))) {
             throw new Error(`Cannot set amount of "${s.name}" lower than already paid amount (${existing.paidAmount}).`);
          }

          await tx.scheduledPayment.update({
            where: { id: s.id },
            data: {
              name: s.name,
              amount: parseFloat(String(s.amount)),
              dueDate: new Date(s.dueDate),
            }
          });
        } else {
          await tx.scheduledPayment.create({
            data: {
              tenantId: booking.tenantId,
              bookingId: id,
              name: s.name,
              amount: parseFloat(String(s.amount)),
              dueDate: new Date(s.dueDate),
            }
          });
        }
      }

      await syncScheduledPaymentAllocations(tx, id);
    }, { timeout: 15000, maxWait: 10000 });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error('Failed to update schedule:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
