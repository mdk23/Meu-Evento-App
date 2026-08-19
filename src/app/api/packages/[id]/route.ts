import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PackageScope } from '@prisma/client';
import { serializeDecimals } from '@/lib/money';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description, scope, serviceIds } = body;

    const existingPackage = await prisma.servicePackage.findUnique({ where: { id } });
    if (!existingPackage) {
      return NextResponse.json({ error: 'Package not found' }, { status: 404 });
    }

    // Replacing the service list wholesale (delete-then-recreate, same pattern used for
    // EventService sync) keeps `order` simple to maintain — packages are small bundles, not a
    // high-churn list worth diffing.
    const updatedPackage = await prisma.$transaction(async (tx) => {
      if (Array.isArray(serviceIds)) {
        await tx.packageService.deleteMany({ where: { packageId: id } });
        if (serviceIds.length > 0) {
          await tx.packageService.createMany({
            data: serviceIds.map((serviceId: string, index: number) => ({ packageId: id, serviceId, order: index })),
          });
        }
      }

      return tx.servicePackage.update({
        where: { id },
        data: {
          name: name !== undefined ? name : existingPackage.name,
          description: description !== undefined ? description : existingPackage.description,
          scope: scope === 'SPACE' || scope === 'EVENT' ? (scope as PackageScope) : existingPackage.scope,
        },
        include: { services: { orderBy: { order: 'asc' }, include: { service: true } } },
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
    // entities — a package that was already applied to a booking left individual EventService
    // rows behind (each with its own serviceNameSnapshot), so archiving the bundle itself is safe.
    await prisma.servicePackage.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to archive service package:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
