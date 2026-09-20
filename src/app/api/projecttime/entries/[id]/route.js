import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ProjectTimeTimeEntry from '@/models/ProjectTimeTimeEntry';

export async function PUT(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;
    const body = await req.json();

    const entry = await ProjectTimeTimeEntry.findById(id);
    if (!entry) {
      return NextResponse.json({ success: false, error: 'Time entry not found' }, { status: 404 });
    }

    if (body.projectId !== undefined) entry.projectId = body.projectId;
    if (body.taskId !== undefined) entry.taskId = body.taskId || null;
    if (body.description !== undefined) entry.description = body.description;
    if (body.billable !== undefined) entry.billable = Boolean(body.billable);
    if (body.date !== undefined) entry.date = body.date;
    if (body.timesheetStatus !== undefined) entry.timesheetStatus = body.timesheetStatus;

    if (body.startTime) entry.startTime = new Date(body.startTime);
    if (body.endTime) entry.endTime = new Date(body.endTime);

    if (body.duration !== undefined) {
      entry.duration = Number(body.duration);
    } else if (entry.startTime && entry.endTime) {
      entry.duration = Math.max(
        0,
        Math.floor((entry.endTime.getTime() - entry.startTime.getTime()) / 1000)
      );
    }

    await entry.save();
    return NextResponse.json({ success: true, entry });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    await dbConnect();
    const { id } = await params;

    const entry = await ProjectTimeTimeEntry.findByIdAndDelete(id);
    if (!entry) {
      return NextResponse.json({ success: false, error: 'Time entry not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Time entry deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
