'use client';

import { useState } from 'react';
import { useProjectTime } from './ProjectTimeContext';
import {
  FolderKanban,
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  User,
  Calendar,
} from 'lucide-react';

export default function ProjectsTab() {
  const {
    projects,
    tasks,
    entries,
    createProject,
    updateProject,
    deleteProject,
    createTask,
    updateTask,
    deleteTask,
  } = useProjectTime();

  const [expandedProjectId, setExpandedProjectId] = useState(projects[0]?._id || null);

  // Modals
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedProjectIdForTask, setSelectedProjectIdForTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);

  // Project Form State
  const [projectName, setProjectName] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [projectEstimate, setProjectEstimate] = useState('40');
  const [projectColor, setProjectColor] = useState('#1f644e');

  // Task Form State
  const [taskName, setTaskName] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskType, setTaskType] = useState('Task');
  const [taskPriority, setTaskPriority] = useState('Medium');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskEstimate, setTaskEstimate] = useState('5');
  const [taskStatus, setTaskStatus] = useState('Todo');

  const handleCreateProjectSubmit = async (e) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    const success = await createProject({
      name: projectName.trim(),
      description: projectDesc,
      estimatedHours: parseFloat(projectEstimate || '0'),
      color: projectColor,
    });

    if (success) {
      setShowProjectModal(false);
      setProjectName('');
      setProjectDesc('');
    }
  };

  const handleUpdateProjectSubmit = async (e) => {
    e.preventDefault();
    if (!editingProject) return;

    const success = await updateProject(editingProject._id, {
      name: editingProject.name,
      description: editingProject.description,
      estimatedHours: parseFloat(editingProject.estimatedHours || '0'),
      color: editingProject.color,
      status: editingProject.status,
    });

    if (success) {
      setEditingProject(null);
    }
  };

  const handleCreateTaskSubmit = async (e) => {
    e.preventDefault();
    if (!taskName.trim() || !selectedProjectIdForTask) return;

    const success = await createTask({
      projectId: selectedProjectIdForTask,
      name: taskName.trim(),
      description: taskDesc,
      type: taskType,
      priority: taskPriority,
      assigneeEmail: taskAssignee,
      estimatedHours: parseFloat(taskEstimate || '0'),
      status: taskStatus,
    });

    if (success) {
      setShowTaskModal(false);
      setTaskName('');
      setTaskDesc('');
    }
  };

  const handleUpdateTaskSubmit = async (e) => {
    e.preventDefault();
    if (!editingTask) return;

    const success = await updateTask(editingTask._id, {
      name: editingTask.name,
      description: editingTask.description,
      type: editingTask.type,
      priority: editingTask.priority,
      assigneeEmail: editingTask.assigneeEmail,
      estimatedHours: parseFloat(editingTask.estimatedHours || '0'),
      status: editingTask.status,
    });

    if (success) {
      setEditingTask(null);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#1e3a34]">Projects & Tasks</h2>
          <p className="text-xs text-[#7c8e88] mt-0.5">Manage work hierarchy and estimates</p>
        </div>
        <button
          onClick={() => setShowProjectModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1f644e] text-white rounded-xl text-xs font-bold hover:bg-[#17503e] transition-all cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Create Project
        </button>
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {projects.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#e5e3d8] p-6">
            <FolderKanban className="w-10 h-10 text-[#7c8e88] mx-auto mb-3" />
            <h3 className="text-sm font-bold text-[#1e3a34]">No projects found</h3>
            <p className="text-xs text-[#7c8e88] mt-1">Create your first project to get started.</p>
          </div>
        ) : (
          projects.map((project) => {
            const isExpanded = expandedProjectId === project._id;
            const projectTasks = tasks.filter((t) => t.projectId === project._id);
            const projectEntries = entries.filter((e) => e.projectId === project._id);
            const trackedSecs = projectEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
            const trackedHours = trackedSecs / 3600;
            const estHours = project.estimatedHours || 0;

            return (
              <div
                key={project._id}
                className="bg-white rounded-2xl border border-[#e5e3d8] shadow-sm overflow-hidden transition-all"
              >
                {/* Project Header Bar */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white">
                  <div
                    onClick={() => setExpandedProjectId(isExpanded ? null : project._id)}
                    className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                  >
                    <button className="text-[#7c8e88]">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </button>
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: project.color || '#1f644e' }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-[#1e3a34] text-base truncate">
                          {project.name}
                        </h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f0f5f2] text-[#1e3a34]">
                          {project.status}
                        </span>
                      </div>
                      <p className="text-xs text-[#7c8e88] truncate mt-0.5">
                        {project.description || 'No description provided'}
                      </p>
                    </div>
                  </div>

                  {/* Hours & Actions */}
                  <div className="flex items-center justify-between w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#f0f5f2]">
                    <div className="text-right">
                      <span className="text-xs font-bold text-[#1e3a34] font-mono">
                        {trackedHours.toFixed(1)}h / {estHours}h
                      </span>
                      <p className="text-[10px] text-[#7c8e88]">Tracked vs Est.</p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedProjectIdForTask(project._id);
                          setShowTaskModal(true);
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-[#1f644e]/10 text-[#1f644e] rounded-xl text-xs font-bold hover:bg-[#1f644e]/20 transition-all cursor-pointer"
                        title="Add Task / Issue"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Task
                      </button>
                      <button
                        onClick={() => setEditingProject(project)}
                        className="p-1.5 text-[#7c8e88] hover:text-[#1f644e] hover:bg-[#f0f5f2] rounded-lg transition-colors cursor-pointer"
                        title="Edit Project"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteProject(project._id)}
                        className="p-1.5 text-[#7c8e88] hover:text-[#c94c4c] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        title="Delete Project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Tasks Section */}
                {isExpanded && (
                  <div className="border-t border-[#e5e3d8] bg-[#fcfbf5] p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <h4 className="text-xs font-bold text-[#7c8e88] uppercase tracking-wider">
                        Tasks & Issues ({projectTasks.length})
                      </h4>
                    </div>

                    {projectTasks.length === 0 ? (
                      <p className="text-xs text-[#7c8e88] italic py-2">
                        No tasks created for this project yet. Click &quot;Add Task&quot; above.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {projectTasks.map((task) => (
                          <div
                            key={task._id}
                            className="bg-white rounded-xl border border-[#e5e3d8] p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                    task.type === 'Issue'
                                      ? 'bg-red-100 text-red-700'
                                      : 'bg-blue-100 text-blue-700'
                                  }`}
                                >
                                  {task.type}
                                </span>
                                <span className="font-bold text-sm text-[#1e3a34]">
                                  {task.name}
                                </span>
                              </div>
                              <p className="text-xs text-[#7c8e88] truncate">
                                {task.description || 'No details'}
                              </p>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-[#f0f5f2]">
                              <select
                                value={task.status}
                                onChange={(e) => updateTask(task._id, { status: e.target.value })}
                                className="px-2 py-1 rounded-lg border border-[#e5e3d8] text-xs font-bold bg-[#fcfbf5] text-[#1e3a34] outline-none"
                              >
                                <option value="Todo">Todo</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Done">Done</option>
                              </select>

                              <span className="text-xs font-mono font-bold text-[#7c8e88]">
                                {task.estimatedHours ? `${task.estimatedHours}h est` : ''}
                              </span>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setEditingTask(task)}
                                  className="p-1 text-[#7c8e88] hover:text-[#1f644e] rounded"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => deleteTask(task._id)}
                                  className="p-1 text-[#7c8e88] hover:text-[#c94c4c] rounded"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowProjectModal(false)}
          />
          <div className="relative bg-white rounded-2xl border border-[#e5e3d8] shadow-2xl max-w-md w-full p-6 z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e3d8]">
              <h3 className="font-bold text-[#1e3a34]">Create New Project</h3>
              <button
                onClick={() => setShowProjectModal(false)}
                className="text-[#7c8e88] hover:text-[#1e3a34]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProjectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#7c8e88] mb-1">Project Name</label>
                <input
                  type="text"
                  placeholder="e.g. Coursify API"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7c8e88] mb-1">Description</label>
                <textarea
                  placeholder="Brief summary..."
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none resize-none h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7c8e88] mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={projectEstimate}
                    onChange={(e) => setProjectEstimate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7c8e88] mb-1">Theme Color</label>
                  <input
                    type="color"
                    value={projectColor}
                    onChange={(e) => setProjectColor(e.target.value)}
                    className="w-full h-9 p-1 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] cursor-pointer"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProjectModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#7c8e88] hover:bg-[#f0f5f2] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#1f644e] text-white rounded-xl hover:bg-[#17503e]"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowTaskModal(false)}
          />
          <div className="relative bg-white rounded-2xl border border-[#e5e3d8] shadow-2xl max-w-md w-full p-6 z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e3d8]">
              <h3 className="font-bold text-[#1e3a34]">Add Task or Issue</h3>
              <button
                onClick={() => setShowTaskModal(false)}
                className="text-[#7c8e88] hover:text-[#1e3a34]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#7c8e88] mb-1">Title</label>
                <input
                  type="text"
                  placeholder="e.g. Implement OAuth Flow"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7c8e88] mb-1">Type</label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none font-bold"
                  >
                    <option value="Task">Task</option>
                    <option value="Issue">Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#7c8e88] mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7c8e88] mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={taskEstimate}
                    onChange={(e) => setTaskEstimate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7c8e88] mb-1">Status</label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none"
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7c8e88] mb-1">Description</label>
                <textarea
                  placeholder="Task details..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none resize-none h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#7c8e88] hover:bg-[#f0f5f2] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#1f644e] text-white rounded-xl hover:bg-[#17503e]"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setEditingProject(null)}
          />
          <div className="relative bg-white rounded-2xl border border-[#e5e3d8] shadow-2xl max-w-md w-full p-6 z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e3d8]">
              <h3 className="font-bold text-[#1e3a34]">Edit Project</h3>
              <button
                onClick={() => setEditingProject(null)}
                className="text-[#7c8e88] hover:text-[#1e3a34]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProjectSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#7c8e88] mb-1">Project Name</label>
                <input
                  type="text"
                  value={editingProject.name}
                  onChange={(e) => setEditingProject({ ...editingProject, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7c8e88] mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingProject.estimatedHours}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, estimatedHours: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7c8e88] mb-1">Status</label>
                  <select
                    value={editingProject.status}
                    onChange={(e) =>
                      setEditingProject({ ...editingProject, status: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none"
                  >
                    <option value="Active">Active</option>
                    <option value="Archived">Archived</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7c8e88] mb-1">Description</label>
                <textarea
                  value={editingProject.description}
                  onChange={(e) =>
                    setEditingProject({ ...editingProject, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none resize-none h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProject(null)}
                  className="px-4 py-2 text-xs font-bold text-[#7c8e88] hover:bg-[#f0f5f2] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#1f644e] text-white rounded-xl hover:bg-[#17503e]"
                >
                  Update Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Task Modal */}
      {editingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setEditingTask(null)}
          />
          <div className="relative bg-white rounded-2xl border border-[#e5e3d8] shadow-2xl max-w-md w-full p-6 z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e3d8]">
              <h3 className="font-bold text-[#1e3a34]">Edit Task</h3>
              <button
                onClick={() => setEditingTask(null)}
                className="text-[#7c8e88] hover:text-[#1e3a34]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateTaskSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#7c8e88] mb-1">Title</label>
                <input
                  type="text"
                  value={editingTask.name}
                  onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7c8e88] mb-1">Status</label>
                  <select
                    value={editingTask.status}
                    onChange={(e) => setEditingTask({ ...editingTask, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none"
                  >
                    <option value="Todo">Todo</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Done">Done</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#7c8e88] mb-1">
                    Estimated Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editingTask.estimatedHours}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, estimatedHours: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7c8e88] mb-1">Description</label>
                <textarea
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none resize-none h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 text-xs font-bold text-[#7c8e88] hover:bg-[#f0f5f2] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#1f644e] text-white rounded-xl hover:bg-[#17503e]"
                >
                  Update Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
