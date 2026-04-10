import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import { requireUserAuth } from '@/lib/money-auth';
import TaskItem from '@/models/TaskItem';
import { normalizeTaskPayload, serializeTaskItem } from '@/lib/taskly';

export async function GET(request) {
  const session = await requireUserAuth();
  if (typeof session !== 'object') return session;

  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const project = searchParams.get('project');

    const query = { deletedAt: null, userId: session.user.id };
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (project === 'none') query.project = null;
    else if (project) query.project = project;

    const tasks = await TaskItem.find(query)
      .populate('project', 'name color status deadline')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, tasks: tasks.map(serializeTaskItem) });
  } catch (error) {
    console.error('Failed to fetch Taskly tasks:', error);
    return NextResponse.json({ success: false, message: 'Failed to fetch tasks' }, { status: 500 });
  }
}

export async function POST(request) {
  const session = await requireUserAuth();
  if (typeof session !== 'object') return session;

  try {
    await dbConnect();
    const body = await request.json();
    const payload = normalizeTaskPayload(body);

    if (!payload.title) {
      return NextResponse.json(
        { success: false, message: 'Task title is required' },
        { status: 400 }
      );
    }

    const task = await TaskItem.create({ ...payload, userId: session.user.id });
    const populated = await TaskItem.findById(task._id)
      .populate('project', 'name color status deadline')
      .lean();

    return NextResponse.json({ success: true, task: serializeTaskItem(populated) });
  } catch (error) {
    console.error('Failed to create Taskly task:', error);
    return NextResponse.json({ success: false, message: 'Failed to create task' }, { status: 500 });
  }
}
