'use client';

import { useState, useEffect } from 'react';
import { Card, Skeleton } from '@/components/custom-ui';
import { Link2, Eye, Activity, ChevronRight, Copy, Check } from 'lucide-react';

export default function DashboardTab({ navigateTo }) {
  const [stats, setStats] = useState(null);
  const [recentLinks, setRecentLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copiedSlug, setCopiedSlug] = useState(null);

  const handleCopyLink = (e, slug) => {
    e.stopPropagation();
    const fullUrl = `${window.location.origin}/r/${slug}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    });
  };

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
        <h2 className="text-2xl font-bold text-[#1e3a34]  mb-2 font-[family-name:var(--font-sans)]">
          Welcome to SnapLinks
        </h2>
        <p className="text-[#7c8e88] ">Here is an overview of your link performance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <Card
          variant="flat"
          className="p-6 bg-white  border border-[#e5e3d8]  flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigateTo('manage')}
        >
          <div className="w-14 h-14 rounded-full bg-[#1f644e]/10  flex items-center justify-center text-[#1f644e] ">
            <Link2 className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#7c8e88] ">Total Links</p>
            <p className="text-3xl font-bold text-[#1e3a34] ">{stats?.totalLinks || 0}</p>
          </div>
        </Card>

        <Card
          variant="flat"
          className="p-6 bg-white  border border-[#e5e3d8]  flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigateTo('manage')}
        >
          <div className="w-14 h-14 rounded-full bg-[#1f644e]/10  flex items-center justify-center text-[#1f644e] ">
            <Eye className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#7c8e88] ">Total Clicks</p>
            <p className="text-3xl font-bold text-[#1e3a34] ">{stats?.totalClicks || 0}</p>
          </div>
        </Card>

        <Card
          variant="flat"
          className="p-6 bg-white  border border-[#e5e3d8]  flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => navigateTo('manage')}
        >
          <div className="w-14 h-14 rounded-full bg-[#1f644e]/10  flex items-center justify-center text-[#1f644e] ">
            <Activity className="w-7 h-7" />
          </div>
          <div>
            <p className="text-sm font-medium text-[#7c8e88] ">Active Links</p>
            <p className="text-3xl font-bold text-[#1e3a34] ">{stats?.activeLinks || 0}</p>
          </div>
        </Card>
      </div>

      {stats?.topLink && (
        <Card variant="flat" className="p-6 bg-white  border border-[#e5e3d8] ">
          <h3 className="text-lg font-bold text-[#1e3a34]  mb-4">Top Performing Link</h3>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-lg bg-[#fcfbf5]  border border-[#e5e3d8] ">
            <div>
              <p className="font-bold text-[#1e3a34] ">
                {stats.topLink.title || stats.topLink.slug}
              </p>
              <p className="text-sm text-[#7c8e88] ">/r/{stats.topLink.slug}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-4xl font-bold text-[#1f644e] ">
                {stats.topLink.totalClicks}
              </span>
              <span className="text-sm text-[#7c8e88]  font-medium">clicks</span>
            </div>
          </div>
        </Card>
      )}

      {recentLinks.length > 0 && (
        <Card variant="flat" className="p-6 bg-white  border border-[#e5e3d8] ">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-[#1e3a34] ">Recently Created Links</h3>
            <button
              onClick={() => navigateTo('manage')}
              className="text-sm text-[#1f644e]  font-medium hover:underline"
            >
              View All
            </button>
          </div>
          <div className="space-y-3">
            {recentLinks.map((link) => (
              <div
                key={link._id}
                onClick={() => navigateTo('manage')}
                className="flex items-center p-3 hover:bg-[#fcfbf5]  rounded-lg transition-colors border border-transparent hover:border-[#e5e3d8]  cursor-pointer group"
              >
                <div className="flex-1 min-w-0 pr-4">
                  <p className="font-semibold text-[#1e3a34]  truncate">
                    {link.title || link.slug}
                  </p>
                  <div className="flex items-center mt-1">
                    <p className="text-xs text-[#7c8e88]  truncate max-w-[150px]">/r/{link.slug}</p>
                    <button
                      onClick={(e) => handleCopyLink(e, link.slug)}
                      className="ml-2 text-[#7c8e88] hover:text-[#1f644e]  transition-colors p-1 rounded-md flex items-center justify-center relative"
                      title="Copy Link"
                      aria-label="Copy link"
                    >
                      {copiedSlug === link.slug ? (
                        <Check className="w-3.5 h-3.5 text-[#1f644e] " />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      {copiedSlug === link.slug && (
                        <span className="absolute -top-7 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-0.5 rounded shadow-sm whitespace-nowrap z-10">
                          Copied!
                        </span>
                      )}
                    </button>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-bold text-[#1e3a34] ">{link.totalClicks}</p>
                  <p className="text-[10px] uppercase tracking-wider text-[#7c8e88] ">Clicks</p>
                </div>
                <div className="ml-3 shrink-0 text-[#7c8e88]  group-hover:text-[#1f644e]  transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
