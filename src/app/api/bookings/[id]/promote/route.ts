import { NextResponse } from 'next/server';
import { prismaTransaction } from '@/lib/prisma';
import { promoteBookingToEvent, InvalidCrossoverError } from '@/lib/booking-crossover';
import { serializeDecimals } from '@/lib/money';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const event = await prismaTransaction.$transaction((tx) => promoteBookingToEvent(tx, id), { timeout: 15000, maxWait: 10000 });
    return NextResponse.json(serializeDecimals({ success: true, event }));
  } catch (error: unknown) {
    if (error instanceof InvalidCrossoverError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Failed to promote booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
