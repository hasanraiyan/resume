import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireAdminAuth } from '@/lib/money-auth';
import TaskItem from '@/models/TaskItem';
import { normalizeTaskPayload, serializeTaskItem } from '@/lib/taskly';

export async function PUT(request, { params }) {
  const session = await requireAdminAuth();
  if (typeof session !== 'object') return session;

  try {
    await dbConnect();
    const body = await request.json();
    const payload = normalizeTaskPayload(body);

    if (!payload.title) {
      return NextResponse.json(
        { success: false, message: 'Task title is required' },
        { status: 400 }
      );
    }

    const updated = await TaskItem.findOneAndUpdate({ _id: params.id, deletedAt: null }, payload, {
      new: true,
    })
      .populate('project', 'name color status deadline')
      .lean();

    if (!updated) {
      return NextResponse.json({ success: false, message: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, task: serializeTaskItem(updated) });
  } catch (error) {
    console.error('Failed to update Taskly task:', error);
    return NextResponse.json({ success: false, message: 'Failed to update task' }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  const session = await requireAdminAuth();
  if (typeof session !== 'object') return session;

  try {
    await dbConnect();
    const task = await TaskItem.findOneAndUpdate(
      { _id: params.id, deletedAt: null },
      { deletedAt: new Date() },
      { new: true }
    );

    if (!task) {
      return NextResponse.json({ success: false, message: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete Taskly task:', error);
    return NextResponse.json({ success: false, message: 'Failed to delete task' }, { status: 500 });
  }
}
