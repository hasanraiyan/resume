'use client';

import { useState, useEffect } from 'react';
import { Card, Skeleton } from '@/components/ui';
import { Link2, Eye, Activity } from 'lucide-react';

export default function DashboardTab({ navigateTo }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // In a real scenario we'd create a dedicated endpoint for dashboard stats
      // but for now we can just fetch all links and compute basic stats here.
      const response = await fetch('/api/admin/short-links');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const result = await response.json();

      if (result.success) {
        const links = result.data;
        const totalLinks = links.length;
        const activeLinks = links.filter((l) => l.isActive).length;
        const totalClicks = links.reduce((sum, l) => sum + (l.totalClicks || 0), 0);

        // Find top performing link
        const topLink = [...links].sort((a, b) => (b.totalClicks || 0) - (a.totalClicks || 0))[0];

        setStats({
          totalLinks,
          activeLinks,
          totalClicks,
          topLink,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-[#1e3a34] dark:text-[#e0e0e0] mb-2 font-[family-name:var(--font-sans)]">
          Welcome to SnapLinks
        </h2>
        <p className="text-[#7c8e88] dark:text-[#a0a0a0]">
          Here is an overview of your link performance.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card
          className="p-6 bg-white dark:bg-[#1e1e1e] border border-[#e5e3d8] dark:border-[#333333] flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigateTo('manage')}
        >
          <div className="w-12 h-12 rounded-full bg-[#e8f3ef] dark:bg-[#2c3e3a] flex items-center justify-center text-[#1f644e] dark:text-[#2ecc71]">
            <Link2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#7c8e88] dark:text-[#a0a0a0]">Total Links</p>
            <p className="text-2xl font-bold text-[#1e3a34] dark:text-white">
              {stats?.totalLinks || 0}
            </p>
          </div>
        </Card>

        <Card
          className="p-6 bg-white dark:bg-[#1e1e1e] border border-[#e5e3d8] dark:border-[#333333] flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigateTo('analytics')}
        >
          <div className="w-12 h-12 rounded-full bg-[#e8f3ef] dark:bg-[#2c3e3a] flex items-center justify-center text-[#1f644e] dark:text-[#2ecc71]">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#7c8e88] dark:text-[#a0a0a0]">Total Clicks</p>
            <p className="text-2xl font-bold text-[#1e3a34] dark:text-white">
              {stats?.totalClicks || 0}
            </p>
          </div>
        </Card>

        <Card
          className="p-6 bg-white dark:bg-[#1e1e1e] border border-[#e5e3d8] dark:border-[#333333] flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigateTo('manage')}
        >
          <div className="w-12 h-12 rounded-full bg-[#e8f3ef] dark:bg-[#2c3e3a] flex items-center justify-center text-[#1f644e] dark:text-[#2ecc71]">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#7c8e88] dark:text-[#a0a0a0]">Active Links</p>
            <p className="text-2xl font-bold text-[#1e3a34] dark:text-white">
              {stats?.activeLinks || 0}
            </p>
          </div>
        </Card>
      </div>

      {stats?.topLink && (
        <Card className="p-6 bg-white dark:bg-[#1e1e1e] border border-[#e5e3d8] dark:border-[#333333]">
          <h3 className="text-lg font-bold text-[#1e3a34] dark:text-white mb-4">
            Top Performing Link
          </h3>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-[#fcfbf5] dark:bg-[#121212] border border-[#e5e3d8] dark:border-[#333333]">
            <div>
              <p className="font-bold text-[#1e3a34] dark:text-white">
                {stats.topLink.title || stats.topLink.slug}
              </p>
              <p className="text-sm text-[#7c8e88] dark:text-[#a0a0a0]">/r/{stats.topLink.slug}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-[#1f644e] dark:text-[#2ecc71]">
                {stats.topLink.totalClicks}
              </span>
              <span className="text-sm text-[#7c8e88] dark:text-[#a0a0a0]">clicks</span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
