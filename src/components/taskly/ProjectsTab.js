'use client';

import { useMemo, useState } from 'react';
import { useTaskly } from '@/context/TasklyContext';
import { isTaskOverdue } from '@/lib/taskly';
import {
  Archive,
  FolderKanban,
  Pencil,
  Plus,
  Trash2,
  MoreVertical,
  ArrowRight,
  CheckCircle2,
  Clock,
  ListTodo,
} from 'lucide-react';

const emptyProjectForm = {
  name: '',
  description: '',
  color: '#1f644e',
  status: 'active',
  deadline: '',
};

export default function ProjectsTab() {
  const [openMenuId, setOpenMenuId] = useState(null);

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
                  <div className="flex items-center gap-4">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-xl shrink-0"
                      style={{ backgroundColor: `${project.color}15`, color: project.color }}
                    >
                      <FolderKanban className="h-7 w-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-[#1e3a34] leading-tight">
                          {project.name}
                        </h3>
                        <span
                          className="rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider"
                          style={{ backgroundColor: `${project.color}15`, color: project.color }}
                        >
                          {project.status}
                        </span>
                      </div>
                      {project.description && (
                        <p className="mt-1.5 text-sm text-[#7c8e88] line-clamp-2">
                          {project.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setOpenMenuId(openMenuId === project.id ? null : project.id)}
                      className="p-2 rounded-xl text-[#7c8e88] hover:bg-[#f0f5f2] hover:text-[#1e3a34] transition-colors"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>

                    {openMenuId === project.id && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-[#e5e3d8] shadow-lg overflow-hidden z-20 py-1">
                          <button
                            onClick={() => {
                              handleEdit(project);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm font-medium text-[#1e3a34] hover:bg-[#f8f9f4] flex items-center gap-2"
                          >
                            <Pencil className="w-4 h-4" />
                            Edit Project
                          </button>
                          <button
                            onClick={() => {
                              updateProject(project.id, {
                                ...project,
                                deadline: project.deadline || null,
                                status: 'archived',
                              });
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm font-medium text-[#1e3a34] hover:bg-[#f8f9f4] flex items-center gap-2"
                          >
                            <Archive className="w-4 h-4" />
                            Archive
                          </button>
                          <div className="h-px bg-[#e5e3d8] my-1" />
                          <button
                            onClick={() => {
                              if (settings.confirmDelete && !window.confirm('Delete this project?'))
                                return;
                              deleteProject(project.id);
                              setOpenMenuId(null);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm font-medium text-[#c94c4c] hover:bg-[#fef2f2] flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete Project
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] p-3 flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 text-[#7c8e88]">
                      <ListTodo className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Tasks</span>
                    </div>
                    <p className="mt-2 text-xl font-bold text-[#1e3a34]">{project.totalTasks}</p>
                  </div>

                  <div className="rounded-xl border border-[#e5e3d8] bg-[#f0fbf4] p-3 flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 text-[#2e8a5b]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Completed
                      </span>
                    </div>
                    <p className="mt-2 text-xl font-bold text-[#2e8a5b]">
                      {project.completedTasks}
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#e5e3d8] bg-[#fef2f2] p-3 flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 text-[#c94c4c]">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Overdue
                      </span>
                    </div>
                    <p className="mt-2 text-xl font-bold text-[#c94c4c]">{project.overdueTasks}</p>
                  </div>

                  <div className="rounded-xl border border-[#e5e3d8] bg-[#f0f7fb] p-3 flex flex-col justify-between">
                    <div className="flex items-center gap-1.5 text-[#2e748a]">
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        Progress
                      </span>
                    </div>
                    <p className="mt-2 text-xl font-bold text-[#2e748a]">
                      {project.completionRate}%
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="h-2.5 overflow-hidden rounded-full bg-[#f0f5f2] w-full relative">
                    <div
                      className="absolute top-0 left-0 h-full rounded-full transition-all duration-500 ease-out"
                      style={{
                        width: `${project.completionRate}%`,
                        backgroundColor: project.color,
                      }}
                    />
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#e5e3d8]">
                  <div className="text-sm text-[#7c8e88] flex items-center gap-2">
                    {project.deadline ? (
                      <>
                        <Clock className="w-4 h-4" />
                        <span>
                          Due{' '}
                          {new Date(project.deadline).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </>
                    ) : (
                      <span>No deadline set</span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setSelectedProject(project.id);
                      setActiveTab('tasks');
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#1f644e] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#17503e] w-full sm:w-auto"
                  >
                    View Tasks
                    <ArrowRight className="w-4 h-4" />
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
