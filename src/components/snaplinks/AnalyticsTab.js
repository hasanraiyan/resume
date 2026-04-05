'use client';

import { useState, useEffect } from 'react';
import { Card, Skeleton, Button, Badge } from '@/components/ui';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { ArrowLeft, ExternalLink, CalendarDays, Globe, Smartphone, Laptop } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AnalyticsTab() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    try {
      const response = await fetch('/api/admin/short-links');
      if (!response.ok) throw new Error('Failed to fetch short links');
      const result = await response.json();
      if (result.success) setLinks(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async (slug) => {
    setAnalyticsLoading(true);
    try {
      const response = await fetch(`/api/admin/short-links/analytics?slug=${slug}&timeframe=30d`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const result = await response.json();
      if (result.success) setAnalytics(result.data);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const handleSelectLink = (slug) => {
    setSelectedSlug(slug);
    fetchAnalytics(slug);
  };

  const handleBack = () => {
    setSelectedSlug(null);
    setAnalytics(null);
  };

  if (loading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  // --- List View ---
  if (!selectedSlug) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1e3a34] dark:text-[#e0e0e0] mb-2 font-[family-name:var(--font-sans)]">
            Analytics Overview
          </h2>
          <p className="text-[#7c8e88] dark:text-[#a0a0a0]">
            Select a link to view detailed click tracking and visitor data.
          </p>
        </div>

        <Card className="p-0 overflow-hidden bg-white shadow-sm border border-neutral-200">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50 text-neutral-600 text-sm border-b border-neutral-100">
                  <th className="px-6 py-4 font-medium">Link</th>
                  <th className="px-6 py-4 font-medium text-right">Total Clicks</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {links.map((link) => (
                  <tr key={link._id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-medium text-black">{link.title || link.slug}</div>
                      <div className="text-sm text-neutral-500">/r/{link.slug}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="font-bold">{link.totalClicks}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectLink(link.slug)}
                      >
                        View Stats
                      </Button>
                    </td>
                  </tr>
                ))}
                {links.length === 0 && (
                  <tr>
                    <td colSpan="3" className="px-6 py-8 text-center text-neutral-500">
                      No links available for analytics.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    );
  }

  // --- Detailed Analytics View ---
  if (analyticsLoading || !analytics) {
    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const {
    linkDetails: link,
    summary,
    clicksOverTime,
    devices,
    countries,
    topReferrers: referrers,
  } = analytics;

  // Transform clicksOverTime into chart.js format
  const chartData = {
    labels: clicksOverTime ? clicksOverTime.map((c) => c.date) : [],
    data: clicksOverTime ? clicksOverTime.map((c) => c.clicks) : [],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#000',
        bodyColor: '#666',
        borderColor: '#e5e5e5',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 7 } },
      y: { beginAtZero: true, grid: { borderDash: [2, 4] }, ticks: { stepSize: 1 } },
    },
    interaction: { mode: 'nearest', axis: 'x', intersect: false },
  };

  const lineChartData = {
    labels: chartData?.labels || [],
    datasets: [
      {
        fill: true,
        label: 'Clicks',
        data: chartData?.data || [],
        borderColor: '#1f644e',
        backgroundColor: 'rgba(31, 100, 78, 0.1)',
        tension: 0.4,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 4,
      },
    ],
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <Button
        variant="ghost"
        onClick={handleBack}
        className="mb-2 text-neutral-500 hover:text-black"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to all links
      </Button>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#1e1e1e] p-6 rounded-xl border border-neutral-200 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold font-['Playfair_Display']">
            {link.title || link.slug}
          </h2>
          <div className="flex items-center gap-2 mt-2 text-sm text-neutral-500">
            <span className="bg-neutral-100 px-2 py-1 rounded font-mono">/r/{link.slug}</span>
            <ArrowLeft className="w-3 h-3" />
            <a
              href={link.destination}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1 hover:text-black hover:underline truncate max-w-[200px] md:max-w-md"
            >
              {link.destination} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-sm text-neutral-500">Total Clicks</p>
            <p className="text-3xl font-bold text-[#1f644e]">{summary.totalClicks}</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-neutral-500">Unique (Est.)</p>
            <p className="text-3xl font-bold text-neutral-700">{summary.uniqueVisitors}</p>
          </div>
        </div>
      </div>

      <Card className="p-6 bg-white dark:bg-[#1e1e1e] border-neutral-200">
        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-neutral-400" />
          Click History (Last 30 Days)
        </h3>
        <div className="h-[300px] w-full">
          {chartData?.data?.some((d) => d > 0) ? (
            <Line options={chartOptions} data={lineChartData} />
          ) : (
            <div className="h-full flex items-center justify-center text-neutral-400">
              No clicks recorded in this period.
            </div>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-white dark:bg-[#1e1e1e] border-neutral-200">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-neutral-400" /> Top Referrers
          </h3>
          <div className="space-y-4">
            {referrers?.length > 0 ? (
              referrers.slice(0, 5).map((ref, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="truncate max-w-[150px]">
                    {ref.referrer || 'Direct / Unknown'}
                  </span>
                  <Badge variant="secondary">{ref.count}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-neutral-500">No referrer data.</p>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-[#1e1e1e] border-neutral-200">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-neutral-400" /> Devices
          </h3>
          <div className="space-y-4">
            {devices?.length > 0 ? (
              devices.map((dev, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span>{dev.device || 'Unknown'}</span>
                  <Badge variant="secondary">{dev.count}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-neutral-500">No device data.</p>
            )}
          </div>
        </Card>

        <Card className="p-6 bg-white dark:bg-[#1e1e1e] border-neutral-200">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-neutral-400" /> Countries
          </h3>
          <div className="space-y-4">
            {countries?.length > 0 ? (
              countries.slice(0, 5).map((country, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span>{country.country || 'Unknown'}</span>
                  <Badge variant="secondary">{country.count}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-neutral-500">No location data.</p>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
