import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ProjectTimeTask from '@/models/ProjectTimeTask';

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const task = await ProjectTimeTask.findById(id);
    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    if (body.name !== undefined) task.name = body.name.trim();
    if (body.description !== undefined) task.description = body.description;
    if (body.assigneeEmail !== undefined) task.assigneeEmail = body.assigneeEmail;
    if (body.status !== undefined) task.status = body.status;
    if (body.priority !== undefined) task.priority = body.priority;
    if (body.type !== undefined) task.type = body.type;
    if (body.estimatedHours !== undefined) task.estimatedHours = Number(body.estimatedHours);
    if (body.dueDate !== undefined) task.dueDate = body.dueDate ? new Date(body.dueDate) : null;

    await task.save();
    return NextResponse.json({ success: true, task });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const task = await ProjectTimeTask.findByIdAndDelete(id);
    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Task deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
