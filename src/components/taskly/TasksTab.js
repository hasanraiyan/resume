'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTaskly } from '@/context/TasklyContext';
import { isTaskDueToday, isTaskOverdue } from '@/lib/taskly';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ClipboardList,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';

const emptyTaskForm = {
  title: '',
  description: '',
  project: '',
  priority: 'medium',
  dueDate: '',
  tags: '',
  status: 'todo',
};

function toInputDate(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : '';
}

function TaskForm({ projects, initialValues, onSubmit, onCancel, submitLabel }) {
  const [form, setForm] = useState(initialValues);

  useEffect(() => {
    setForm(initialValues);
  }, [initialValues]);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(form);
      }}
      className="rounded-2xl border border-[#e5e3d8] bg-white p-5 space-y-4"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
            Task title
          </label>
          <input
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Ship Taskly v1"
            className="mt-2 w-full rounded-xl border border-[#e5e3d8] bg-white px-4 py-3 text-sm outline-none focus:border-[#1f644e]"
            required
          />
        </div>
        <div className="md:col-span-2">
          <label className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
            Description
          </label>
          <textarea
            value={form.description}
            onChange={(event) =>
              setForm((current) => ({ ...current, description: event.target.value }))
            }
            rows={3}
            placeholder="Add the API routes and dashboard cards"
            className="mt-2 w-full rounded-xl border border-[#e5e3d8] bg-white px-4 py-3 text-sm outline-none focus:border-[#1f644e]"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
            Project
          </label>
          <select
            value={form.project}
            onChange={(event) =>
              setForm((current) => ({ ...current, project: event.target.value }))
            }
            className="mt-2 w-full rounded-xl border border-[#e5e3d8] bg-white px-4 py-3 text-sm outline-none focus:border-[#1f644e]"
          >
            <option value="">No project</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
            Priority
          </label>
          <select
            value={form.priority}
            onChange={(event) =>
              setForm((current) => ({ ...current, priority: event.target.value }))
            }
            className="mt-2 w-full rounded-xl border border-[#e5e3d8] bg-white px-4 py-3 text-sm outline-none focus:border-[#1f644e]"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
            Due date
          </label>
          <input
            type="date"
            value={form.dueDate}
            onChange={(event) =>
              setForm((current) => ({ ...current, dueDate: event.target.value }))
            }
            className="mt-2 w-full rounded-xl border border-[#e5e3d8] bg-white px-4 py-3 text-sm outline-none focus:border-[#1f644e]"
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">Tags</label>
          <input
            value={form.tags}
            onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
            placeholder="frontend, dashboard"
            className="mt-2 w-full rounded-xl border border-[#e5e3d8] bg-white px-4 py-3 text-sm outline-none focus:border-[#1f644e]"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          className="rounded-xl bg-[#1f644e] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#17503e]"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[#e5e3d8] px-4 py-2.5 text-sm font-bold text-[#7c8e88] transition hover:bg-[#f8f9f4]"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export default function TasksTab() {
  const {
    projects,
    tasks,
    stats,
    settings,
    selectedProject,
    setSelectedProject,
    addTask,
    updateTask,
    deleteTask,
    setActiveTab,
  } = useTaskly();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState(selectedProject);

  useEffect(() => {
    setProjectFilter(selectedProject);
  }, [selectedProject]);

  const filteredTasks = useMemo(() => {
    const normalized = search.toLowerCase();
    return tasks
      .filter((task) => {
        if (statusFilter !== 'all' && task.status !== statusFilter) return false;
        if (priorityFilter !== 'all' && task.priority !== priorityFilter) return false;
        if (projectFilter === 'none' && task.project) return false;
        if (
          projectFilter !== 'all' &&
          projectFilter !== 'none' &&
          task.project?.id !== projectFilter
        )
          return false;
        if (!normalized) return true;
        return [task.title, task.description, task.project?.name, ...(task.tags || [])]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalized));
      })
      .sort((a, b) => {
        if (settings.sortOrder === 'priority') {
          const score = { high: 3, medium: 2, low: 1 };
          return score[b.priority] - score[a.priority];
        }
        if (settings.sortOrder === 'created') {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
  }, [tasks, search, statusFilter, priorityFilter, projectFilter, settings.sortOrder]);

  const groupedTasks = useMemo(() => {
    const groups = {
      Today: [],
      Upcoming: [],
      Overdue: [],
      'No Due Date': [],
    };

    filteredTasks.forEach((task) => {
      if (!task.dueDate) {
        groups['No Due Date'].push(task);
      } else if (isTaskOverdue(task)) {
        groups.Overdue.push(task);
      } else if (isTaskDueToday(task)) {
        groups.Today.push(task);
      } else {
        groups.Upcoming.push(task);
      }
    });

    return groups;
  }, [filteredTasks]);

  const editingTask = tasks.find((task) => task.id === editingTaskId);

  const buildPayload = (form) => ({
    title: form.title,
    description: form.description,
    project: form.project || null,
    priority: form.priority,
    dueDate: form.dueDate || null,
    tags: form.tags,
    status: form.status || settings.defaultTaskStatus,
  });

  const handleDelete = async (taskId) => {
    if (settings.confirmDelete && !window.confirm('Delete this task?')) return;
    await deleteTask(taskId);
  };

  const toggleTaskStatus = async (task) => {
    await updateTask(task.id, {
      ...task,
      project: task.project?.id || null,
      tags: task.tags,
      status: task.status === 'done' ? 'todo' : 'done',
    });
  };

  return (
    <div className="pb-28 pt-6">
      <div className="w-full px-4 lg:px-6">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-[#e5e3d8] bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1f644e]/10">
                  <ClipboardList className="h-6 w-6 text-[#1f644e]" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
                    Total Tasks
                  </p>
                  <p className="mt-1 text-xl font-bold text-[#1e3a34]">{stats.totalTasks}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-[#e5e3d8] bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1f644e]/10">
                  <CheckCircle2 className="h-6 w-6 text-[#1f644e]" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
                    Completed
                  </p>
                  <p className="mt-1 text-xl font-bold text-[#1e3a34]">{stats.completedTasks}</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-[#e5e3d8] bg-white p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#c94c4c]/10">
                  <AlertTriangle className="h-6 w-6 text-[#c94c4c]" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
                    Overdue
                  </p>
                  <p className="mt-1 text-xl font-bold text-[#1e3a34]">{stats.overdueTasks}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 rounded-2xl border border-[#e5e3d8] bg-white p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#1e3a34]">Manage your work</h2>
                <p className="text-sm text-[#7c8e88]">
                  Capture tasks, triage priorities, and keep the week moving.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => {
                    setShowCreateForm((current) => !current);
                    setEditingTaskId(null);
                  }}
                  className="rounded-xl bg-[#1f644e] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#17503e] flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  New Task
                </button>
                <button
                  onClick={() => setActiveTab('board')}
                  className="rounded-xl border border-[#e5e3d8] px-4 py-2.5 text-sm font-bold text-[#1e3a34] transition hover:bg-[#f8f9f4]"
                >
                  Open Board
                </button>
              </div>
            </div>

            {showCreateForm && (
              <TaskForm
                projects={projects.filter((project) => project.status !== 'archived')}
                initialValues={{ ...emptyTaskForm, status: settings.defaultTaskStatus }}
                submitLabel="Create Task"
                onSubmit={async (form) => {
                  await addTask(buildPayload(form));
                  setShowCreateForm(false);
                }}
              />
            )}

            {editingTask && (
              <TaskForm
                projects={projects.filter((project) => project.status !== 'archived')}
                initialValues={{
                  title: editingTask.title,
                  description: editingTask.description || '',
                  project: editingTask.project?.id || '',
                  priority: editingTask.priority,
                  dueDate: toInputDate(editingTask.dueDate),
                  tags: (editingTask.tags || []).join(', '),
                  status: editingTask.status,
                }}
                submitLabel="Save Changes"
                onSubmit={async (form) => {
                  await updateTask(editingTask.id, buildPayload(form));
                  setEditingTaskId(null);
                }}
                onCancel={() => setEditingTaskId(null)}
              />
            )}
          </div>

          <div className="grid grid-cols-1 gap-3 rounded-2xl border border-[#e5e3d8] bg-white p-5 lg:grid-cols-[1.5fr_repeat(3,minmax(0,1fr))]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7c8e88]" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tasks, tags, or projects..."
                className="w-full rounded-xl border border-[#e5e3d8] bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-[#1f644e]"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-[#e5e3d8] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1f644e]"
            >
              <option value="all">All statuses</option>
              <option value="todo">Todo</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
            </select>
            <select
              value={priorityFilter}
              onChange={(event) => setPriorityFilter(event.target.value)}
              className="rounded-xl border border-[#e5e3d8] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1f644e]"
            >
              <option value="all">All priorities</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={projectFilter}
              onChange={(event) => {
                setProjectFilter(event.target.value);
                setSelectedProject(event.target.value);
              }}
              className="rounded-xl border border-[#e5e3d8] bg-white px-4 py-2.5 text-sm outline-none focus:border-[#1f644e]"
            >
              <option value="all">All projects</option>
              <option value="none">Unassigned</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-6">
            {Object.entries(groupedTasks).map(([groupName, items]) => (
              <div key={groupName}>
                <div className="mb-3 flex items-center gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
                    {groupName}
                  </h3>
                  <div className="h-px flex-1 bg-[#e5e3d8]" />
                  <span className="text-[10px] font-bold text-[#7c8e88]">
                    {items.length} task{items.length === 1 ? '' : 's'}
                  </span>
                </div>
                {items.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#e5e3d8] bg-white p-6 text-sm text-[#7c8e88]">
                    No tasks in this group.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-2xl border border-[#e5e3d8] bg-white p-4 transition hover:bg-[#f8f9f4]"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                  task.status === 'done'
                                    ? 'bg-[#1f644e]/10 text-[#1f644e]'
                                    : task.status === 'in_progress'
                                      ? 'bg-[#4a86e8]/10 text-[#4a86e8]'
                                      : 'bg-[#f1efe3] text-[#7c8e88]'
                                }`}
                              >
                                {task.status.replace('_', ' ')}
                              </span>
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                                  task.priority === 'high'
                                    ? 'bg-[#c94c4c]/10 text-[#c94c4c]'
                                    : task.priority === 'medium'
                                      ? 'bg-[#f59e0b]/10 text-[#b7791f]'
                                      : 'bg-[#1f644e]/10 text-[#1f644e]'
                                }`}
                              >
                                {task.priority}
                              </span>
                              {task.project && (
                                <span
                                  className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                                  style={{
                                    backgroundColor: `${task.project.color}20`,
                                    color: task.project.color,
                                  }}
                                >
                                  {task.project.name}
                                </span>
                              )}
                            </div>
                            <h4 className="text-base font-bold text-[#1e3a34]">{task.title}</h4>
                            {task.description && (
                              <p className="text-sm text-[#7c8e88] max-w-2xl">{task.description}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-3 text-xs text-[#7c8e88]">
                              {task.dueDate && (
                                <span className="inline-flex items-center gap-1.5">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {new Date(task.dueDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </span>
                              )}
                              {!!task.tags?.length &&
                                task.tags.map((tag) => (
                                  <span key={tag} className="rounded-full bg-[#f8f9f4] px-2 py-1">
                                    #{tag}
                                  </span>
                                ))}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2 lg:justify-end">
                            <button
                              onClick={() => toggleTaskStatus(task)}
                              className="rounded-xl border border-[#e5e3d8] px-3 py-2 text-xs font-bold text-[#1e3a34] transition hover:bg-[#f8f9f4]"
                            >
                              {task.status === 'done' ? 'Reopen' : 'Mark Done'}
                            </button>
                            <button
                              onClick={() => setEditingTaskId(task.id)}
                              className="rounded-xl border border-[#e5e3d8] px-3 py-2 text-xs font-bold text-[#1e3a34] transition hover:bg-[#f8f9f4] inline-flex items-center gap-1.5"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(task.id)}
                              className="rounded-xl border border-[#f4d2d2] px-3 py-2 text-xs font-bold text-[#c94c4c] transition hover:bg-[#fef2f2] inline-flex items-center gap-1.5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
