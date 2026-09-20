import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ProjectTimeWorkspace from '@/models/ProjectTimeWorkspace';
import { getProjectTimeUser } from '@/lib/projecttime/auth';

export async function GET(req) {
  try {
    await dbConnect();
    const user = await getProjectTimeUser(req);
    const workspaces = await ProjectTimeWorkspace.find({
      $or: [{ ownerEmail: user.email }, { 'members.email': user.email }],
    })
      .sort({ createdAt: 1 })
      .lean();

    return NextResponse.json({ success: true, workspaces });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const user = await getProjectTimeUser(req);
    const body = await req.json();

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Workspace name is required' },
        { status: 400 }
      );
    }

    const workspace = await ProjectTimeWorkspace.create({
      name: body.name.trim(),
      description: body.description || '',
      ownerEmail: user.email,
      members: [{ email: user.email, name: user.name, role: 'Admin' }],
      settings: {
        alertThresholdPercent: body.alertThresholdPercent || 80,
      },
    });

    return NextResponse.json({ success: true, workspace }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
