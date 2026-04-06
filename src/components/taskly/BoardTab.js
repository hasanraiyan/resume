'use client';

import { useMemo } from 'react';
import { useTaskly } from '@/context/TasklyContext';
import { ArrowLeft, ArrowRight, LayoutGrid } from 'lucide-react';

const columns = [
  { id: 'todo', label: 'Todo' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'done', label: 'Done' },
];

function nextStatus(status, direction) {
  const order = ['todo', 'in_progress', 'done'];
  const currentIndex = order.indexOf(status);
  const nextIndex = currentIndex + direction;
  if (nextIndex < 0 || nextIndex >= order.length) return status;
  return order[nextIndex];
}

export default function BoardTab() {
  const { tasks, updateTask } = useTaskly();

  const groupedTasks = useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        tasks: tasks.filter((task) => task.status === column.id),
      })),
    [tasks]
  );

  return (
    <div className="pb-28 pt-6">
      <div className="w-full px-4 lg:px-6">
        <div className="w-full max-w-6xl mx-auto space-y-6">
          <div className="rounded-2xl border border-[#e5e3d8] bg-white p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#1f644e]/10">
                <LayoutGrid className="h-6 w-6 text-[#1f644e]" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#1e3a34]">Personal Board</h2>
                <p className="text-sm text-[#7c8e88]">
                  Move tasks through your workflow without leaving Taskly.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {groupedTasks.map((column) => (
              <div key={column.id} className="rounded-2xl border border-[#e5e3d8] bg-white p-4">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-[#7c8e88]">
                    {column.label}
                  </h3>
                  <span className="rounded-full bg-[#f8f9f4] px-2.5 py-1 text-[10px] font-bold text-[#7c8e88]">
                    {column.tasks.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {column.tasks.length === 0 && (
                    <div className="rounded-xl border border-dashed border-[#e5e3d8] p-4 text-xs text-[#7c8e88]">
                      No tasks in this column.
                    </div>
                  )}

                  {column.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] p-4"
                    >
                      <div className="flex flex-wrap items-center gap-2">
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

                      <h4 className="mt-3 text-sm font-bold text-[#1e3a34]">{task.title}</h4>
                      {task.description && (
                        <p className="mt-1 text-xs text-[#7c8e88]">{task.description}</p>
                      )}

                      <div className="mt-4 flex items-center justify-between gap-2">
                        <button
                          onClick={() =>
                            updateTask(task.id, {
                              ...task,
                              project: task.project?.id || null,
                              status: nextStatus(task.status, -1),
                            })
                          }
                          disabled={task.status === 'todo'}
                          className="rounded-lg border border-[#e5e3d8] px-3 py-2 text-xs font-bold text-[#1e3a34] disabled:opacity-40"
                        >
                          <span className="inline-flex items-center gap-1">
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Back
                          </span>
                        </button>
                        <button
                          onClick={() =>
                            updateTask(task.id, {
                              ...task,
                              project: task.project?.id || null,
                              status: nextStatus(task.status, 1),
                            })
                          }
                          disabled={task.status === 'done'}
                          className="rounded-lg bg-[#1f644e] px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
                        >
                          <span className="inline-flex items-center gap-1">
                            Next
                            <ArrowRight className="w-3.5 h-3.5" />
                          </span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
