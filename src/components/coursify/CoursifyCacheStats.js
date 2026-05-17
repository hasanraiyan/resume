'use client';

import { useEffect, useState } from 'react';
import { BarChart3, Zap, TrendingUp } from 'lucide-react';

export function CoursifyCacheStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/coursify/stats');
        if (!res.ok) throw new Error('Failed to fetch stats');
        const data = await res.json();
        setStats(data.summary);
        setTopicStats(data.topicStats);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const [topicStats, setTopicStats] = useState([]);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-gray-200 rounded-lg" />
        <div className="h-40 bg-gray-200 rounded-lg" />
      </div>
    );
  }

  if (error) {
    return <div className="text-red-600 text-sm">Error: {error}</div>;
  }

  if (!stats) {
    return <div className="text-gray-500 text-sm">No data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Zap className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-bold text-[#1e3a34]">Cache Performance</h3>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Research"
          value={stats.totalResearch}
          icon="📚"
          bgColor="bg-blue-50"
        />
        <StatCard
          label="With Hash"
          value={`${stats.withPromptHash} (${stats.hashCoverage})`}
          icon="✅"
          bgColor="bg-green-50"
        />
        <StatCard
          label="Duplicate Topics"
          value={stats.duplicateTopics}
          icon="🔄"
          bgColor="bg-yellow-50"
        />
        <StatCard
          label="Potential Savings"
          value={stats.potentialCacheSavings}
          icon="⚡"
          bgColor="bg-purple-50"
          highlight
        />
      </div>

      {/* Top Topics */}
      {topicStats.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-bold text-[#1e3a34] mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Most Generated Topics
          </h4>
          <div className="space-y-3">
            {topicStats.map((topic, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-sm text-[#1e3a34] truncate">
                    {topic.topic.substring(0, 40)}
                    {topic.topic.length > 40 ? '...' : ''}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {topic.totalGenerations} generations
                    {topic.duplicates > 0 ? ` • ${topic.duplicates} duplicates` : ''}
                  </p>
                </div>
                {topic.duplicates > 0 && (
                  <div className="ml-4 flex-shrink-0">
                    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                      <TrendingUp className="h-3 w-3" />
                      {topic.duplicates}x
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon, bgColor, highlight }) {
  return (
    <div className={`${bgColor} rounded-lg p-4 border border-gray-200`}>
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-xs text-gray-600 mb-1">{label}</p>
      <p className={`text-lg font-bold ${highlight ? 'text-purple-700' : 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  );
}
