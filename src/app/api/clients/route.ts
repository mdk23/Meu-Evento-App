import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        bookings: {
          include: {
            event: true,
          },
        },
      },
    });
    return NextResponse.json({ clients });
  } catch (error: unknown) {
    console.error('Failed to fetch clients:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, companyName, notes } = body;

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 });
    }

    if (!name) {
      return NextResponse.json({ error: 'Client name is required' }, { status: 400 });
    }

    const client = await prisma.client.create({
      data: {
        tenantId: tenant.id,
        name,
        phone,
        email,
        companyName,
        notes,
      },
    });

    return NextResponse.json({ success: true, client }, { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to create client:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
