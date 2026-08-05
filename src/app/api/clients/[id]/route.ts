import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, phone, email, companyName, notes } = body;

    const existingClient = await prisma.client.findUnique({
      where: { id },
    });

    if (!existingClient) {
      return NextResponse.json({ error: 'Client not found' }, { status: 404 });
    }

    const updatedClient = await prisma.client.update({
      where: { id },
      data: {
        name: name !== undefined ? name : existingClient.name,
        phone: phone !== undefined ? phone : existingClient.phone,
        email: email !== undefined ? email : existingClient.email,
        companyName: companyName !== undefined ? companyName : existingClient.companyName,
        notes: notes !== undefined ? notes : existingClient.notes,
      },
    });

    return NextResponse.json({ success: true, client: updatedClient });
  } catch (error: unknown) {
    console.error('Failed to update client:', error);
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

    // Soft delete: booking history must never be destroyed, so deactivating (rather than
    // removing the row) is always safe regardless of how many bookings reference this client.
    await prisma.client.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to deactivate client:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
