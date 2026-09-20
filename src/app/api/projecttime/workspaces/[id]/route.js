import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ProjectTimeWorkspace from '@/models/ProjectTimeWorkspace';
import ProjectTimeProject from '@/models/ProjectTimeProject';
import ProjectTimeTask from '@/models/ProjectTimeTask';
import ProjectTimeTimeEntry from '@/models/ProjectTimeTimeEntry';

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const workspace = await ProjectTimeWorkspace.findById(id);
    if (!workspace) {
      return NextResponse.json({ success: false, error: 'Workspace not found' }, { status: 404 });
    }

    if (body.name !== undefined) workspace.name = body.name.trim();
    if (body.description !== undefined) workspace.description = body.description;
    if (body.members !== undefined) workspace.members = body.members;
    if (body.settings !== undefined) {
      workspace.settings = { ...workspace.settings, ...body.settings };
    }

    await workspace.save();
    return NextResponse.json({ success: true, workspace });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const workspace = await ProjectTimeWorkspace.findByIdAndDelete(id);
    if (!workspace) {
      return NextResponse.json({ success: false, error: 'Workspace not found' }, { status: 404 });
    }

    // Cascade delete associated projects, tasks, and time entries
    await Promise.all([
      ProjectTimeProject.deleteMany({ workspaceId: id }),
      ProjectTimeTask.deleteMany({ workspaceId: id }),
      ProjectTimeTimeEntry.deleteMany({ workspaceId: id }),
    ]);

    return NextResponse.json({ success: true, message: 'Workspace deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
