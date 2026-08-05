import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { TaskStatus } from '@prisma/client';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; eventServiceId: string; taskId: string }> }
) {
  try {
    const { id: eventId, eventServiceId, taskId } = await params;
    const body = await request.json();
    const { title, status, assignedTo, dueDate } = body;

    const existing = await prisma.eventServiceTask.findUnique({
      where: { id: taskId },
      include: { eventService: true },
    });
    if (!existing || existing.eventServiceId !== eventServiceId || existing.eventService.eventId !== eventId) {
      return NextResponse.json({ error: 'Task not found for this event service' }, { status: 404 });
    }

    const task = await prisma.eventServiceTask.update({
      where: { id: taskId },
      data: {
        title: title !== undefined ? String(title).trim() : undefined,
        status: status && Object.values(TaskStatus).includes(status) ? (status as TaskStatus) : undefined,
        assignedTo: assignedTo !== undefined ? assignedTo || null : undefined,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
      },
    });

    return NextResponse.json({ success: true, task });
  } catch (error: unknown) {
    console.error('Failed to update work order task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; eventServiceId: string; taskId: string }> }
) {
  try {
    const { id: eventId, eventServiceId, taskId } = await params;

    const existing = await prisma.eventServiceTask.findUnique({
      where: { id: taskId },
      include: { eventService: true },
    });
    if (!existing || existing.eventServiceId !== eventServiceId || existing.eventService.eventId !== eventId) {
      return NextResponse.json({ error: 'Task not found for this event service' }, { status: 404 });
    }

    await prisma.eventServiceTask.delete({ where: { id: taskId } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Failed to delete work order task:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
