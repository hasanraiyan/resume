'use client';

import { useState } from 'react';
import { X, Loader2, Calendar, AlertTriangle, Plus, Check, Trash2, Save } from 'lucide-react';

const priorityOptions = [
  { value: 'low', label: 'Low', color: '#5a7a3a', bg: '#f0f5f2' },
  { value: 'medium', label: 'Medium', color: '#b8860b', bg: '#fff8e1' },
  { value: 'high', label: 'High', color: '#c97b3a', bg: '#fff0e0' },
  { value: 'urgent', label: 'Urgent', color: '#c94c4c', bg: '#fce8e8' },
];

const labelPresets = [
  'Bug',
  'Feature',
  'Enhancement',
  'Design',
  'Research',
  'Docs',
  'Idea',
  'Chore',
];

export default function CardModal({ card, boardId, columns, onClose, onUpdated, onDeleted }) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  const [priority, setPriority] = useState(card.priority || 'medium');
  const [dueDate, setDueDate] = useState(card.dueDate ? card.dueDate.split('T')[0] : '');
  const [columnId, setColumnId] = useState(card.columnId);
  const [labels, setLabels] = useState(card.labels || []);
  const [checklist, setChecklist] = useState(card.checklist || []);
  const [newCheckItem, setNewCheckItem] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [showLabelPicker, setShowLabelPicker] = useState(false);

  const handleSave = async () => {
    if (!title.trim() || isSaving) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/kanban/cards/${card._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          priority,
          columnId,
          dueDate: dueDate ? new Date(dueDate).toISOString() : null,
          labels,
          checklist,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        onUpdated(data.card);
        onClose();
      }
    } catch (error) {
      console.error('Failed to update card:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this card?')) return;

    try {
      const res = await fetch(`/api/kanban/cards/${card._id}`, { method: 'DELETE' });
      if (res.ok) {
        onDeleted(card._id);
      }
    } catch (error) {
      console.error('Failed to delete card:', error);
    }
  };

  const toggleCheckItem = (index) => {
    setChecklist((prev) =>
      prev.map((item, i) => (i === index ? { ...item, done: !item.done } : item))
    );
  };

  const addCheckItem = () => {
    if (!newCheckItem.trim()) return;
    setChecklist((prev) => [...prev, { text: newCheckItem.trim(), done: false }]);
    setNewCheckItem('');
  };

  const removeCheckItem = (index) => {
    setChecklist((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleLabel = (label) => {
    setLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const currentPriority = priorityOptions.find((p) => p.value === priority);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-20">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-xl border border-[#e5e3d8] shadow-xl w-full max-w-lg mx-4 max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-[#e5e3d8] px-5 py-3 flex items-center justify-between rounded-t-xl z-10">
          <h3 className="text-sm font-bold text-[#1e3a34]">Edit Card</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              className="p-1.5 text-[#7c8e88] hover:text-[#c94c4c] hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
              title="Delete"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#7c8e88] hover:bg-[#f0f5f2] rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-lg font-bold text-[#1e3a34] outline-none border-b border-transparent focus:border-[#1f644e] pb-1"
              placeholder="Card title"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#7c8e88] mb-1.5 uppercase tracking-wider">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              className="w-full rounded-lg border border-[#e5e3d8] bg-[#fcfbf5] px-3 py-2 text-sm outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/20 resize-none min-h-[80px]"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#7c8e88] mb-1.5 uppercase tracking-wider">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full rounded-lg border border-[#e5e3d8] bg-[#fcfbf5] px-3 py-2 text-sm outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/20"
              >
                {priorityOptions.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#7c8e88] mb-1.5 uppercase tracking-wider">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-lg border border-[#e5e3d8] bg-[#fcfbf5] px-3 py-2 text-sm outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/20"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#7c8e88] mb-1.5 uppercase tracking-wider">
              Column
            </label>
            <select
              value={columnId}
              onChange={(e) => setColumnId(e.target.value)}
              className="w-full rounded-lg border border-[#e5e3d8] bg-[#fcfbf5] px-3 py-2 text-sm outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/20"
            >
              {columns.map((col) => (
                <option key={col._id} value={col._id}>
                  {col.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#7c8e88] mb-1.5 uppercase tracking-wider">
              Labels
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {labels.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-[#1f644e]/10 text-[#1f644e]"
                >
                  {label}
                  <button
                    onClick={() => toggleLabel(label)}
                    className="hover:text-[#c94c4c] cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="relative">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onFocus={() => setShowLabelPicker(true)}
                onBlur={() => setTimeout(() => setShowLabelPicker(false), 200)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newLabel.trim()) {
                    toggleLabel(newLabel.trim());
                    setNewLabel('');
                  }
                }}
                placeholder="Type label or pick one..."
                className="w-full rounded-lg border border-[#e5e3d8] bg-[#fcfbf5] px-3 py-2 text-sm outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/20"
              />
              {showLabelPicker && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-[#e5e3d8] rounded-lg shadow-lg p-2 flex flex-wrap gap-1 z-10">
                  {labelPresets
                    .filter((l) => !labels.includes(l))
                    .map((label) => (
                      <button
                        key={label}
                        onClick={() => {
                          toggleLabel(label);
                          setNewLabel('');
                        }}
                        className="px-2 py-1 text-[11px] font-bold bg-[#f0f5f2] text-[#1e3a34] rounded hover:bg-[#e2ede7] cursor-pointer"
                      >
                        {label}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#7c8e88] mb-1.5 uppercase tracking-wider">
              Checklist
            </label>
            <div className="space-y-1.5 mb-2">
              {checklist.map((item, i) => (
                <div key={i} className="flex items-center gap-2 group">
                  <button
                    onClick={() => toggleCheckItem(i)}
                    className={`flex-shrink-0 w-4 h-4 rounded border-2 flex items-center justify-center transition-colors cursor-pointer ${
                      item.done
                        ? 'bg-[#1f644e] border-[#1f644e]'
                        : 'border-[#a0b2ac] hover:border-[#1f644e]'
                    }`}
                  >
                    {item.done && <Check className="w-3 h-3 text-white" />}
                  </button>
                  <span
                    className={`flex-1 text-sm ${
                      item.done ? 'line-through text-[#a0b2ac]' : 'text-[#1e3a34]'
                    }`}
                  >
                    {item.text}
                  </span>
                  <button
                    onClick={() => removeCheckItem(i)}
                    className="p-0.5 text-[#a0b2ac] hover:text-[#c94c4c] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newCheckItem}
                onChange={(e) => setNewCheckItem(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addCheckItem();
                }}
                placeholder="Add checklist item..."
                className="flex-1 rounded-lg border border-[#e5e3d8] bg-[#fcfbf5] px-3 py-1.5 text-sm outline-none focus:border-[#1f644e] focus:ring-2 focus:ring-[#1f644e]/20"
              />
              <button
                onClick={addCheckItem}
                disabled={!newCheckItem.trim()}
                className="p-1.5 text-[#1f644e] hover:bg-[#f0f5f2] rounded-lg disabled:opacity-50 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-[#e5e3d8] px-5 py-3 flex justify-end rounded-b-xl">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-bold text-[#7c8e88] hover:bg-[#f0f5f2] rounded-lg transition-colors cursor-pointer mr-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-[#1f644e] text-white text-sm font-bold rounded-lg hover:bg-[#17503e] disabled:opacity-50 transition-all cursor-pointer shadow-sm"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
