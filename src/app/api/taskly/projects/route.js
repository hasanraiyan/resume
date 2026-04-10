import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireUserAuth } from '@/lib/money-auth';
import TaskProject from '@/models/TaskProject';
import { serializeTaskProject } from '@/lib/taskly';

export async function GET() {
  const session = await requireUserAuth();
  if (typeof session !== 'object') return session;

  try {
    await dbConnect();
    const projects = await TaskProject.find({ deletedAt: null, userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();
    return NextResponse.json({ success: true, projects: projects.map(serializeTaskProject) });
  } catch (error) {
    console.error('Failed to fetch Taskly projects:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
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
      userId: session.user.id,
    };

    if (!payload.name) {
      return NextResponse.json(
        { success: false, message: 'Project name is required' },
        { status: 400 }
      );
    }

    const project = await TaskProject.create(payload);
    return NextResponse.json({ success: true, project: serializeTaskProject(project.toObject()) });
  } catch (error) {
    console.error('Failed to create Taskly project:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create project' },
      { status: 500 }
    );
  }
}
