import { NextResponse } from 'next/server';
import dbConnect from '@/lib/dbConnect';
import ProjectTimeProject from '@/models/ProjectTimeProject';
import ProjectTimeTask from '@/models/ProjectTimeTask';
import ProjectTimeTimeEntry from '@/models/ProjectTimeTimeEntry';

export async function GET(req) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const workspaceId = searchParams.get('workspaceId');
    const projectId = searchParams.get('projectId');
    const userEmail = searchParams.get('userEmail');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const format = searchParams.get('format');

    if (!workspaceId) {
      return NextResponse.json(
        { success: false, error: 'workspaceId is required' },
        { status: 400 }
      );
    }

    const filter = { workspaceId, isRunning: false };
    if (projectId) filter.projectId = projectId;
    if (userEmail) filter.userEmail = userEmail;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = startDate;
      if (endDate) filter.date.$lte = endDate;
    }

    const [projects, tasks, entries] = await Promise.all([
      ProjectTimeProject.find({ workspaceId }).lean(),
      ProjectTimeTask.find({ workspaceId }).lean(),
      ProjectTimeTimeEntry.find(filter).lean(),
    ]);

    const projectMap = new Map(projects.map((p) => [p._id.toString(), p]));
    const taskMap = new Map(tasks.map((t) => [t._id.toString(), t]));

    // Aggregations
    let totalDurationSeconds = 0;
    let billableDurationSeconds = 0;

    const byProject = {};
    const byTask = {};
    const byUser = {};

    entries.forEach((entry) => {
      const dur = entry.duration || 0;
      totalDurationSeconds += dur;
      if (entry.billable) billableDurationSeconds += dur;

      // Project breakdown
      const pId = entry.projectId?.toString();
      if (pId) {
        if (!byProject[pId]) {
          const projObj = projectMap.get(pId);
          byProject[pId] = {
            id: pId,
            name: projObj ? projObj.name : 'Unknown Project',
            estimatedHours: projObj ? projObj.estimatedHours : 0,
            trackedSeconds: 0,
            entriesCount: 0,
          };
        }
        byProject[pId].trackedSeconds += dur;
        byProject[pId].entriesCount += 1;
      }

      // Task breakdown
      const tId = entry.taskId?.toString();
      if (tId) {
        if (!byTask[tId]) {
          const taskObj = taskMap.get(tId);
          byTask[tId] = {
            id: tId,
            name: taskObj ? taskObj.name : 'Unknown Task',
            projectName: pId && projectMap.get(pId) ? projectMap.get(pId).name : 'Unassigned',
            estimatedHours: taskObj ? taskObj.estimatedHours : 0,
            trackedSeconds: 0,
          };
        }
        byTask[tId].trackedSeconds += dur;
      }

      // User breakdown
      const uEmail = entry.userEmail || 'Unknown User';
      if (!byUser[uEmail]) {
        byUser[uEmail] = {
          email: uEmail,
          name: entry.userName || uEmail.split('@')[0],
          trackedSeconds: 0,
          entriesCount: 0,
        };
      }
      byUser[uEmail].trackedSeconds += dur;
      byUser[uEmail].entriesCount += 1;
    });

    // Format CSV export if requested
    if (format === 'csv') {
      const csvHeader = 'Date,User,Project,Task,Description,Duration (Hours),Billable\n';
      const csvRows = entries
        .map((e) => {
          const pName = e.projectId ? projectMap.get(e.projectId.toString())?.name || '' : '';
          const tName = e.taskId ? taskMap.get(e.taskId.toString())?.name || '' : '';
          const hours = (e.duration / 3600).toFixed(2);
          const desc = `"${(e.description || '').replace(/"/g, '""')}"`;
          return `${e.date},${e.userEmail},"${pName}","${tName}",${desc},${hours},${e.billable ? 'Yes' : 'No'}`;
        })
        .join('\n');

      return new NextResponse(csvHeader + csvRows, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="ProjectTime-Report-${startDate || 'all'}-${endDate || 'all'}.csv"`,
        },
      });
    }

    return NextResponse.json({
      success: true,
      summary: {
        totalHours: Number((totalDurationSeconds / 3600).toFixed(2)),
        billableHours: Number((billableDurationSeconds / 3600).toFixed(2)),
        nonBillableHours: Number(
          ((totalDurationSeconds - billableDurationSeconds) / 3600).toFixed(2)
        ),
        totalEntries: entries.length,
      },
      byProject: Object.values(byProject).map((p) => ({
        ...p,
        trackedHours: Number((p.trackedSeconds / 3600).toFixed(2)),
        remainingHours: Number((p.estimatedHours - p.trackedSeconds / 3600).toFixed(2)),
        isOverBudget: p.estimatedHours > 0 && p.trackedSeconds / 3600 > p.estimatedHours,
      })),
      byTask: Object.values(byTask).map((t) => ({
        ...t,
        trackedHours: Number((t.trackedSeconds / 3600).toFixed(2)),
        remainingHours: Number((t.estimatedHours - t.trackedSeconds / 3600).toFixed(2)),
      })),
      byUser: Object.values(byUser).map((u) => ({
        ...u,
        trackedHours: Number((u.trackedSeconds / 3600).toFixed(2)),
      })),
      entries,
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
