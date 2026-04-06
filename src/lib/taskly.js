export function serializeTaskProject(project) {
  return {
    ...project,
    _id: project._id.toString(),
    id: project._id.toString(),
    deadline: project.deadline ? new Date(project.deadline).toISOString() : null,
    deletedAt: project.deletedAt ? new Date(project.deletedAt).toISOString() : null,
    updatedAt: project.updatedAt ? new Date(project.updatedAt).toISOString() : null,
    createdAt: project.createdAt ? new Date(project.createdAt).toISOString() : null,
  };
}

export function serializeTaskItem(task) {
  return {
    ...task,
    _id: task._id.toString(),
    id: task._id.toString(),
    project: task.project
      ? {
          ...task.project,
          _id: task.project._id.toString(),
          id: task.project._id.toString(),
          deadline: task.project.deadline ? new Date(task.project.deadline).toISOString() : null,
        }
      : null,
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : null,
    completedAt: task.completedAt ? new Date(task.completedAt).toISOString() : null,
    deletedAt: task.deletedAt ? new Date(task.deletedAt).toISOString() : null,
    updatedAt: task.updatedAt ? new Date(task.updatedAt).toISOString() : null,
    createdAt: task.createdAt ? new Date(task.createdAt).toISOString() : null,
  };
}

export function isTaskOverdue(task, now = new Date()) {
  if (!task?.dueDate || task.status === 'done') return false;
  return new Date(task.dueDate) < now;
}

export function isTaskDueToday(task, now = new Date()) {
  if (!task?.dueDate) return false;
  const dueDate = new Date(task.dueDate);
  return dueDate.toDateString() === now.toDateString();
}

export function buildTaskStats(tasks, projects, now = new Date()) {
  const activeProjects = projects.filter((project) => project.status === 'active').length;
  const completedTasks = tasks.filter((task) => task.status === 'done').length;
  const overdueTasks = tasks.filter((task) => isTaskOverdue(task, now)).length;
  const dueTodayTasks = tasks.filter((task) => isTaskDueToday(task, now)).length;
  const totalTasks = tasks.length;

  return {
    totalTasks,
    completedTasks,
    overdueTasks,
    dueTodayTasks,
    activeProjects,
    projectCount: projects.length,
    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
  };
}

export function buildTaskInsights(tasks, projects, now = new Date()) {
  const projectMap = new Map(
    projects.map((project) => [project._id?.toString?.() || project.id, project])
  );

  const byPriority = ['high', 'medium', 'low'].map((priority) => ({
    priority,
    count: tasks.filter((task) => task.priority === priority).length,
  }));

  const byStatus = ['todo', 'in_progress', 'done'].map((status) => ({
    status,
    count: tasks.filter((task) => task.status === status).length,
  }));

  const byProject = projects.map((project) => {
    const projectId = project._id?.toString?.() || project.id;
    const projectTasks = tasks.filter((task) => {
      const taskProjectId = task.project?._id?.toString?.() || task.project?.toString?.();
      return taskProjectId === projectId;
    });
    const completed = projectTasks.filter((task) => task.status === 'done').length;
    const overdue = projectTasks.filter((task) => isTaskOverdue(task, now)).length;

    return {
      projectId,
      name: project.name,
      color: project.color,
      status: project.status,
      total: projectTasks.length,
      completed,
      overdue,
      completionRate:
        projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0,
    };
  });

  const unassignedTasks = tasks.filter((task) => !task.project).length;
  const upcomingTasks = tasks.filter(
    (task) => task.dueDate && !isTaskOverdue(task, now) && task.status !== 'done'
  ).length;

  return {
    stats: buildTaskStats(tasks, projects, now),
    byPriority,
    byStatus,
    byProject,
    unassignedTasks,
    upcomingTasks,
    overdueTasks: tasks.filter((task) => isTaskOverdue(task, now)).length,
    recentCompleted: tasks
      .filter((task) => task.completedAt)
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 5)
      .map((task) => ({
        id: task._id?.toString?.() || task.id,
        title: task.title,
        completedAt: new Date(task.completedAt).toISOString(),
        projectName: task.project
          ? (projectMap.get(task.project._id?.toString?.() || task.project?.toString?.())?.name ??
            task.project.name ??
            null)
          : null,
      })),
  };
}

export function normalizeTaskPayload(payload = {}) {
  const nextStatus = payload.status || 'todo';

  return {
    title: String(payload.title || '').trim(),
    description: String(payload.description || '').trim(),
    project: payload.project || null,
    status: nextStatus,
    priority: payload.priority || 'medium',
    dueDate: payload.dueDate || null,
    completedAt: nextStatus === 'done' ? payload.completedAt || new Date().toISOString() : null,
    tags: Array.isArray(payload.tags)
      ? payload.tags
      : String(payload.tags || '')
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
  };
}
