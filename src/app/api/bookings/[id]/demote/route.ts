import { NextResponse } from 'next/server';
import { prismaTransaction } from '@/lib/prisma';
import { demoteBookingToSpace, InvalidCrossoverError } from '@/lib/booking-crossover';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prismaTransaction.$transaction((tx) => demoteBookingToSpace(tx, id), { timeout: 15000, maxWait: 10000 });
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof InvalidCrossoverError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error('Failed to demote booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
