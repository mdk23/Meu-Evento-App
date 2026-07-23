import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const eventId = id;

    // Get all guests for this event to calculate food preferences
    const guests = await prisma.guest.findMany({
      where: { eventId, status: 'ATTENDING' },
    });

    const menuSummary = guests.reduce((acc: Record<string, number>, guest) => {
      const pref = guest.menuPreference || 'STANDARD';
      const covers = 1 + guest.plusOnes; // guest + their plus ones
      acc[pref] = (acc[pref] || 0) + covers;
      return acc;
    }, {});

    // Also get total RSVP attending vs pending
    const allGuests = await prisma.guest.findMany({
      where: { eventId },
    });

    const rsvpSummary = allGuests.reduce((acc: Record<string, number>, guest) => {
      const status = guest.status || 'PENDING';
      const count = 1 + guest.plusOnes;
      acc[status] = (acc[status] || 0) + count;
      return acc;
    }, { PENDING: 0, ATTENDING: 0, DECLINED: 0 });

    return NextResponse.json({
      menuSummary,
      rsvpSummary,
      totalExpectedCovers: Object.values(menuSummary).reduce((a, b) => a + b, 0),
    });
  } catch (error) {
    console.error('Failed to load kitchen dashboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
