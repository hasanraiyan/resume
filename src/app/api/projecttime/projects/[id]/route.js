import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ProjectTimeProject from '@/models/ProjectTimeProject';
import ProjectTimeTask from '@/models/ProjectTimeTask';
import ProjectTimeTimeEntry from '@/models/ProjectTimeTimeEntry';

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const project = await ProjectTimeProject.findById(id);
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    if (body.name !== undefined) project.name = body.name.trim();
    if (body.description !== undefined) project.description = body.description;
    if (body.estimatedHours !== undefined) project.estimatedHours = Number(body.estimatedHours);
    if (body.status !== undefined) project.status = body.status;
    if (body.deadline !== undefined)
      project.deadline = body.deadline ? new Date(body.deadline) : null;
    if (body.members !== undefined) project.members = body.members;
    if (body.color !== undefined) project.color = body.color;

    await project.save();
    return NextResponse.json({ success: true, project });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const project = await ProjectTimeProject.findByIdAndDelete(id);
    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 });
    }

    // Cascade delete tasks and time entries
    await Promise.all([
      ProjectTimeTask.deleteMany({ projectId: id }),
      ProjectTimeTimeEntry.deleteMany({ projectId: id }),
    ]);

    return NextResponse.json({ success: true, message: 'Project deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
