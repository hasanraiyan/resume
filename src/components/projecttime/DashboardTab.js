'use client';

import { useProjectTime } from './ProjectTimeContext';
import {
  Clock,
  TrendingUp,
  AlertTriangle,
  FolderKanban,
  CheckCircle2,
  DollarSign,
  PieChart,
} from 'lucide-react';

export default function DashboardTab() {
  const { activeWorkspace, projects, tasks, entries } = useProjectTime();

  const alertThreshold = activeWorkspace?.settings?.alertThresholdPercent || 80;

  // Calculate Today's Tracked Time
  const todayStr = new Date().toISOString().split('T')[0];
  const todayEntries = entries.filter((e) => e.date === todayStr);
  const todaySeconds = todayEntries.reduce((sum, e) => sum + (e.duration || 0), 0);

  // Calculate Weekly Tracked Time (last 7 days)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString().split('T')[0];
  const weeklyEntries = entries.filter((e) => e.date >= sevenDaysAgo);
  const weeklySeconds = weeklyEntries.reduce((sum, e) => sum + (e.duration || 0), 0);

  // Overall Billable ratio
  const totalSeconds = entries.reduce((sum, e) => sum + (e.duration || 0), 0);
  const billableSeconds = entries
    .filter((e) => e.billable)
    .reduce((sum, e) => sum + (e.duration || 0), 0);
  const billablePercent =
    totalSeconds > 0 ? Math.round((billableSeconds / totalSeconds) * 100) : 100;

  // Project Summaries (Actual vs Estimated)
  const projectSummaries = projects.map((project) => {
    const projectEntries = entries.filter((e) => e.projectId === project._id);
    const trackedSecs = projectEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const trackedHours = trackedSecs / 3600;
    const estHours = project.estimatedHours || 0;
    const remainingHours = estHours - trackedHours;
    const percentUsed = estHours > 0 ? Math.round((trackedHours / estHours) * 100) : 0;
    const isWarning = estHours > 0 && percentUsed >= alertThreshold;
    const isOverrun = estHours > 0 && percentUsed > 100;

    return {
      project,
      trackedHours,
      estHours,
      remainingHours,
      percentUsed,
      isWarning,
      isOverrun,
    };
  });

  const warningProjects = projectSummaries.filter((p) => p.isWarning);

  const formatSecsToHM = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      {/* Alert Banners for Over-budget or Threshold warning projects */}
      {warningProjects.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <span>Project Estimate Warnings ({warningProjects.length})</span>
          </div>
          <div className="space-y-1 text-xs text-amber-900">
            {warningProjects.map((item) => (
              <p key={item.project._id}>
                • <strong className="font-bold">{item.project.name}</strong> has reached{' '}
                <strong className="font-bold">{item.percentUsed}%</strong> of estimated hours (
                {item.trackedHours.toFixed(1)}h / {item.estHours}h).
                {item.isOverrun ? ' (EXCEEDED ESTIMATE)' : ''}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Top Metric Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-[#e5e3d8] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#1f644e]/10 rounded-xl">
              <Clock className="w-5 h-5 text-[#1f644e]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">Today</span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#1e3a34]">
            {formatSecsToHM(todaySeconds)}
          </p>
        </div>

        <div className="bg-white border border-[#e5e3d8] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#1f644e]/10 rounded-xl">
              <TrendingUp className="w-5 h-5 text-[#1f644e]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
              Last 7 Days
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#1e3a34]">
            {formatSecsToHM(weeklySeconds)}
          </p>
        </div>

        <div className="bg-white border border-[#e5e3d8] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#1f644e]/10 rounded-xl">
              <FolderKanban className="w-5 h-5 text-[#1f644e]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
              Projects
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#1e3a34]">{projects.length}</p>
        </div>

        <div className="bg-white border border-[#e5e3d8] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#1f644e]/10 rounded-xl">
              <DollarSign className="w-5 h-5 text-[#1f644e]" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
              Billable
            </span>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-[#1e3a34]">{billablePercent}%</p>
        </div>
      </div>

      {/* Estimated vs Actual Time Comparison Section */}
      <div className="bg-white rounded-2xl border border-[#e5e3d8] p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#1e3a34]">Estimated vs. Actual Time</h2>
            <p className="text-xs text-[#7c8e88] mt-0.5">Project time consumption</p>
          </div>
          <span className="text-xs font-bold text-[#7c8e88]">Threshold: {alertThreshold}%</span>
        </div>

        <div className="space-y-4">
          {projectSummaries.length === 0 ? (
            <p className="text-xs text-[#7c8e88]">No projects created yet.</p>
          ) : (
            projectSummaries.map(
              ({
                project,
                trackedHours,
                estHours,
                remainingHours,
                percentUsed,
                isWarning,
                isOverrun,
              }) => (
                <div
                  key={project._id}
                  className="space-y-1.5 p-3 rounded-xl border border-[#f0f5f2]"
                >
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-[#1e3a34] flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block"
                        style={{ backgroundColor: project.color || '#1f644e' }}
                      />
                      {project.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[#7c8e88]">
                        {trackedHours.toFixed(1)}h / {estHours > 0 ? `${estHours}h` : 'No est.'}
                      </span>
                      {estHours > 0 && (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isOverrun
                              ? 'bg-red-100 text-red-700'
                              : isWarning
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {remainingHours >= 0
                            ? `${remainingHours.toFixed(1)}h remaining`
                            : `${Math.abs(remainingHours).toFixed(1)}h over`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {estHours > 0 && (
                    <div className="w-full h-2 bg-[#e5e3d8] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isOverrun ? 'bg-[#c94c4c]' : isWarning ? 'bg-amber-500' : 'bg-[#1f644e]'
                        }`}
                        style={{ width: `${Math.min(percentUsed, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              )
            )
          )}
        </div>
      </div>

      {/* Task Time Summary Table */}
      <div className="bg-white rounded-2xl border border-[#e5e3d8] p-5 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-[#1e3a34]">Task Time Summary</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#e5e3d8] text-xs font-bold text-[#7c8e88]">
                <th className="py-2.5 px-3">Task Name</th>
                <th className="py-2.5 px-3">Project</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Estimate</th>
                <th className="py-2.5 px-3 text-right">Actual Tracked</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f0f5f2] text-xs font-medium text-[#1e3a34]">
              {tasks.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-4 text-center text-[#7c8e88]">
                    No tasks created.
                  </td>
                </tr>
              ) : (
                tasks.map((task) => {
                  const proj = projects.find((p) => p._id === task.projectId);
                  const taskEntries = entries.filter((e) => e.taskId === task._id);
                  const trackedSecs = taskEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
                  const trackedHours = trackedSecs / 3600;

                  return (
                    <tr key={task._id} className="hover:bg-[#fcfbf5]">
                      <td className="py-2.5 px-3 font-bold">
                        [{task.type}] {task.name}
                      </td>
                      <td className="py-2.5 px-3">{proj?.name || '—'}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#f0f5f2]">
                          {task.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono">
                        {task.estimatedHours ? `${task.estimatedHours}h` : '—'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold font-mono text-[#1f644e]">
                        {formatSecsToHM(trackedSecs)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
