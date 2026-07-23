import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const events = await prisma.event.findMany({
      orderBy: { date: 'asc' },
      include: {
        booking: {
          include: {
            client: true,
          },
        },
        eventServices: {
          include: {
            service: true,
            supplier: true,
          },
        },
        guests: true,
      },
    });

    return NextResponse.json({ events });
  } catch (error: unknown) {
    console.error('Failed to fetch events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
