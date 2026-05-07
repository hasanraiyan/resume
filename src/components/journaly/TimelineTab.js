'use client';

import { useState, useMemo } from 'react';
import { useJournaly } from '@/context/JournalyContext';
import { Search, Filter, Calendar, Hash, Smile, ChevronRight, ChevronDown, Trash2, Pencil } from 'lucide-react';
import ComposeView from './ComposeView';

export default function TimelineTab() {
  const { entries, deleteEntry, updateEntry, tags } = useJournaly();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectedMood, setSelectedMood] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [expandedEntries, setExpandedEntries] = useState(new Set());

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      const matchesSearch =
        !searchQuery ||
        e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.body.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = !selectedTag || e.tags.includes(selectedTag);
      const matchesMood = !selectedMood || e.mood === selectedMood;
      return matchesSearch && matchesTag && matchesMood;
    });
  }, [entries, searchQuery, selectedTag, selectedMood]);

  const groupedEntries = useMemo(() => {
    const groups = {};
    filteredEntries.forEach((entry) => {
      const date = new Date(entry.createdAt);
      const dateKey = date.toDateString();
      if (!groups[dateKey]) {
        groups[dateKey] = {
          label: getRelativeDateLabel(date),
          date,
          items: [],
        };
      }
      groups[dateKey].items.push(entry);
    });
    return Object.values(groups).sort((a, b) => b.date - a.date);
  }, [filteredEntries]);

  const toggleExpand = (id) => {
    const next = new Set(expandedEntries);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedEntries(next);
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this entry?')) {
      await deleteEntry(id);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-3xl font-bold">Timeline</h1>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7c8e88]" />
          <input
            type="text"
            placeholder="Search your history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-[#e5e3d8] bg-white outline-none focus:border-[#1f644e] transition-all"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#e5e3d8] rounded-lg text-xs font-bold text-[#7c8e88]">
          <Filter className="w-3.5 h-3.5" />
          Filter by:
        </div>

        {/* Mood Filter */}
        <select
          value={selectedMood || ''}
          onChange={(e) => setSelectedMood(e.target.value ? parseInt(e.target.value) : null)}
          className="px-3 py-1.5 bg-white border border-[#e5e3d8] rounded-lg text-xs font-bold outline-none focus:border-[#1f644e]"
        >
          <option value="">All Moods</option>
          <option value="5">🤩 Amazing</option>
          <option value="4">😊 Happy</option>
          <option value="3">🙂 Fine</option>
          <option value="2">😐 Neutral</option>
          <option value="1">😔 Sad</option>
        </select>

        {/* Tag Filter */}
        <select
          value={selectedTag || ''}
          onChange={(e) => setSelectedTag(e.target.value || null)}
          className="px-3 py-1.5 bg-white border border-[#e5e3d8] rounded-lg text-xs font-bold outline-none focus:border-[#1f644e]"
        >
          <option value="">All Tags</option>
          {tags.map((tag) => (
            <option key={tag} value={tag}>
              #{tag}
            </option>
          ))}
        </select>

        {(selectedMood || selectedTag || searchQuery) && (
          <button
            onClick={() => {
              setSelectedMood(null);
              setSelectedTag(null);
              setSearchQuery('');
            }}
            className="text-xs font-bold text-[#c94c4c] hover:underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Timeline List */}
      <div className="space-y-10">
        {groupedEntries.length === 0 ? (
          <div className="text-center py-20 bg-white border border-[#e5e3d8] rounded-2xl">
            <p className="text-[#7c8e88]">No entries found matching your criteria.</p>
          </div>
        ) : (
          groupedEntries.map((group) => (
            <div key={group.label} className="relative">
              <div className="sticky top-0 z-10 py-2 mb-4 bg-[#fcfbf5]">
                <h3 className="text-xs font-extrabold uppercase tracking-widest text-[#1f644e] flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  {group.label}
                </h3>
              </div>

              <div className="space-y-4 ml-4 border-l-2 border-[#e5e3d8] pl-6 pb-2">
                {group.items.map((entry) => {
                  const isExpanded = expandedEntries.has(entry._id);
                  return (
                    <div
                      key={entry._id}
                      className="group relative bg-white border border-[#e5e3d8] rounded-2xl p-5 hover:border-[#1f644e]/30 transition-all cursor-pointer shadow-sm"
                      onClick={() => toggleExpand(entry._id)}
                    >
                      {/* Mood Icon (absolute left) */}
                      <div className="absolute -left-[45px] top-5 w-9 h-9 rounded-full bg-white border-2 border-[#e5e3d8] flex items-center justify-center text-xl shadow-sm z-10 group-hover:border-[#1f644e]/30 transition-colors">
                        {getMoodEmoji(entry.mood)}
                      </div>

                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-bold text-[#1e3a34] line-clamp-1">
                          {entry.title || 'Untitled'}
                        </h4>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingEntry(entry);
                            }}
                            className="p-1.5 hover:bg-[#f0f5f2] rounded-lg text-[#7c8e88] hover:text-[#1f644e] transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleDelete(entry._id, e)}
                            className="p-1.5 hover:bg-red-50 rounded-lg text-[#7c8e88] hover:text-[#c94c4c] transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className={`text-sm text-[#7c8e88] leading-relaxed transition-all ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {entry.body}
                      </p>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex flex-wrap gap-2">
                          {entry.tags.map((tag) => (
                            <span key={tag} className="text-[10px] font-bold text-[#1f644e] bg-[#f0f5f2] px-2 py-0.5 rounded-md">
                              #{tag}
                            </span>
                          ))}
                        </div>
                        <button className="text-[#1f644e] p-1 rounded-lg hover:bg-[#f0f5f2]">
                          {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {editingEntry && (
        <ComposeView
          entry={editingEntry}
          onSave={(payload) => updateEntry(editingEntry._id, payload)}
          onClose={() => setEditingEntry(null)}
          availableTags={tags}
        />
      )}
    </div>
  );
}

function getRelativeDateLabel(date) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);

  const diffTime = now - d;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;

  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
}

function getMoodEmoji(mood) {
  const moods = { 1: '😔', 2: '😐', 3: '🙂', 4: '😊', 5: '🤩' };
  return moods[mood] || '🙂';
}
