import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireAdminAuth } from '@/lib/money-auth';
import TaskProject from '@/models/TaskProject';
import TaskItem from '@/models/TaskItem';
import { buildTaskStats, serializeTaskItem, serializeTaskProject } from '@/lib/taskly';

export async function GET() {
  const session = await requireAdminAuth();
  if (typeof session !== 'object') return session;

  try {
    await dbConnect();

    const [projects, tasks] = await Promise.all([
      TaskProject.find({ deletedAt: null }).sort({ createdAt: -1 }).lean(),
      TaskItem.find({ deletedAt: null })
        .populate('project', 'name color status deadline')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    return NextResponse.json({
      success: true,
      projects: projects.map(serializeTaskProject),
      tasks: tasks.map(serializeTaskItem),
      stats: buildTaskStats(tasks, projects),
    });
  } catch (error) {
    console.error('Failed to fetch Taskly bootstrap:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch Taskly bootstrap data' },
      { status: 500 }
    );
  }
}
