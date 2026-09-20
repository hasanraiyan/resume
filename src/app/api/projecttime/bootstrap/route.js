import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ProjectTimeWorkspace from '@/models/ProjectTimeWorkspace';
import ProjectTimeProject from '@/models/ProjectTimeProject';
import ProjectTimeTask from '@/models/ProjectTimeTask';
import ProjectTimeTimeEntry from '@/models/ProjectTimeTimeEntry';
import { getProjectTimeUser } from '@/lib/projecttime/auth';

export async function GET(req) {
  try {
    await dbConnect();
    const user = await getProjectTimeUser(req);
    const { searchParams } = new URL(req.url);
    let requestedWorkspaceId = searchParams.get('workspaceId');

    // Find workspaces where user is owner or member
    let workspaces = await ProjectTimeWorkspace.find({
      $or: [{ ownerEmail: user.email }, { 'members.email': user.email }],
    })
      .sort({ createdAt: 1 })
      .lean();

    // If no workspace exists, seed a default workspace with initial projects and tasks
    if (workspaces.length === 0) {
      const defaultWorkspace = await ProjectTimeWorkspace.create({
        name: `${user.name}'s Workspace`,
        description: 'Main time tracking workspace',
        ownerEmail: user.email,
        members: [{ email: user.email, name: user.name, role: 'Admin' }],
        settings: { alertThresholdPercent: 80 },
      });

      // Create initial sample projects
      const projectCoursify = await ProjectTimeProject.create({
        workspaceId: defaultWorkspace._id,
        name: 'Coursify',
        description: 'AI Course Platform Development',
        estimatedHours: 40,
        status: 'Active',
        members: [user.email],
        color: '#1f644e',
      });

      const projectPyQDeck = await ProjectTimeProject.create({
        workspaceId: defaultWorkspace._id,
        name: 'PyQDeck',
        description: 'Question Deck Generator',
        estimatedHours: 25,
        status: 'Active',
        members: [user.email],
        color: '#4a86e8',
      });

      // Create initial sample tasks
      await ProjectTimeTask.create([
        {
          workspaceId: defaultWorkspace._id,
          projectId: projectCoursify._id,
          name: 'Authentication & Session Flow',
          description: 'Implement OAuth and session handling',
          assigneeEmail: user.email,
          status: 'In Progress',
          priority: 'High',
          type: 'Task',
          estimatedHours: 10,
        },
        {
          workspaceId: defaultWorkspace._id,
          projectId: projectCoursify._id,
          name: 'Course API Endpoints',
          description: 'REST API for course management',
          assigneeEmail: user.email,
          status: 'Todo',
          priority: 'Medium',
          type: 'Task',
          estimatedHours: 15,
        },
        {
          workspaceId: defaultWorkspace._id,
          projectId: projectCoursify._id,
          name: 'Fix Login Session Bug',
          description: 'Investigate token expiry issue on refresh',
          assigneeEmail: user.email,
          status: 'In Progress',
          priority: 'High',
          type: 'Issue',
          estimatedHours: 4,
        },
        {
          workspaceId: defaultWorkspace._id,
          projectId: projectPyQDeck._id,
          name: 'Database Schema & Indexing',
          description: 'Setup MongoDB schemas and text indices',
          assigneeEmail: user.email,
          status: 'Done',
          priority: 'Medium',
          type: 'Task',
          estimatedHours: 8,
        },
      ]);

      // Seed a couple sample completed time entries
      const todayStr = new Date().toISOString().split('T')[0];
      const now = new Date();
      await ProjectTimeTimeEntry.create([
        {
          workspaceId: defaultWorkspace._id,
          projectId: projectCoursify._id,
          userEmail: user.email,
          userName: user.name,
          date: todayStr,
          startTime: new Date(now.getTime() - 2.25 * 3600 * 1000),
          endTime: new Date(now.getTime() - 0.25 * 3600 * 1000),
          duration: 7200, // 2h
          description: 'Working on authentication & session flow',
          billable: true,
          isRunning: false,
        },
      ]);

      workspaces = [defaultWorkspace.toObject()];
    }

    // Determine active workspace
    let activeWorkspace = workspaces.find((w) => w._id.toString() === requestedWorkspaceId);
    if (!activeWorkspace) {
      activeWorkspace = workspaces[0];
    }

    const activeWorkspaceId = activeWorkspace._id;

    // Fetch workspace resources in parallel
    const [projects, tasks, entries, runningTimer] = await Promise.all([
      ProjectTimeProject.find({ workspaceId: activeWorkspaceId }).sort({ createdAt: -1 }).lean(),
      ProjectTimeTask.find({ workspaceId: activeWorkspaceId }).sort({ createdAt: -1 }).lean(),
      ProjectTimeTimeEntry.find({ workspaceId: activeWorkspaceId })
        .sort({ startTime: -1 })
        .limit(100)
        .lean(),
      ProjectTimeTimeEntry.findOne({
        workspaceId: activeWorkspaceId,
        userEmail: user.email,
        isRunning: true,
      }).lean(),
    ]);

    return NextResponse.json({
      success: true,
      user,
      workspaces,
      activeWorkspace,
      projects,
      tasks,
      entries,
      runningTimer,
    });
  } catch (error) {
    console.error('[ProjectTime Bootstrap] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to bootstrap ProjectTime', details: error.message },
      { status: 500 }
    );
  }
}
