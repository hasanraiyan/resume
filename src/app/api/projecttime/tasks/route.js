import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ProjectTimeTask from '@/models/ProjectTimeTask';

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const projectId = searchParams.get('projectId');

    const filter = {};
    if (workspaceId) filter.workspaceId = workspaceId;
    if (projectId) filter.projectId = projectId;

    const tasks = await ProjectTimeTask.find(filter).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, tasks });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    if (!body.workspaceId || !body.projectId) {
      return NextResponse.json(
        { success: false, error: 'workspaceId and projectId are required' },
        { status: 400 }
      );
    }

    if (!body.name || !body.name.trim()) {
      return NextResponse.json({ success: false, error: 'Task name is required' }, { status: 400 });
    }

    const task = await ProjectTimeTask.create({
      workspaceId: body.workspaceId,
      projectId: body.projectId,
      name: body.name.trim(),
      description: body.description || '',
      assigneeEmail: body.assigneeEmail || '',
      status: body.status || 'Todo',
      priority: body.priority || 'Medium',
      type: body.type || 'Task',
      estimatedHours: Number(body.estimatedHours) || 0,
      dueDate: body.dueDate ? new Date(body.dueDate) : null,
    });

    return NextResponse.json({ success: true, task }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
