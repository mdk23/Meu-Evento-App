import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ClientService } from '@/lib/services/client.service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);

    const data = await ClientService.getClients({ page });
    return NextResponse.json(data);
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
