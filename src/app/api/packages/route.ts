import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PackageContext, PackagePricingMode } from '@prisma/client';
import { serializeDecimals } from '@/lib/money';
import { isServiceCompatibleWithPackageScope } from '@/lib/service-scope';

function resolvePricingMode(value: unknown): PackagePricingMode {
  return value === 'FIXED' ? PackagePricingMode.FIXED : PackagePricingMode.COMPUTED;
}

/** A package-line price override: a non-negative number, or null for "use the catalog price". */
function resolvePriceOverride(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  const n = parseFloat(String(value));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export async function GET() {
  try {
    const packages = await prisma.package.findMany({
      orderBy: [{ context: 'asc' }, { name: 'asc' }],
      include: {
        items: {
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
    const { name, description, scope, pricingMode, price, capacity, serviceIds, quantities, priceOverrides } = body;

    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      return NextResponse.json({ error: 'No tenant found' }, { status: 400 });
    }

    if (!name || (scope !== 'VENUE' && scope !== 'EVENT')) {
      return NextResponse.json({ error: 'Name and a valid scope (VENUE or EVENT) are required' }, { status: 400 });
    }
    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return NextResponse.json({ error: 'At least one service is required' }, { status: 400 });
    }

    // Defense in depth — the package builder's checklist already filters to compatible services,
    // but a direct API call must not be able to bundle e.g. an EVENT-only service into a VENUE
    // package (or vice versa) just because it bypassed that UI.
    const candidateServices = await prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { id: true, name: true, context: true },
    });
    const incompatible = candidateServices.filter((s) => !isServiceCompatibleWithPackageScope(s.context, scope as 'VENUE' | 'EVENT'));
    if (incompatible.length > 0) {
      return NextResponse.json(
        { error: `Not compatible with a ${scope} package: ${incompatible.map((s) => s.name).join(', ')}` },
        { status: 400 }
      );
    }

    const resolvedPricingMode = resolvePricingMode(pricingMode);

    const servicePackage = await prisma.package.create({
      data: {
        tenantId: tenant.id,
        name,
        description: description || null,
        context: scope as PackageContext,
        pricingMode: resolvedPricingMode,
        price: resolvedPricingMode === PackagePricingMode.FIXED && price !== undefined ? parseFloat(price) : null,
        capacity: capacity !== undefined && capacity !== null && capacity !== '' ? parseInt(String(capacity), 10) : null,
        items: {
          create: serviceIds.map((serviceId: string, index: number) => ({
            tenantId: tenant.id,
            serviceId,
            order: index,
            quantity: quantities?.[serviceId] ?? 1,
            priceOverride: resolvePriceOverride(priceOverrides?.[serviceId]),
          })),
        },
      },
      include: { items: { orderBy: { order: 'asc' }, include: { service: true } } },
    });

    return NextResponse.json(serializeDecimals({ success: true, package: servicePackage }), { status: 201 });
  } catch (error: unknown) {
    console.error('Failed to create service package:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
