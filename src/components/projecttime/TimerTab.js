'use client';

import { useState } from 'react';
import { useProjectTime } from './ProjectTimeContext';
import {
  Play,
  Square,
  Plus,
  Clock,
  Tag,
  CheckCircle2,
  Trash2,
  Pencil,
  Calendar,
  X,
  FileSpreadsheet,
} from 'lucide-react';

export default function TimerTab() {
  const {
    projects,
    tasks,
    entries,
    runningTimer,
    elapsedSeconds,
    startTimer,
    stopTimer,
    addManualEntry,
    updateEntry,
    deleteEntry,
  } = useProjectTime();

  // Active Timer Local Inputs
  const [selectedProjectId, setSelectedProjectId] = useState(
    runningTimer ? runningTimer.projectId : projects[0]?._id || ''
  );
  const [selectedTaskId, setSelectedTaskId] = useState(runningTimer ? runningTimer.taskId : '');
  const [timerDescription, setTimerDescription] = useState(
    runningTimer ? runningTimer.description : ''
  );
  const [timerBillable, setTimerBillable] = useState(runningTimer ? runningTimer.billable : true);

  // Modal States
  const [showManualModal, setShowManualModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  // Manual Entry Form State
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualProjectId, setManualProjectId] = useState(projects[0]?._id || '');
  const [manualTaskId, setManualTaskId] = useState('');
  const [manualHours, setManualHours] = useState('1');
  const [manualMinutes, setManualMinutes] = useState('0');
  const [manualDescription, setManualDescription] = useState('');
  const [manualBillable, setManualBillable] = useState(true);

  // Helper format seconds -> HH:MM:SS
  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatHoursMinutes = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  // Available tasks for current project selection
  const availableTasks = tasks.filter(
    (t) => t.projectId === (runningTimer ? runningTimer.projectId : selectedProjectId)
  );

  const handleStartStop = () => {
    if (runningTimer) {
      stopTimer(timerDescription);
    } else {
      if (!selectedProjectId) {
        alert('Please select a project');
        return;
      }
      startTimer({
        projectId: selectedProjectId,
        taskId: selectedTaskId || null,
        description: timerDescription,
        billable: timerBillable,
      });
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    if (!manualProjectId) {
      alert('Please select a project');
      return;
    }

    const durationSeconds =
      parseInt(manualHours || '0', 10) * 3600 + parseInt(manualMinutes || '0', 10) * 60;
    if (durationSeconds <= 0) {
      alert('Duration must be greater than 0');
      return;
    }

    const success = await addManualEntry({
      projectId: manualProjectId,
      taskId: manualTaskId || null,
      date: manualDate,
      duration: durationSeconds,
      description: manualDescription,
      billable: manualBillable,
    });

    if (success) {
      setShowManualModal(false);
      setManualDescription('');
    }
  };

  const handleUpdateEntrySubmit = async (e) => {
    e.preventDefault();
    if (!editingEntry) return;

    const durationSeconds =
      parseInt(editingEntry.hours || '0', 10) * 3600 +
      parseInt(editingEntry.minutes || '0', 10) * 60;

    const success = await updateEntry(editingEntry._id, {
      projectId: editingEntry.projectId,
      taskId: editingEntry.taskId || null,
      date: editingEntry.date,
      duration: durationSeconds,
      description: editingEntry.description,
      billable: editingEntry.billable,
    });

    if (success) {
      setEditingEntry(null);
    }
  };

  // Group entries by Date
  const groupedEntries = entries.reduce((groups, entry) => {
    const d = entry.date || 'Unknown Date';
    if (!groups[d]) groups[d] = [];
    groups[d].push(entry);
    return groups;
  }, {});

  const sortedDates = Object.keys(groupedEntries).sort((a, b) => (a < b ? 1 : -1));

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Real-time Active Timer Bar */}
      <div className="bg-white rounded-2xl border border-[#e5e3d8] p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Description Input */}
            <input
              type="text"
              placeholder="What are you working on?"
              value={timerDescription}
              onChange={(e) => setTimerDescription(e.target.value)}
              disabled={Boolean(runningTimer)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm outline-none focus:border-[#1f644e] disabled:opacity-75 text-[#1e3a34]"
            />

            {/* Project Picker */}
            <select
              value={runningTimer ? runningTimer.projectId : selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              disabled={Boolean(runningTimer)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm outline-none focus:border-[#1f644e] disabled:opacity-75 text-[#1e3a34] font-semibold"
            >
              <option value="">Select Project...</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Task Picker */}
            <select
              value={runningTimer ? runningTimer.taskId || '' : selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              disabled={Boolean(runningTimer)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm outline-none focus:border-[#1f644e] disabled:opacity-75 text-[#1e3a34]"
            >
              <option value="">(Optional) Select Task...</option>
              {availableTasks.map((t) => (
                <option key={t._id} value={t._id}>
                  [{t.type}] {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Clock & Action Controls */}
          <div className="flex items-center justify-between lg:justify-end gap-4 border-t lg:border-t-0 pt-3 lg:pt-0 border-[#e5e3d8]">
            {/* Live Clock Display */}
            <div className="flex items-center gap-2">
              {runningTimer && (
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c94c4c] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#c94c4c]"></span>
                </span>
              )}
              <span className="text-2xl font-bold font-mono tracking-wider text-[#1e3a34]">
                {formatTime(elapsedSeconds)}
              </span>
            </div>

            {/* Start / Stop Button */}
            <button
              onClick={handleStartStop}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white transition-all cursor-pointer shadow-sm ${
                runningTimer ? 'bg-[#c94c4c] hover:bg-red-700' : 'bg-[#1f644e] hover:bg-[#17503e]'
              }`}
            >
              {runningTimer ? (
                <>
                  <Square className="w-5 h-5 fill-current" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="w-5 h-5 fill-current" />
                  Start
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Manual Time Entry Trigger Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-base font-bold text-[#1e3a34]">Time Entries</h2>
          <p className="text-xs text-[#7c8e88] mt-0.5">Tracked work history</p>
        </div>
        <button
          onClick={() => {
            setManualProjectId(projects[0]?._id || '');
            setShowManualModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-[#1f644e]/10 text-[#1f644e] rounded-xl text-xs font-bold hover:bg-[#1f644e]/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Add Manual Entry
        </button>
      </div>

      {/* Entry History grouped by Date */}
      <div className="space-y-6">
        {sortedDates.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-[#e5e3d8] p-6">
            <Clock className="w-10 h-10 text-[#7c8e88] mx-auto mb-3" />
            <h3 className="text-sm font-bold text-[#1e3a34]">No time entries yet</h3>
            <p className="text-xs text-[#7c8e88] mt-1">
              Start the timer or add a manual entry above.
            </p>
          </div>
        ) : (
          sortedDates.map((dateStr) => {
            const dateEntries = groupedEntries[dateStr];
            const groupTotalSecs = dateEntries.reduce((sum, e) => sum + (e.duration || 0), 0);

            return (
              <div key={dateStr} className="space-y-2">
                {/* Date Group Header */}
                <div className="flex items-center justify-between px-2 py-1 text-xs font-bold text-[#7c8e88]">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{dateStr}</span>
                  </div>
                  <span>Total: {formatHoursMinutes(groupTotalSecs)}</span>
                </div>

                {/* Entry Cards */}
                <div className="space-y-2">
                  {dateEntries.map((entry) => {
                    const proj = projects.find((p) => p._id === entry.projectId);
                    const task = tasks.find((t) => t._id === entry.taskId);

                    return (
                      <div
                        key={entry._id}
                        className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white rounded-xl border border-[#e5e3d8] p-4 gap-3 hover:border-[#1f644e]/30 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {proj && (
                              <span
                                className="px-2 py-0.5 rounded-md text-[11px] font-bold text-white"
                                style={{ backgroundColor: proj.color || '#1f644e' }}
                              >
                                {proj.name}
                              </span>
                            )}
                            {task && (
                              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-[#f0f5f2] text-[#1e3a34]">
                                [{task.type}] {task.name}
                              </span>
                            )}
                            {entry.billable && (
                              <span className="text-[10px] font-extrabold text-[#1f644e] uppercase bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
                                Billable
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-[#1e3a34] truncate">
                            {entry.description || 'No description'}
                          </p>
                        </div>

                        <div className="flex items-center justify-between w-full sm:w-auto gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#f0f5f2]">
                          <span className="text-base font-bold font-mono text-[#1e3a34]">
                            {formatHoursMinutes(entry.duration || 0)}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                setEditingEntry({
                                  ...entry,
                                  hours: Math.floor((entry.duration || 0) / 3600).toString(),
                                  minutes: Math.floor(
                                    ((entry.duration || 0) % 3600) / 60
                                  ).toString(),
                                })
                              }
                              className="p-1.5 text-[#7c8e88] hover:text-[#1f644e] hover:bg-[#f0f5f2] rounded-lg transition-colors cursor-pointer"
                              title="Edit Entry"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteEntry(entry._id)}
                              className="p-1.5 text-[#7c8e88] hover:text-[#c94c4c] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              title="Delete Entry"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Manual Entry Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowManualModal(false)}
          />
          <div className="relative bg-white rounded-2xl border border-[#e5e3d8] shadow-2xl max-w-md w-full p-6 z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e3d8]">
              <h3 className="font-bold text-[#1e3a34]">Add Manual Time Entry</h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-[#7c8e88] hover:text-[#1e3a34]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#7c8e88] mb-1">Date</label>
                <input
                  type="date"
                  value={manualDate}
                  onChange={(e) => setManualDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7c8e88] mb-1">Project</label>
                  <select
                    value={manualProjectId}
                    onChange={(e) => setManualProjectId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none"
                    required
                  >
                    <option value="">Select Project...</option>
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#7c8e88] mb-1">Task</label>
                  <select
                    value={manualTaskId}
                    onChange={(e) => setManualTaskId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none"
                  >
                    <option value="">(Optional) Task...</option>
                    {tasks
                      .filter((t) => t.projectId === manualProjectId)
                      .map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7c8e88] mb-1">Hours</label>
                  <input
                    type="number"
                    min="0"
                    value={manualHours}
                    onChange={(e) => setManualHours(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7c8e88] mb-1">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={manualMinutes}
                    onChange={(e) => setManualMinutes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7c8e88] mb-1">Description</label>
                <textarea
                  value={manualDescription}
                  onChange={(e) => setManualDescription(e.target.value)}
                  placeholder="What was done?"
                  className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none resize-none h-20"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="manualBillable"
                  checked={manualBillable}
                  onChange={(e) => setManualBillable(e.target.checked)}
                  className="rounded text-[#1f644e] focus:ring-[#1f644e]"
                />
                <label htmlFor="manualBillable" className="text-xs font-bold text-[#1e3a34]">
                  Billable Entry
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#7c8e88] hover:bg-[#f0f5f2] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#1f644e] text-white rounded-xl hover:bg-[#17503e]"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Entry Modal */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setEditingEntry(null)}
          />
          <div className="relative bg-white rounded-2xl border border-[#e5e3d8] shadow-2xl max-w-md w-full p-6 z-10 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5e3d8]">
              <h3 className="font-bold text-[#1e3a34]">Edit Time Entry</h3>
              <button
                onClick={() => setEditingEntry(null)}
                className="text-[#7c8e88] hover:text-[#1e3a34]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateEntrySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#7c8e88] mb-1">Date</label>
                <input
                  type="date"
                  value={editingEntry.date}
                  onChange={(e) => setEditingEntry({ ...editingEntry, date: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7c8e88] mb-1">Project</label>
                  <select
                    value={editingEntry.projectId}
                    onChange={(e) =>
                      setEditingEntry({ ...editingEntry, projectId: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none"
                    required
                  >
                    {projects.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#7c8e88] mb-1">Task</label>
                  <select
                    value={editingEntry.taskId || ''}
                    onChange={(e) => setEditingEntry({ ...editingEntry, taskId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none"
                  >
                    <option value="">(Optional) Task...</option>
                    {tasks
                      .filter((t) => t.projectId === editingEntry.projectId)
                      .map((t) => (
                        <option key={t._id} value={t._id}>
                          {t.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7c8e88] mb-1">Hours</label>
                  <input
                    type="number"
                    min="0"
                    value={editingEntry.hours}
                    onChange={(e) => setEditingEntry({ ...editingEntry, hours: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7c8e88] mb-1">Minutes</label>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={editingEntry.minutes}
                    onChange={(e) => setEditingEntry({ ...editingEntry, minutes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7c8e88] mb-1">Description</label>
                <textarea
                  value={editingEntry.description}
                  onChange={(e) =>
                    setEditingEntry({ ...editingEntry, description: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] text-sm text-[#1e3a34] outline-none resize-none h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEntry(null)}
                  className="px-4 py-2 text-xs font-bold text-[#7c8e88] hover:bg-[#f0f5f2] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-[#1f644e] text-white rounded-xl hover:bg-[#17503e]"
                >
                  Update Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
