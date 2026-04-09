'use client';

import { useState, useEffect } from 'react';
import { Card, Skeleton } from '@/components/ui';
import { Link2, Eye, Activity } from 'lucide-react';

export default function DashboardTab({ navigateTo }) {
  const [stats, setStats] = useState(null);
  const [recentLinks, setRecentLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardRes, linksRes] = await Promise.all([
          fetch('/api/admin/short-links/dashboard'),
          fetch('/api/admin/short-links'),
        ]);

        if (dashboardRes.ok) {
          const dashboardData = await dashboardRes.json();
          if (dashboardData.success) {
            setStats(dashboardData.data);
          }
        }

        if (linksRes.ok) {
          const linksData = await linksRes.json();
          if (linksData.success) {
            // Sort by createdAt descending and take top 5
            const sortedLinks = linksData.data.sort(
              (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
            );
            setRecentLinks(sortedLinks.slice(0, 5));
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <Card
          variant="flat"
          className="p-6 bg-white dark:bg-[#1e1e1e] border border-[#e5e3d8] dark:border-[#333333] flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigateTo('manage')}
        >
          <div className="w-14 h-14 rounded-full bg-[#1f644e]/10 dark:bg-[#2ecc71]/10 flex items-center justify-center text-[#1f644e] dark:text-[#2ecc71]">
            <Link2 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#7c8e88] dark:text-[#a0a0a0]">Total Links</p>
            <p className="text-3xl font-bold text-[#1e3a34] dark:text-white">
              {stats?.totalLinks || 0}
            </p>
          </div>
        </Card>

        <Card
          variant="flat"
          className="p-6 bg-white dark:bg-[#1e1e1e] border border-[#e5e3d8] dark:border-[#333333] flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigateTo('manage')}
        >
          <div className="w-14 h-14 rounded-full bg-[#1f644e]/10 dark:bg-[#2ecc71]/10 flex items-center justify-center text-[#1f644e] dark:text-[#2ecc71]">
            <Eye className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#7c8e88] dark:text-[#a0a0a0]">Total Clicks</p>
            <p className="text-3xl font-bold text-[#1e3a34] dark:text-white">
              {stats?.totalClicks || 0}
            </p>
          </div>
        </Card>

        <Card
          variant="flat"
          className="p-6 bg-white dark:bg-[#1e1e1e] border border-[#e5e3d8] dark:border-[#333333] flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigateTo('manage')}
        >
          <div className="w-14 h-14 rounded-full bg-[#1f644e]/10 dark:bg-[#2ecc71]/10 flex items-center justify-center text-[#1f644e] dark:text-[#2ecc71]">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#7c8e88] dark:text-[#a0a0a0]">Active Links</p>
            <p className="text-3xl font-bold text-[#1e3a34] dark:text-white">
              {stats?.activeLinks || 0}
            </p>
          </div>
        </Card>
      </div>

      {stats?.topLink && (
        <Card
          variant="flat"
          className="p-6 bg-white dark:bg-[#1e1e1e] border border-[#e5e3d8] dark:border-[#333333]"
        >
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
              <span className="text-4xl font-bold text-[#1f644e] dark:text-[#2ecc71]">
                {stats.topLink.totalClicks}
              </span>
              <span className="text-sm text-[#7c8e88] dark:text-[#a0a0a0] font-medium">clicks</span>
            </div>
          </div>
        </Card>
      )}

      {recentLinks.length > 0 && (
        <Card
          variant="flat"
          className="p-6 bg-white dark:bg-[#1e1e1e] border border-[#e5e3d8] dark:border-[#333333]"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-[#1e3a34] dark:text-white">
              Recently Created Links
            </h3>
            <button
              onClick={() => navigateTo('manage')}
              className="text-sm text-[#1f644e] dark:text-[#2ecc71] font-medium hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentLinks.map((link) => (
              <div
                key={link._id}
                className="flex justify-between items-center p-3 hover:bg-[#fcfbf5] dark:hover:bg-[#2c3e3a] rounded-lg transition-colors border border-transparent hover:border-[#e5e3d8] dark:hover:border-[#333333]"
              >
                <div>
                  <p className="font-semibold text-[#1e3a34] dark:text-white">
                    {link.title || link.slug}
                  </p>
                  <p className="text-xs text-[#7c8e88] dark:text-[#a0a0a0] mt-1">/r/{link.slug}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-[#1e3a34] dark:text-white">{link.totalClicks}</p>
                  <p className="text-[10px] uppercase tracking-wider text-[#7c8e88] dark:text-[#a0a0a0]">
                    Clicks
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
