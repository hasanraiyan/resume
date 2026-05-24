'use client';

import { Trash2, Calendar, AlertTriangle } from 'lucide-react';

const priorityColors = {
  low: { bg: '#f0f5f2', text: '#5a7a3a', label: 'Low' },
  medium: { bg: '#fff8e1', text: '#b8860b', label: 'Medium' },
  high: { bg: '#fff0e0', text: '#c97b3a', label: 'High' },
  urgent: { bg: '#fce8e8', text: '#c94c4c', label: 'Urgent' },
};

const labelColors = [
  { bg: '#e8f5e9', text: '#2e7d32' },
  { bg: '#e3f2fd', text: '#1565c0' },
  { bg: '#fff3e0', text: '#e65100' },
  { bg: '#f3e5f5', text: '#7b1fa2' },
  { bg: '#fce4ec', text: '#c62828' },
  { bg: '#e0f7fa', text: '#00695c' },
  { bg: '#fff8e1', text: '#f9a825' },
  { bg: '#f5f5f5', text: '#424242' },
];

export default function KanbanCard({ card, onDelete, compact }) {
  const priority = priorityColors[card.priority] || priorityColors.medium;
  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date();
  const checklistDone = card.checklist?.filter((i) => i.done).length || 0;
  const checklistTotal = card.checklist?.length || 0;

  if (compact) {
    return (
      <div className="bg-white rounded-lg border border-[#e5e3d8] px-3 py-2 hover:border-[#1f644e]/30 hover:shadow-sm transition-all duration-200 group cursor-pointer">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: priorityColors[card.priority]?.text || '#7c8e88' }}
          />
          <span className="text-xs font-bold text-[#1e3a34] truncate flex-1">{card.title}</span>
          {card.number && (
            <span className="text-[10px] font-bold text-[#a0b2ac] flex-shrink-0">
              {card.number}
            </span>
          )}
          {isOverdue && <AlertTriangle className="w-3 h-3 text-[#c94c4c] flex-shrink-0" />}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Delete this card?')) onDelete(card._id);
            }}
            className="p-0.5 text-[#7c8e88] hover:text-[#c94c4c] hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex-shrink-0"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-[#e5e3d8] p-3 hover:border-[#1f644e]/30 hover:shadow-sm transition-all duration-200 group cursor-pointer">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          {card.number && (
            <span className="text-[10px] font-bold text-[#a0b2ac] block mb-1">{card.number}</span>
          )}

          {card.labels?.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {card.labels.map((label, i) => (
                <span
                  key={i}
                  className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold"
                  style={{
                    backgroundColor: labelColors[i % labelColors.length].bg,
                    color: labelColors[i % labelColors.length].text,
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          )}

          <h4 className="text-sm font-bold text-[#1e3a34] leading-snug">{card.title}</h4>

          {card.description && (
            <p className="text-xs text-[#7c8e88] mt-1 line-clamp-2">{card.description}</p>
          )}

          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold"
              style={{ backgroundColor: priority.bg, color: priority.text }}
            >
              <AlertTriangle className="w-2.5 h-2.5" />
              {priority.label}
            </span>

            {card.dueDate && (
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-bold ${
                  isOverdue ? 'text-[#c94c4c]' : 'text-[#7c8e88]'
                }`}
              >
                <Calendar className="w-2.5 h-2.5" />
                {new Date(card.dueDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            )}

            {checklistTotal > 0 && (
              <span className="text-[10px] font-bold text-[#7c8e88]">
                {checklistDone}/{checklistTotal}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Delete this card?')) onDelete(card._id);
          }}
          className="p-1 text-[#7c8e88] hover:text-[#c94c4c] hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all cursor-pointer flex-shrink-0"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
