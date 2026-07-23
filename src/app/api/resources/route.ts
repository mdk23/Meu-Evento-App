import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tenant = await prisma.tenant.findFirst({
      include: {
        space: true,
        inventoryItems: { orderBy: { name: 'asc' } },
        staff: { orderBy: { name: 'asc' } },
        suppliers: { orderBy: { name: 'asc' } },
      },
    });

    return NextResponse.json({
      space: tenant?.space,
      inventoryItems: tenant?.inventoryItems || [],
      staff: tenant?.staff || [],
      suppliers: tenant?.suppliers || [],
    });
  } catch (error: unknown) {
    console.error('Failed to fetch resources:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { resourceType, ...data } = body;

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 });
    }

    if (resourceType === 'SPACE') {
      let space = await prisma.space.findUnique({ where: { tenantId: tenant.id } });
      if (space) {
        space = await prisma.space.update({
          where: { tenantId: tenant.id },
          data: {
            name: data.name || space.name,
            capacity: data.capacity ? parseInt(data.capacity, 10) : space.capacity,
            address: data.address || space.address,
            description: data.description || space.description,
          },
        });
      } else {
        space = await prisma.space.create({
          data: {
            tenantId: tenant.id,
            name: data.name || 'Royal Events Space',
            capacity: parseInt(data.capacity || '500', 10),
            address: data.address || '',
            description: data.description || '',
          },
        });
      }
      return NextResponse.json({ success: true, space });
    }

    if (resourceType === 'INVENTORY') {
      const item = await prisma.inventoryItem.create({
        data: {
          tenantId: tenant.id,
          name: data.name,
          quantity: parseInt(data.quantity || '0', 10),
          category: data.category || 'General Equipment',
        },
      });
      return NextResponse.json({ success: true, item }, { status: 201 });
    }

    if (resourceType === 'STAFF') {
      const staffMember = await prisma.staff.create({
        data: {
          tenantId: tenant.id,
          name: data.name,
          role: data.role,
          email: data.email || null,
          phone: data.phone || null,
        },
      });
      return NextResponse.json({ success: true, staffMember }, { status: 201 });
    }

    if (resourceType === 'SUPPLIER') {
      const supplier = await prisma.supplier.create({
        data: {
          tenantId: tenant.id,
          name: data.name,
          category: data.category,
          email: data.email || null,
          phone: data.phone || null,
        },
      });
      return NextResponse.json({ success: true, supplier }, { status: 201 });
    }

    return NextResponse.json({ error: 'Invalid resourceType' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Failed to update resources:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
