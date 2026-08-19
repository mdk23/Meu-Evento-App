import { NextResponse } from 'next/server';
import { prisma, prismaTransaction } from '@/lib/prisma';
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
      // A plan change writes a new version rather than editing rows in place — the old plan and
      // its ScheduledPayment rows stay exactly as they were, permanent history, never deleted or
      // mutated. `syncScheduledPaymentAllocations` below then re-applies every existing
      // PaymentTransaction against the new version's schedule from scratch, which is what
      // correctly cascades a fully- or partially-paid milestone's money into whatever the new
      // plan says should absorb it — no "can this row be deleted" guard is needed anymore,
      // because nothing is ever deleted.
      const currentPlan = await tx.paymentPlan.findFirst({
        where: { bookingId: id, active: true },
      });
      if (currentPlan) {
        await tx.paymentPlan.update({ where: { id: currentPlan.id }, data: { active: false } });
      }

      const newPlan = await tx.paymentPlan.create({
        data: { bookingId: id, version: (currentPlan?.version ?? 0) + 1, active: true },
      });

      for (const s of schedules) {
        await tx.scheduledPayment.create({
          data: {
            tenantId: booking.tenantId,
            bookingId: id,
            planId: newPlan.id,
            name: s.name,
            amount: parseFloat(String(s.amount)),
            dueDate: new Date(s.dueDate),
          },
        });
      }

      await syncScheduledPaymentAllocations(tx, id);
    }, { timeout: 15000, maxWait: 10000 });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error('Failed to update schedule:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal server error' }, { status: 500 });
  }
}
