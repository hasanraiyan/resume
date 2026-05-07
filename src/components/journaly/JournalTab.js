'use client';

import { useState } from 'react';
import { useJournaly } from '@/context/JournalyContext';
import { Plus, PenTool, BookOpen, Clock, Calendar } from 'lucide-react';
import ComposeView from './ComposeView';

export default function JournalTab() {
  const { entries, addEntry, tags, stats } = useJournaly();
  const [isComposing, setIsComposing] = useState(false);

  const handleSave = async (payload) => {
    await addEntry(payload);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Welcome Header */}
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Good day, Traveler</h1>
        <p className="text-[#7c8e88] text-lg max-w-2xl">
          Your journal is a safe place for your thoughts. Ready to write something new?
        </p>
      </div>

      {/* Quick Action Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
        <button
          onClick={() => setIsComposing(true)}
          className="group relative flex items-center gap-6 p-6 rounded-2xl border-2 border-dashed border-[#e5e3d8] hover:border-[#1f644e] hover:bg-[#f0f5f2] transition-all duration-300 text-left"
        >
          <div className="h-14 w-14 shrink-0 flex items-center justify-center rounded-2xl bg-[#1f644e] text-white shadow-lg group-hover:scale-110 transition-transform">
            <Plus className="w-8 h-8" />
          </div>
          <div>
            <h2 className="font-bold text-xl mb-1 group-hover:text-[#1f644e] transition-colors">Write Entry</h2>
            <p className="text-sm text-[#7c8e88]">Capture your current thoughts and mood</p>
          </div>
        </button>

        <div className="flex items-center gap-6 p-6 rounded-2xl border border-[#e5e3d8] bg-white shadow-sm">
          <div className="h-14 w-14 shrink-0 flex items-center justify-center rounded-2xl bg-[#f0f5f2] text-[#1f644e]">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="font-bold text-xl mb-1">{stats?.currentStreak || 0} Day Streak</h2>
            <p className="text-sm text-[#7c8e88]">Keep the momentum going!</p>
          </div>
        </div>
      </div>

      {/* Recent Entries Preview */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#7c8e88]">Recent Reflections</h2>
          {entries.length > 0 && (
            <span className="text-xs font-medium text-[#1f644e]">{entries.length} entries total</span>
          )}
        </div>

        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 rounded-2xl bg-white border border-[#e5e3d8] text-center">
            <div className="w-16 h-16 rounded-full bg-[#f0f5f2] flex items-center justify-center mb-4">
              <PenTool className="w-8 h-8 text-[#1f644e]" />
            </div>
            <h3 className="font-bold text-lg mb-2">No entries yet</h3>
            <p className="text-[#7c8e88] max-w-xs mx-auto mb-6">
              Start your journey by writing your first journal entry.
            </p>
            <button
              onClick={() => setIsComposing(true)}
              className="px-6 py-2.5 bg-[#1f644e] text-white font-bold rounded-xl hover:bg-[#17503e] transition-colors"
            >
              Start Writing
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {entries.slice(0, 3).map((entry) => (
              <div
                key={entry._id}
                className="group p-5 rounded-2xl border border-[#e5e3d8] bg-white hover:border-[#1f644e]/30 transition-all duration-300 shadow-sm"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getMoodEmoji(entry.mood)}</span>
                    <div>
                      <h3 className="font-bold text-[#1e3a34] group-hover:text-[#1f644e] transition-colors line-clamp-1">
                        {entry.title || 'Untitled Entry'}
                      </h3>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-[#7c8e88] uppercase tracking-wide mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(entry.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-[#7c8e88] line-clamp-2 leading-relaxed">
                  {entry.body}
                </p>
                {entry.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {entry.tags.map((tag) => (
                      <span key={tag} className="px-2 py-0.5 bg-[#f0f5f2] text-[#1f644e] rounded-md text-[10px] font-bold">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {isComposing && (
        <ComposeView
          onSave={handleSave}
          onClose={() => setIsComposing(false)}
          availableTags={tags}
        />
      )}
    </div>
  );
}

function getMoodEmoji(mood) {
  const moods = { 1: '😔', 2: '😐', 3: '🙂', 4: '😊', 5: '🤩' };
  return moods[mood] || '🙂';
}
