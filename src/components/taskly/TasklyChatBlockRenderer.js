'use client';

import {
  CheckCircle2,
  Clock,
  ListTodo,
  FolderKanban,
  CheckSquare,
  BarChart3,
  AlertCircle,
} from 'lucide-react';

function InlineActionButton({ action, onInteract }) {
  if (!action?.label) return null;

  return (
    <button
      type="button"
      onClick={() => onInteract?.(action)}
      className="inline-flex cursor-pointer items-center rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-neutral-700 transition hover:bg-neutral-50"
    >
      {action.label}
    </button>
  );
}

function ActionButton({ action, onInteract }) {
  if (!action?.label) return null;

  return (
    <button
      type="button"
      onClick={() => onInteract?.(action)}
      className="mt-3 inline-flex cursor-pointer items-center rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-neutral-700 transition hover:bg-neutral-50"
    >
      {action.label}
    </button>
  );
}

function TasklyInsightsBlock({ block, onInteract }) {
  const cards = [
    {
      label: 'Total Tasks',
      value: block.data.totalTasks,
      icon: ListTodo,
      tone: 'text-[#1e3a34] bg-[#f0f5f2]',
    },
    {
      label: 'Completed',
      value: block.data.completedTasks,
      icon: CheckCircle2,
      tone: 'text-[#2e8a5b] bg-[#f0fbf4]',
    },
    {
      label: 'Overdue',
      value: block.data.overdueTasks,
      icon: AlertCircle,
      tone: 'text-[#c94c4c] bg-[#fef2f2]',
    },
    {
      label: 'Due Today',
      value: block.data.dueTodayTasks,
      icon: Clock,
      tone: 'text-[#f59e0b] bg-[#fffbeb]',
    },
  ];

  return (
    <div className="rounded-2xl border border-neutral-200/70 bg-[#f8f8f4] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-neutral-500" />
          {block.title}
        </p>
        <div className="hidden sm:block">
          <InlineActionButton action={block.action} onInteract={onInteract} />
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-neutral-200/70 bg-white p-3">
            <div className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${card.tone}`}>
                <card.icon className="h-4 w-4" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                {card.label}
              </span>
            </div>
            <p className="mt-2 text-sm font-bold text-neutral-900">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-2 rounded-2xl border border-neutral-200/70 bg-white p-3 flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            Active Projects
          </span>
          <p className="mt-1 text-sm font-bold text-neutral-900">{block.data.activeProjects}</p>
        </div>
        <div className="flex flex-col text-right">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
            Completion
          </span>
          <p className="mt-1 text-sm font-bold text-neutral-900">{block.data.completionRate}%</p>
        </div>
      </div>

      <div className="sm:hidden">
        <ActionButton action={block.action} onInteract={onInteract} />
      </div>
    </div>
  );
}

function TaskListBlock({ block, onInteract }) {
  const items = block.data?.items || [];

  return (
    <div className="rounded-2xl border border-neutral-200/70 bg-[#f8f8f4] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
          <CheckSquare className="w-4 h-4 text-neutral-500" />
          {block.title}
        </p>
        <div className="hidden sm:block">
          <InlineActionButton action={block.action} onInteract={onInteract} />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-6 text-center">
          <p className="text-sm font-semibold text-neutral-800">No tasks found</p>
          <p className="mt-1 text-[11px] text-neutral-500">
            Try another filter or create a new task.
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {items.map((item) => {
            const isDone = item.status === 'done';

            return (
              <div
                key={item.id}
                className="flex flex-col gap-1.5 rounded-2xl border border-neutral-200/70 bg-white px-3 py-2.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-sm font-semibold ${isDone ? 'text-neutral-400 line-through' : 'text-neutral-900'}`}
                    >
                      {item.title}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      item.priority === 'high'
                        ? 'bg-[#fef2f2] text-[#c94c4c]'
                        : item.priority === 'medium'
                          ? 'bg-[#fffbeb] text-[#f59e0b]'
                          : 'bg-[#f0f5f2] text-[#1f644e]'
                    }`}
                  >
                    {item.priority}
                  </span>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-[11px] text-neutral-500 flex items-center gap-1">
                    <FolderKanban className="w-3 h-3" />
                    {item.project || 'Unassigned'}
                  </p>
                  {item.dueDate && (
                    <p className="text-[11px] text-neutral-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(item.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="sm:hidden">
        <ActionButton action={block.action} onInteract={onInteract} />
      </div>
    </div>
  );
}

function ProjectListBlock({ block, onInteract }) {
  const items = block.data?.items || [];

  return (
    <div className="rounded-2xl border border-neutral-200/70 bg-[#f8f8f4] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-neutral-800 flex items-center gap-1.5">
          <FolderKanban className="w-4 h-4 text-neutral-500" />
          {block.title}
        </p>
        <div className="hidden sm:block">
          <InlineActionButton action={block.action} onInteract={onInteract} />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="mt-3 rounded-2xl border border-dashed border-neutral-200 bg-white px-4 py-6 text-center">
          <p className="text-sm font-semibold text-neutral-800">No projects found</p>
          <p className="mt-1 text-[11px] text-neutral-500">
            Create a new project to organize your tasks.
          </p>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {items.map((item) => {
            return (
              <div
                key={item.id}
                className="flex flex-col gap-1.5 rounded-2xl border border-neutral-200/70 bg-white px-3 py-2.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-semibold text-neutral-900">{item.name}</p>
                  <span
                    className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      item.status === 'completed'
                        ? 'bg-[#f0fbf4] text-[#2e8a5b]'
                        : item.status === 'archived'
                          ? 'bg-[#f3f4f6] text-[#6b7280]'
                          : 'bg-[#f0f5f2] text-[#1f644e]'
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                {item.deadline && (
                  <p className="text-[11px] text-neutral-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Due{' '}
                    {new Date(item.deadline).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="sm:hidden">
        <ActionButton action={block.action} onInteract={onInteract} />
      </div>
    </div>
  );
}

export default function TasklyChatBlockRenderer({ block, onInteract }) {
  if (!block?.kind) return null;

  if (block.kind === 'taskly_insights') {
    return <TasklyInsightsBlock block={block} onInteract={onInteract} />;
  }

  if (block.kind === 'task_list') {
    return <TaskListBlock block={block} onInteract={onInteract} />;
  }

  if (block.kind === 'project_list') {
    return <ProjectListBlock block={block} onInteract={onInteract} />;
  }

  return null;
}
