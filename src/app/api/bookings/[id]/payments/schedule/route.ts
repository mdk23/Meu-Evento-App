import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PaymentStatus } from '@prisma/client';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { schedules } = body; // Array of { id?: string, name: string, amount: number, dueDate: string }

    const booking = await prisma.booking.findUnique({
      where: { id }
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Basic validation: sum of scheduled amounts should equal booking total
    // (Assuming totalContractAmount is known, but we'll let client handle strict validation for now or we can query it)
    
    await prisma.$transaction(async (tx) => {
      // Get existing schedules
      const existingSchedules = await tx.scheduledPayment.findMany({
        where: { bookingId: id }
      });

      const incomingIds = schedules.filter((s: any) => s.id).map((s: any) => s.id);
      
      // Prevent deleting schedules that have payments
      const schedulesToDelete = existingSchedules.filter(es => !incomingIds.includes(es.id));
      for (const s of schedulesToDelete) {
        if (s.paidAmount > 0) {
          throw new Error(`Cannot delete schedule "${s.name}" because it has been partially or fully paid.`);
        }
        await tx.scheduledPayment.delete({ where: { id: s.id } });
      }

      // Upsert schedules
      for (const s of schedules) {
        if (s.id) {
          const existing = existingSchedules.find(es => es.id === s.id);
          if (existing && existing.paidAmount > parseFloat(s.amount)) {
             throw new Error(`Cannot set amount of "${s.name}" lower than already paid amount (${existing.paidAmount}).`);
          }

          let newStatus = existing?.status || PaymentStatus.PENDING;
          if (existing) {
             if (existing.paidAmount >= parseFloat(s.amount)) {
                 newStatus = PaymentStatus.PAID;
             } else if (existing.paidAmount > 0) {
                 newStatus = PaymentStatus.PARTIALLY_PAID;
             } else {
                 newStatus = PaymentStatus.PENDING;
             }
          }

          await tx.scheduledPayment.update({
            where: { id: s.id },
            data: {
              name: s.name,
              amount: parseFloat(s.amount),
              dueDate: new Date(s.dueDate),
              status: newStatus
            }
          });
        } else {
          await tx.scheduledPayment.create({
            data: {
              tenantId: booking.tenantId,
              bookingId: id,
              name: s.name,
              amount: parseFloat(s.amount),
              dueDate: new Date(s.dueDate),
            }
          });
        }
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Failed to update schedule:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
