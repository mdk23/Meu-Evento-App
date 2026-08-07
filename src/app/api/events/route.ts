import { NextResponse } from 'next/server';
import { EventService } from '@/lib/services/event.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

    const data = await EventService.getEvents({ page });
    return NextResponse.json(data);
  } catch (error: unknown) {
    console.error('Failed to fetch events:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
