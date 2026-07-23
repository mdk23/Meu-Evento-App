import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ExecutionType } from '@prisma/client';

export async function GET() {
  try {
    const services = await prisma.service.findMany({
      orderBy: { category: 'asc' },
    });
    return NextResponse.json({ services });
  } catch (error: unknown) {
    console.error('Failed to fetch catalog services:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, executionType, priceType, defaultPrice, templateSchema } = body;

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 });
    }

    if (!name || !category) {
      return NextResponse.json({ error: 'Name and Category are required' }, { status: 400 });
    }

    const service = await prisma.service.create({
      data: {
        tenantId: tenant.id,
        name,
        category,
        executionType: executionType === 'EXTERNAL' ? ExecutionType.EXTERNAL : ExecutionType.INTERNAL,
        priceType: priceType || 'FIXED',
        defaultPrice: parseFloat(defaultPrice || 0),
        templateSchema: typeof templateSchema === 'object' ? JSON.stringify(templateSchema) : templateSchema,
      },
    });

    return NextResponse.json({ success: true, service }, { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to create catalog service:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
