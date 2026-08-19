import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PackageScope } from '@prisma/client';
import { serializeDecimals } from '@/lib/money';

export async function GET() {
  try {
    const packages = await prisma.servicePackage.findMany({
      orderBy: [{ scope: 'asc' }, { name: 'asc' }],
      include: {
        services: {
          orderBy: { order: 'asc' },
          include: { service: true },
        },
      },
    });
    return NextResponse.json(serializeDecimals({ packages }));
  } catch (error: unknown) {
    console.error('Failed to fetch service packages:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description, scope, serviceIds } = body;

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 });
    }

    if (!name || (scope !== 'SPACE' && scope !== 'EVENT')) {
      return NextResponse.json({ error: 'Name and a valid scope (SPACE or EVENT) are required' }, { status: 400 });
    }
    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return NextResponse.json({ error: 'At least one service is required' }, { status: 400 });
    }

    const servicePackage = await prisma.servicePackage.create({
      data: {
        tenantId: tenant.id,
        name,
        description: description || null,
        scope: scope as PackageScope,
        services: {
          create: serviceIds.map((serviceId: string, index: number) => ({ serviceId, order: index })),
        },
      },
      include: { services: { orderBy: { order: 'asc' }, include: { service: true } } },
    });

    return NextResponse.json(serializeDecimals({ success: true, package: servicePackage }), { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to create service package:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
