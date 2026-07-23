import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const guests = await prisma.guest.findMany({
      where: { eventId: resolvedParams.id },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json({ guests });
  } catch (error) {
    console.error('Failed to fetch guests:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const guest = await prisma.guest.create({
      data: {
        eventId: resolvedParams.id,
        name: body.name,
        email: body.email,
        status: body.status || 'PENDING',
        plusOnes: body.plusOnes || 0,
      }
    });
    return NextResponse.json({ guest }, { status: 201 });
  } catch (error) {
    console.error('Failed to create guest:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
