'use client';

import { AlertTriangle, Calendar, CheckCircle2, Layers } from 'lucide-react';

export default function AnalyticsTab({ boardId, boards, columns, cards }) {
  const board = boards.find((b) => b._id === boardId);
  if (!board) return null;

  const totalCards = cards.length;
  const cardsByColumn = columns.map((col) => ({
    ...col,
    count: cards.filter(
      (c) => c.columnId === col._id || c.columnId?.toString() === col._id?.toString()
    ).length,
  }));

  const priorityCounts = { low: 0, medium: 0, high: 0, urgent: 0 };
  cards.forEach((c) => {
    priorityCounts[c.priority] = (priorityCounts[c.priority] || 0) + 1;
  });

  const overdueCards = cards.filter((c) => c.dueDate && new Date(c.dueDate) < new Date());

  const dueTodayCards = cards.filter((c) => {
    if (!c.dueDate) return false;
    const today = new Date();
    const due = new Date(c.dueDate);
    return due.toDateString() === today.toDateString();
  });

  const cardsWithChecklist = cards.filter((c) => c.checklist?.length > 0);
  const completedChecklistItems = cards.reduce(
    (sum, c) => sum + (c.checklist?.filter((i) => i.done).length || 0),
    0
  );
  const totalChecklistItems = cards.reduce((sum, c) => sum + (c.checklist?.length || 0), 0);

  const stats = [
    {
      label: 'Total Cards',
      value: totalCards,
      icon: Layers,
      color: '#1f644e',
    },
    {
      label: 'Overdue',
      value: overdueCards.length,
      icon: AlertTriangle,
      color: '#c94c4c',
    },
    {
      label: 'Due Today',
      value: dueTodayCards.length,
      icon: Calendar,
      color: '#c97b3a',
    },
    {
      label: 'Checklist Progress',
      value:
        totalChecklistItems > 0
          ? `${Math.round((completedChecklistItems / totalChecklistItems) * 100)}%`
          : '—',
      icon: CheckCircle2,
      color: '#4a6fa5',
    },
  ];

  const priorityColors = {
    low: { bg: '#f0f5f2', bar: '#5a7a3a' },
    medium: { bg: '#fff8e1', bar: '#b8860b' },
    high: { bg: '#fff0e0', bar: '#c97b3a' },
    urgent: { bg: '#fce8e8', bar: '#c94c4c' },
  };

  const maxPriority = Math.max(...Object.values(priorityCounts), 1);
  const maxColumnCount = Math.max(...cardsByColumn.map((c) => c.count), 1);

  return (
    <div className="p-4 lg:p-6 space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-lg font-bold text-[#1e3a34]">Analytics</h2>
        <p className="text-sm text-[#7c8e88] mt-1">{board.name}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl border border-[#e5e3d8] p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${stat.color}10` }}>
                <stat.icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1e3a34]">{stat.value}</p>
                <p className="text-xs text-[#7c8e88] font-semibold">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-[#e5e3d8] p-5">
          <h3 className="text-sm font-bold text-[#1e3a34] mb-4">Cards by Column</h3>
          <div className="space-y-3">
            {cardsByColumn.map((col) => (
              <div key={col._id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#1e3a34]">{col.title}</span>
                  <span className="text-xs font-bold text-[#7c8e88]">{col.count}</span>
                </div>
                <div className="w-full h-2 bg-[#f0f5f2] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(col.count / maxColumnCount) * 100}%`,
                      backgroundColor: '#1f644e',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#e5e3d8] p-5">
          <h3 className="text-sm font-bold text-[#1e3a34] mb-4">Cards by Priority</h3>
          <div className="space-y-3">
            {Object.entries(priorityCounts).map(([key, count]) => {
              const p = priorityColors[key];
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-[#1e3a34] capitalize">{key}</span>
                    <span className="text-xs font-bold text-[#7c8e88]">{count}</span>
                  </div>
                  <div className="w-full h-2 bg-[#f0f5f2] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(count / maxPriority) * 100}%`,
                        backgroundColor: p.bar,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {overdueCards.length > 0 && (
        <div className="bg-white rounded-xl border border-[#e5e3d8] p-5">
          <h3 className="text-sm font-bold text-[#1e3a34] mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#c94c4c]" />
            Overdue Cards
          </h3>
          <div className="space-y-2">
            {overdueCards.map((card) => (
              <div
                key={card._id}
                className="flex items-center justify-between py-2 border-b border-[#f0f5f2] last:border-0"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-bold text-[#1e3a34] truncate">{card.title}</span>
                  {card.labels?.slice(0, 2).map((label, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#fce8e8] text-[#c94c4c]"
                    >
                      {label}
                    </span>
                  ))}
                </div>
                <span className="text-xs font-bold text-[#c94c4c] flex-shrink-0 ml-2">
                  Due {new Date(card.dueDate).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
