import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ProjectTimeTimeEntry from '@/models/ProjectTimeTimeEntry';
import { getProjectTimeUser } from '@/lib/projecttime/auth';

export async function GET(req) {
  try {
    await dbConnect();
    const user = await getProjectTimeUser(req);
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const runningTimer = await ProjectTimeTimeEntry.findOne({
      workspaceId,
      userEmail: user.email,
      isRunning: true,
    }).lean();

    return NextResponse.json({ success: true, runningTimer });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const user = await getProjectTimeUser(req);
    const body = await req.json();
    const { action, workspaceId, projectId, taskId, description, billable } = body;

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    if (action === 'start') {
      if (!projectId) {
        return NextResponse.json(
          { success: false, error: 'projectId is required to start a timer' },
          { status: 400 }
        );
      }

      // Stop any existing running timer for this user in this workspace first
      const existingRunners = await ProjectTimeTimeEntry.find({
        workspaceId,
        userEmail: user.email,
        isRunning: true,
      });

      const now = new Date();
      for (const runner of existingRunners) {
        runner.endTime = now;
        runner.duration = Math.max(
          0,
          Math.floor((now.getTime() - runner.startTime.getTime()) / 1000)
        );
        runner.isRunning = false;
        await runner.save();
      }

      // Create new running entry
      const dateStr = now.toISOString().split('T')[0];
      const timerEntry = await ProjectTimeTimeEntry.create({
        workspaceId,
        projectId,
        taskId: taskId || null,
        userEmail: user.email,
        userName: user.name,
        date: dateStr,
        startTime: now,
        endTime: null,
        duration: 0,
        description: description || '',
        billable: billable !== undefined ? Boolean(billable) : true,
        isRunning: true,
      });

      return NextResponse.json({ success: true, runningTimer: timerEntry }, { status: 201 });
    } else if (action === 'stop') {
      const runningTimer = await ProjectTimeTimeEntry.findOne({
        workspaceId,
        userEmail: user.email,
        isRunning: true,
      });

      if (!runningTimer) {
        return NextResponse.json(
          { success: false, error: 'No running timer found' },
          { status: 404 }
        );
      }

      const now = new Date();
      runningTimer.endTime = now;
      runningTimer.duration = Math.max(
        0,
        Math.floor((now.getTime() - runningTimer.startTime.getTime()) / 1000)
      );
      runningTimer.isRunning = false;
      if (description !== undefined) runningTimer.description = description;

      await runningTimer.save();

      return NextResponse.json({ success: true, entry: runningTimer });
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid action. Must be "start" or "stop"' },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
