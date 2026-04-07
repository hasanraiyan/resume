import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import dbConnect from '@/lib/dbConnect';
import TaskItem from '@/models/TaskItem';
import TaskProject from '@/models/TaskProject';
import { buildTaskInsights } from '@/lib/taskly';

async function ensureDb() {
  await dbConnect();
}

export function createGetTasksTool() {
  return tool(
    async ({ status, priority, limit }) => {
      await ensureDb();
      const query = { deletedAt: null };
      if (status) query.status = status;
      if (priority) query.priority = priority;

      const tasks = await TaskItem.find(query)
        .populate('project', 'name color')
        .sort({ createdAt: -1 })
        .limit(limit || 20)
        .lean();

      return JSON.stringify(
        tasks.map((t) => ({
          id: t._id.toString(),
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority,
          project: t.project?.name || 'Unassigned',
          dueDate: t.dueDate,
          tags: t.tags || [],
        }))
      );
    },
    {
      name: 'get_tasks',
      description:
        'Get tasks from the user. Optionally filter by status (todo, in_progress, done), priority (low, medium, high) and limit. Use this when the user asks about their tasks, what they need to do, or what is currently in progress.',
      schema: z.object({
        status: z
          .enum(['todo', 'in_progress', 'done'])
          .optional()
          .describe('Filter by task status'),
        priority: z.enum(['low', 'medium', 'high']).optional().describe('Filter by task priority'),
        limit: z.number().optional().describe('Maximum number of tasks to return (default 20)'),
      }),
    }
  );
}

export function createGetProjectsTool() {
  return tool(
    async ({ status }) => {
      await ensureDb();
      const query = { deletedAt: null };
      if (status) query.status = status;

      const projects = await TaskProject.find(query).sort({ createdAt: -1 }).lean();

      return JSON.stringify(
        projects.map((p) => ({
          id: p._id.toString(),
          name: p.name,
          description: p.description,
          status: p.status,
          deadline: p.deadline,
        }))
      );
    },
    {
      name: 'get_projects',
      description:
        'Get projects from the user. Optionally filter by status (active, completed, archived). Use this when the user asks about their projects.',
      schema: z.object({
        status: z
          .enum(['active', 'completed', 'archived'])
          .optional()
          .describe('Filter by project status'),
      }),
    }
  );
}

export function createGetInsightsTool() {
  return tool(
    async () => {
      await ensureDb();

      const [tasks, projects] = await Promise.all([
        TaskItem.find({ deletedAt: null }).lean(),
        TaskProject.find({ deletedAt: null }).lean(),
      ]);

      const insights = buildTaskInsights(tasks);
      const activeProjects = projects.filter((p) => p.status === 'active').length;

      return JSON.stringify({
        totalTasks: insights.totalTasks,
        completedTasks: insights.completedTasks,
        completionRate: insights.completionRate,
        overdueTasks: insights.overdueTasks,
        dueTodayTasks: insights.dueTodayTasks,
        activeProjects,
        totalProjects: projects.length,
      });
    },
    {
      name: 'get_insights',
      description:
        'Get productivity insights, including total tasks, completed tasks, overdue tasks, tasks due today, and project statistics. Use this when the user asks for a summary or insights on their productivity or task status.',
      schema: z.object({}),
    }
  );
}

export function createTasklyTools() {
  return [createGetTasksTool(), createGetProjectsTool(), createGetInsightsTool()];
}
