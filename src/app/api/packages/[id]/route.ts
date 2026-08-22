import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PackageScope } from '@prisma/client';
import { serializeDecimals } from '@/lib/money';
import { isServiceCompatibleWithPackageScope } from '@/lib/service-scope';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, scope, serviceIds, quantities } = body;

    const existingPackage = await prisma.package.findUnique({ where: { id } });
    if (!existingPackage) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    const resolvedScope: PackageScope = scope === 'SPACE' || scope === 'EVENT' ? scope : existingPackage.scope;

    if (Array.isArray(serviceIds) && serviceIds.length > 0) {
      // Defense in depth — same compatibility rule as create, checked against whichever scope this
      // update actually resolves to (a scope change and a service-list change can arrive together).
      const candidateServices = await prisma.service.findMany({
        where: { id: { in: serviceIds } },
        select: { id: true, name: true, scope: true },
      });
      const incompatible = candidateServices.filter((s) => !isServiceCompatibleWithPackageScope(s.scope, resolvedScope));
      if (incompatible.length > 0) {
        return NextResponse.json(
          { error: `Not compatible with a ${resolvedScope} package: ${incompatible.map((s) => s.name).join(', ')}` },
          { status: 400 }
        );
      }
    }

    // Replacing the service list wholesale (delete-then-recreate, same pattern used for
    // BookingService sync) keeps `order` simple to maintain — packages are small bundles, not a
    // high-churn list worth diffing.
    const updatedPackage = await prisma.$transaction(async (tx) => {
      if (Array.isArray(serviceIds)) {
        await tx.packageItem.deleteMany({ where: { packageId: id } });
        if (serviceIds.length > 0) {
          await tx.packageItem.createMany({
            data: serviceIds.map((serviceId: string, index: number) => ({
              packageId: id,
              serviceId,
              order: index,
              quantity: quantities?.[serviceId] ?? 1,
            })),
          });
        }
      }

      return tx.package.update({
        where: { id },
        data: {
          name: name !== undefined ? name : existingPackage.name,
          description: description !== undefined ? description : existingPackage.description,
          scope: resolvedScope,
        },
        include: { items: { orderBy: { order: 'asc' }, include: { service: true } } },
      });
    });

    return NextResponse.json(serializeDecimals({ success: true, package: updatedPackage }));
  } catch (error: unknown) {
    console.error('Failed to update service package:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Soft delete, matching the established archive-not-delete pattern for catalog/directory
    // entities — a package that was already applied to a booking left individual BookingService
    // rows behind (each with its own serviceNameSnapshot), so archiving the bundle itself is safe.
    await prisma.package.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to archive service package:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
