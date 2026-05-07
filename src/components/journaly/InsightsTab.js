'use client';

import { useJournaly } from '@/context/JournalyContext';
import { Award, Zap, TrendingUp, BookOpen, Smile, Frown, Meh, Hash } from 'lucide-react';

export default function InsightsTab() {
  const { stats } = useJournaly();

  if (!stats) return null;

  const moods = [
    { label: 'Amazing', icon: '🤩', count: stats.moodDistribution[4], color: 'bg-yellow-400' },
    { label: 'Happy', icon: '😊', count: stats.moodDistribution[3], color: 'bg-green-400' },
    { label: 'Fine', icon: '🙂', count: stats.moodDistribution[2], color: 'bg-blue-400' },
    { label: 'Neutral', icon: '😐', count: stats.moodDistribution[1], color: 'bg-gray-400' },
    { label: 'Sad', icon: '😔', count: stats.moodDistribution[0], color: 'bg-indigo-400' },
  ];

  const maxMood = Math.max(...stats.moodDistribution, 1);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-3xl font-bold mb-3">Your Insights</h1>
        <p className="text-[#7c8e88] text-lg">A bird&apos;s eye view of your journey and patterns.</p>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        <StatCard
          icon={<BookOpen className="w-5 h-5 text-[#1f644e]" />}
          label="Total Entries"
          value={stats.totalEntries}
          bg="bg-[#f0f5f2]"
        />
        <StatCard
          icon={<Zap className="w-5 h-5 text-orange-500" />}
          label="Current Streak"
          value={`${stats.currentStreak} Days`}
          bg="bg-orange-50"
        />
        <StatCard
          icon={<Award className="w-5 h-5 text-yellow-600" />}
          label="Longest Streak"
          value={`${stats.longestStreak} Days`}
          bg="bg-yellow-50"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
          label="Avg. Entry Length"
          value={`${stats.avgLength} words`}
          bg="bg-blue-50"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Mood Distribution */}
        <section className="bg-white border border-[#e5e3d8] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Smile className="w-5 h-5 text-[#1f644e]" />
            <h2 className="font-bold text-lg">Mood Distribution</h2>
          </div>
          <div className="space-y-4">
            {moods.map((m) => (
              <div key={m.label} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
                  <span className="flex items-center gap-2">
                    <span className="text-lg grayscale-0">{m.icon}</span>
                    {m.label}
                  </span>
                  <span>{m.count} entries</span>
                </div>
                <div className="h-3 bg-[#fcfbf5] rounded-full overflow-hidden border border-[#e5e3d8]/50">
                  <div
                    className={`h-full ${m.color} transition-all duration-1000`}
                    style={{ width: `${(m.count / maxMood) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Top Tags */}
        <section className="bg-white border border-[#e5e3d8] rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Hash className="w-5 h-5 text-[#1f644e]" />
            <h2 className="font-bold text-lg">Most Used Tags</h2>
          </div>
          {stats.topTags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
              <Hash className="w-10 h-10 mb-2" />
              <p className="text-sm">No tags used yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {stats.topTags.map((tag) => (
                <div key={tag.name} className="flex items-center justify-between">
                  <span className="text-sm font-bold text-[#1e3a34] flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#1f644e]" />
                    #{tag.name}
                  </span>
                  <div className="flex items-center gap-3 flex-1 px-4">
                    <div className="h-1 flex-1 bg-[#f0f5f2] rounded-full">
                      <div
                        className="h-full bg-[#1f644e]/20 rounded-full"
                        style={{ width: `${(tag.count / stats.topTags[0].count) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-[#7c8e88] w-6">{tag.count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, bg }) {
  return (
    <div className="bg-white border border-[#e5e3d8] rounded-2xl p-5 shadow-sm">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-[10px] font-bold uppercase tracking-widest text-[#7c8e88] mb-1">
        {label}
      </p>
      <p className="text-xl font-extrabold text-[#1e3a34]">{value}</p>
    </div>
  );
}
