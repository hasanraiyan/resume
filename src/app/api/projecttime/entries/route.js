import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ProjectTimeTimeEntry from '@/models/ProjectTimeTimeEntry';
import { getProjectTimeUser } from '@/lib/projecttime/auth';

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const projectId = searchParams.get('projectId');
    const taskId = searchParams.get('taskId');
    const userEmail = searchParams.get('userEmail');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const filter = { workspaceId };
    if (projectId) filter.projectId = projectId;
    if (taskId) filter.taskId = taskId;
    if (userEmail) filter.userEmail = userEmail;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    const entries = await ProjectTimeTimeEntry.find(filter)
      .sort({ startTime: -1, createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, entries });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const user = await getProjectTimeUser(req);
    const body = await req.json();

    if (!body.workspaceId || !body.projectId) {
      return NextResponse.json(
        { success: false, error: 'workspaceId and projectId are required' },
        { status: 400 }
      );
    }

    const dateStr = body.date || new Date().toISOString().split('T')[0];
    let startTime = body.startTime ? new Date(body.startTime) : new Date();
    let endTime = body.endTime ? new Date(body.endTime) : null;
    let duration = Number(body.duration) || 0; // Duration in seconds

    if (startTime && endTime && !duration) {
      duration = Math.max(0, Math.floor((endTime.getTime() - startTime.getTime()) / 1000));
    } else if (startTime && duration && !endTime) {
      endTime = new Date(startTime.getTime() + duration * 1000);
    }

    const entry = await ProjectTimeTimeEntry.create({
      workspaceId: body.workspaceId,
      projectId: body.projectId,
      taskId: body.taskId || null,
      userEmail: user.email,
      userName: user.name,
      date: dateStr,
      startTime,
      endTime,
      duration,
      description: body.description || '',
      billable: body.billable !== undefined ? Boolean(body.billable) : true,
      isRunning: false,
      timesheetStatus: body.timesheetStatus || 'Draft',
    });

    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
