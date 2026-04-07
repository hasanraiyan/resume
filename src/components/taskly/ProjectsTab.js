'use client';

import { useMemo, useState } from 'react';
import { useTaskly } from '@/context/TasklyContext';
import { isTaskOverdue } from '@/lib/taskly';
import { Archive, FolderKanban, Pencil, Plus, Trash2 } from 'lucide-react';

const emptyProjectForm = {
  name: '',
  description: '',
  color: '#1f644e',
  status: 'active',
  deadline: '',
};

export default function ProjectsTab() {
  const {
    projects,
    tasks,
    settings,
    addProject,
    updateProject,
    deleteProject,
    setSelectedProject,
    setActiveTab,
  } = useTaskly();
  const [form, setForm] = useState(emptyProjectForm);
  const [editingId, setEditingId] = useState(null);

  const projectStats = useMemo(
    () =>
      projects.map((project) => {
        const projectTasks = tasks.filter((task) => task.project?.id === project.id);
        const completed = projectTasks.filter((task) => task.status === 'done').length;
        const overdue = projectTasks.filter((task) => isTaskOverdue(task)).length;
        return {
          ...project,
          totalTasks: projectTasks.length,
          completedTasks: completed,
          overdueTasks: overdue,
          completionRate:
            projectTasks.length > 0 ? Math.round((completed / projectTasks.length) * 100) : 0,
        };
      }),
    [projects, tasks]
  );

  const [isModalOpen, setIsModalOpen] = useState(false);

  const resetForm = () => {
    setForm({ ...emptyProjectForm, color: settings.defaultProjectColor });
    setEditingId(null);
    setIsModalOpen(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      ...form,
      deadline: form.deadline || null,
    };

    if (editingId) {
      await updateProject(editingId, payload);
    } else {
      await addProject(payload);
    }

    resetForm();
  };

  const handleEdit = (project) => {
    setEditingId(project.id);
    setForm({
      name: project.name,
      description: project.description || '',
      color: project.color || '#1f644e',
      status: project.status || 'active',
      deadline: project.deadline ? new Date(project.deadline).toISOString().slice(0, 10) : '',
    });
    setIsModalOpen(true);
  };

  return (
    <div className="pb-28 pt-6">
      <div className="w-full px-4 lg:px-6">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          <div className="rounded-2xl border border-[#e5e3d8] bg-white p-5">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <h2 className="text-lg font-bold text-[#1e3a34]">Projects</h2>
                <p className="text-sm text-[#7c8e88]">
                  Group tasks into focused workstreams with color, deadline, and progress tracking.
                </p>
              </div>
              <button
                onClick={() => {
                  setForm({ ...emptyProjectForm, color: settings.defaultProjectColor });
                  setEditingId(null);
                  setIsModalOpen(true);
                }}
                className="rounded-xl bg-[#1f644e] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#17503e] inline-flex items-center gap-2 justify-center"
              >
                <Plus className="w-4 h-4" />
                Add Project
              </button>
            </div>
          </div>

          {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
              <div className="w-full max-w-2xl rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh]">
                <div className="flex items-center justify-between border-b border-[#e5e3d8] p-5">
                  <h2 className="text-lg font-bold text-[#1e3a34]">
                    {editingId ? 'Edit Project' : 'Create New Project'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-[#7c8e88] hover:text-[#1e3a34] transition p-1"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-5 overflow-y-auto">
                  <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
                        Project name
                      </label>
                      <input
                        value={form.name}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, name: event.target.value }))
                        }
                        placeholder="Taskly Launch"
                        className="mt-2 w-full rounded-xl border border-[#e5e3d8] bg-white px-4 py-3 text-sm outline-none focus:border-[#1f644e]"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
                        Status
                      </label>
                      <select
                        value={form.status}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, status: event.target.value }))
                        }
                        className="mt-2 w-full rounded-xl border border-[#e5e3d8] bg-white px-4 py-3 text-sm outline-none focus:border-[#1f644e]"
                      >
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="archived">Archived</option>
                      </select>
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
                        className="mt-2 w-full rounded-xl border border-[#e5e3d8] bg-white px-4 py-3 text-sm outline-none focus:border-[#1f644e]"
                        placeholder="A clean launch checklist for Taskly"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
                        Color
                      </label>
                      <div className="mt-2 flex items-center gap-3">
                        <input
                          type="color"
                          value={form.color}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, color: event.target.value }))
                          }
                          className="h-12 w-16 rounded-xl border border-[#e5e3d8] bg-white px-1 py-1"
                        />
                        <input
                          value={form.color}
                          onChange={(event) =>
                            setForm((current) => ({ ...current, color: event.target.value }))
                          }
                          className="flex-1 rounded-xl border border-[#e5e3d8] bg-white px-4 py-3 text-sm outline-none focus:border-[#1f644e]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
                        Deadline
                      </label>
                      <input
                        type="date"
                        value={form.deadline}
                        onChange={(event) =>
                          setForm((current) => ({ ...current, deadline: event.target.value }))
                        }
                        className="mt-2 w-full rounded-xl border border-[#e5e3d8] bg-white px-4 py-3 text-sm outline-none focus:border-[#1f644e]"
                      />
                    </div>
                    <div className="md:col-span-2 flex justify-end gap-3 mt-4">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="rounded-xl border border-[#e5e3d8] px-4 py-2.5 text-sm font-bold text-[#7c8e88] transition hover:bg-[#f8f9f4]"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded-xl bg-[#1f644e] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#17503e] inline-flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        {editingId ? 'Update Project' : 'Create Project'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {projectStats.map((project) => (
              <div key={project.id} className="rounded-2xl border border-[#e5e3d8] bg-white p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl"
                      style={{ backgroundColor: `${project.color}20`, color: project.color }}
                    >
                      <FolderKanban className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-[#1e3a34]">{project.name}</h3>
                        <span
                          className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
                          style={{ backgroundColor: `${project.color}20`, color: project.color }}
                        >
                          {project.status}
                        </span>
                      </div>
                      {project.description && (
                        <p className="mt-1 text-sm text-[#7c8e88]">{project.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleEdit(project)}
                      className="rounded-xl border border-[#e5e3d8] px-3 py-2 text-xs font-bold text-[#1e3a34] transition hover:bg-[#f8f9f4] inline-flex items-center gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() =>
                        updateProject(project.id, {
                          ...project,
                          deadline: project.deadline || null,
                          status: 'archived',
                        })
                      }
                      className="rounded-xl border border-[#e5e3d8] px-3 py-2 text-xs font-bold text-[#1e3a34] transition hover:bg-[#f8f9f4] inline-flex items-center gap-1.5"
                    >
                      <Archive className="w-3.5 h-3.5" />
                      Archive
                    </button>
                    <button
                      onClick={() => {
                        if (settings.confirmDelete && !window.confirm('Delete this project?'))
                          return;
                        deleteProject(project.id);
                      }}
                      className="rounded-xl border border-[#f4d2d2] px-3 py-2 text-xs font-bold text-[#c94c4c] transition hover:bg-[#fef2f2] inline-flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl bg-[#f8f9f4] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88]">
                      Tasks
                    </p>
                    <p className="mt-1 text-lg font-bold text-[#1e3a34]">{project.totalTasks}</p>
                  </div>
                  <div className="rounded-xl bg-[#f8f9f4] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88]">
                      Completed
                    </p>
                    <p className="mt-1 text-lg font-bold text-[#1e3a34]">
                      {project.completedTasks}
                    </p>
                  </div>
                  <div className="rounded-xl bg-[#f8f9f4] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88]">
                      Overdue
                    </p>
                    <p className="mt-1 text-lg font-bold text-[#1e3a34]">{project.overdueTasks}</p>
                  </div>
                  <div className="rounded-xl bg-[#f8f9f4] p-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88]">
                      Progress
                    </p>
                    <p className="mt-1 text-lg font-bold text-[#1e3a34]">
                      {project.completionRate}%
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-xs text-[#7c8e88]">
                    <span>Completion</span>
                    <span>{project.completionRate}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#f0f5f2]">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${project.completionRate}%`,
                        backgroundColor: project.color,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-3 text-xs text-[#7c8e88]">
                  {project.deadline && (
                    <span>
                      Deadline:{' '}
                      {new Date(project.deadline).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setSelectedProject(project.id);
                      setActiveTab('tasks');
                    }}
                    className="font-bold text-[#1f644e]"
                  >
                    View tasks
                  </button>
                </div>
              </div>
            ))}
          </div>

          {projectStats.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#e5e3d8] bg-white p-12 text-center">
              <p className="text-sm font-bold text-[#1e3a34]">No projects yet</p>
              <p className="mt-1 text-xs text-[#7c8e88]">
                Create your first project to organize related tasks.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
