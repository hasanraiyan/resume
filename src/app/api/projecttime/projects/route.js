import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ProjectTimeProject from '@/models/ProjectTimeProject';

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'workspaceId parameter is required' },
        { status: 400 }
      );
    }

    const projects = await ProjectTimeProject.find({ workspaceId }).sort({ createdAt: -1 }).lean();
    return NextResponse.json({ success: true, projects });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json();

    if (!body.workspaceId) {
      return NextResponse.json(
        { success: false, error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Project name is required' },
        { status: 400 }
      );
    }

    const project = await ProjectTimeProject.create({
      workspaceId: body.workspaceId,
      name: body.name.trim(),
      description: body.description || '',
      estimatedHours: Number(body.estimatedHours) || 0,
      status: body.status || 'Active',
      deadline: body.deadline ? new Date(body.deadline) : null,
      members: body.members || [],
      color: body.color || '#1f644e',
    });

    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
