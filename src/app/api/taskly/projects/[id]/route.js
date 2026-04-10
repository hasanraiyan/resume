import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireUserAuth } from '@/lib/money-auth';
import TaskProject from '@/models/TaskProject';
import TaskItem from '@/models/TaskItem';
import { serializeTaskProject } from '@/lib/taskly';

export async function PUT(request, { params }) {
  const session = await requireUserAuth();
  if (typeof session !== 'object') return session;

  try {
    await dbConnect();
    const body = await request.json();
    const payload = {
      name: String(body.name || '').trim(),
      description: String(body.description || '').trim(),
      color: body.color || '#1f644e',
      status: body.status || 'active',
      deadline: body.deadline || null,
    };

    if (!payload.name) {
      return NextResponse.json(
        { success: false, message: 'Project name is required' },
        { status: 400 }
      );
    }

    const project = await TaskProject.findOneAndUpdate(
      { _id: params.id, deletedAt: null, userId: session.user.id },
      payload,
      { new: true }
    ).lean();

    if (!project) {
      return NextResponse.json({ success: false, message: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, project: serializeTaskProject(project) });
  } catch (error) {
    console.error('Failed to update Taskly project:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(_request, { params }) {
  const session = await requireUserAuth();
  if (typeof session !== 'object') return session;

  try {
    await dbConnect();
    const project = await TaskProject.findOneAndUpdate(
      { _id: params.id, deletedAt: null, userId: session.user.id },
      { deletedAt: new Date(), status: 'archived' },
      { new: true }
    );

    if (!project) {
      return NextResponse.json({ success: false, message: 'Project not found' }, { status: 404 });
    }

    await TaskItem.updateMany(
      { project: params.id, deletedAt: null, userId: session.user.id },
      { $set: { project: null } }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete Taskly project:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
