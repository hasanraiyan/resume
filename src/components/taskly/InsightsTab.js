'use client';

import { useEffect } from 'react';
import { useTaskly } from '@/context/TasklyContext';
import { BarChart3, CheckCircle2, Clock3, FolderKanban, Loader2 } from 'lucide-react';

function MetricCard({ label, value, icon: Icon, tone = 'green' }) {
  const tones = {
    green: 'bg-[#1f644e]/10 text-[#1f644e]',
    blue: 'bg-[#4a86e8]/10 text-[#4a86e8]',
    amber: 'bg-[#f59e0b]/10 text-[#b7791f]',
    red: 'bg-[#c94c4c]/10 text-[#c94c4c]',
  };

  return (
    <div className="rounded-xl border border-[#e5e3d8] bg-white p-5">
      <div className="flex items-center gap-3">
        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">{label}</p>
          <p className="mt-1 text-xl font-bold text-[#1e3a34]">{value}</p>
        </div>
      </div>
    </div>
  );
}

export default function InsightsTab() {
  const { insights, fetchInsights, isTabLoading } = useTaskly();

  useEffect(() => {
    if (!insights) {
      fetchInsights();
    }
  }, [insights, fetchInsights]);

  if (!insights || isTabLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="flex items-center gap-2 text-sm text-[#7c8e88]">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading Taskly insights...
        </div>
      </div>
    );
  }

  const maxPriority = Math.max(...insights.byPriority.map((item) => item.count), 1);
  const maxProject = Math.max(...insights.byProject.map((item) => item.total), 1);

  return (
    <div className="pb-28 pt-6">
      <div className="w-full px-4 lg:px-6">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Total Tasks" value={insights.stats.totalTasks} icon={BarChart3} />
            <MetricCard
              label="Completion Rate"
              value={`${insights.stats.completionRate}%`}
              icon={CheckCircle2}
            />
            <MetricCard
              label="Overdue"
              value={insights.stats.overdueTasks}
              icon={Clock3}
              tone="red"
            />
            <MetricCard
              label="Projects"
              value={insights.stats.projectCount}
              icon={FolderKanban}
              tone="blue"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-[#e5e3d8] bg-white p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#7c8e88]">
                Tasks by Priority
              </h3>
              <div className="mt-5 space-y-4">
                {insights.byPriority.map((item) => (
                  <div key={item.priority}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="font-bold capitalize text-[#1e3a34]">{item.priority}</span>
                      <span className="text-[#7c8e88]">{item.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[#f0f5f2]">
                      <div
                        className="h-full rounded-full bg-[#1f644e]"
                        style={{ width: `${(item.count / maxPriority) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#e5e3d8] bg-white p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[#7c8e88]">
                Task Status Mix
              </h3>
              <div className="mt-5 grid grid-cols-3 gap-3">
                {insights.byStatus.map((item) => (
                  <div key={item.status} className="rounded-xl bg-[#f8f9f4] p-4 text-center">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88]">
                      {item.status.replace('_', ' ')}
                    </p>
                    <p className="mt-2 text-2xl font-bold text-[#1e3a34]">{item.count}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#e5e3d8] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88]">
                    Upcoming
                  </p>
                  <p className="mt-2 text-xl font-bold text-[#1e3a34]">{insights.upcomingTasks}</p>
                </div>
                <div className="rounded-xl border border-[#e5e3d8] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#7c8e88]">
                    Unassigned
                  </p>
                  <p className="mt-2 text-xl font-bold text-[#1e3a34]">
                    {insights.unassignedTasks}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e5e3d8] bg-white p-5">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#7c8e88]">
              Tasks by Project
            </h3>
            <div className="mt-5 space-y-4">
              {insights.byProject.length === 0 && (
                <p className="text-sm text-[#7c8e88]">
                  Create a project to unlock project-level reporting.
                </p>
              )}
              {insights.byProject.map((item) => (
                <div key={item.projectId}>
                  <div className="mb-1.5 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color || '#1f644e' }}
                      />
                      <span className="font-bold text-[#1e3a34]">{item.name}</span>
                    </div>
                    <div className="text-xs text-[#7c8e88]">
                      {item.completed}/{item.total} done, {item.overdue} overdue
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#f0f5f2]">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(item.total / maxProject) * 100}%`,
                        backgroundColor: item.color || '#1f644e',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
