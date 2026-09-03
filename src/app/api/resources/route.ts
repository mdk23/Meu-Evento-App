import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const tenant = await prisma.tenant.findFirst({
      include: {
        venue: true,
        inventoryItems: { where: { active: true }, orderBy: { name: 'asc' }, include: { category: true } },
        staff: { orderBy: { name: 'asc' } },
        suppliers: { orderBy: { name: 'asc' } },
      },
    });

    return NextResponse.json({
      venue: tenant?.venue,
      inventoryItems: (tenant?.inventoryItems || []).map((item) => ({ ...item, category: item.category.name })),
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

    if (resourceType === 'VENUE') {
      let venue = await prisma.venue.findUnique({ where: { tenantId: tenant.id } });
      if (venue) {
        venue = await prisma.venue.update({
          where: { tenantId: tenant.id },
          data: {
            name: data.name || venue.name,
            capacity: data.capacity ? parseInt(data.capacity, 10) : venue.capacity,
            address: data.address || venue.address,
            description: data.description || venue.description,
          },
        });
      } else {
        venue = await prisma.venue.create({
          data: {
            tenantId: tenant.id,
            name: data.name || 'Royal Events Venue',
            capacity: parseInt(data.capacity || '500', 10),
            address: data.address || '',
            description: data.description || '',
          },
        });
      }
      return NextResponse.json({ success: true, venue });
    }

    if (resourceType === 'INVENTORY') {
      const categoryName = data.category || 'General Equipment';
      const category = await prisma.inventoryCategory.upsert({
        where: { tenantId_name: { tenantId: tenant.id, name: categoryName } },
        update: {},
        create: { tenantId: tenant.id, name: categoryName },
      });
      // Category → Type → Item refactor (transitional): an item must belong to an InventoryType.
      // Until the dedicated item form sends a chosen type, fall back to the category's "Unclassified"
      // type (creating it if the category was just made), and surface those for manual reclassification.
      let inventoryTypeId: string = data.inventoryTypeId;
      if (!inventoryTypeId) {
        const fallback = await prisma.inventoryType.findFirst({
          where: { tenantId: tenant.id, categoryId: category.id, name: 'Unclassified' },
          select: { id: true },
        });
        inventoryTypeId =
          fallback?.id ??
          (
            await prisma.inventoryType.create({
              data: {
                tenantId: tenant.id,
                categoryId: category.id,
                name: 'Unclassified',
                code: `UNCLASSIFIED_${category.id.slice(0, 8).toUpperCase()}`,
              },
              select: { id: true },
            })
          ).id;
      }
      const item = await prisma.inventoryItem.create({
        data: {
          tenantId: tenant.id,
          name: data.name,
          totalQuantity: parseInt(data.quantity || '0', 10),
          seatingCapacity: parseInt(data.seatingCapacity || '0', 10) || 0,
          categoryId: category.id,
          inventoryTypeId,
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
