'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
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
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { Button, Card, Badge, Skeleton } from '@/components/ui';

// Register ChartJS components
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

export default function ShortLinkAnalyticsPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug;
  const { data: session } = useSession();

  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState('30');

  useEffect(() => {
    if (slug) fetchAnalytics();
  }, [slug, days]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/short-links/analytics?slug=${slug}&days=${days}`);
      if (!response.ok) throw new Error('Failed to fetch analytics');
      const result = await response.json();
      if (result.success) {
        setAnalytics(result.data);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      console.error(err);
      setError('Could not load analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <AdminPageWrapper title="Error">
        <div className="text-red-500">{error}</div>
        <Button onClick={() => router.push('/admin/short-links')} className="mt-4">
          Back to Links
        </Button>
      </AdminPageWrapper>
    );
  }

  if (loading || !analytics) {
    return (
      <AdminPageWrapper title="Loading Analytics...">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} variant="bordered" className="p-6">
              <Skeleton className="h-4 w-24 mb-4" />
              <Skeleton className="h-10 w-32" />
            </Card>
          ))}
        </div>

        <Card variant="bordered" className="p-6 mb-8">
          <Skeleton className="h-6 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} variant="bordered" className="p-6">
              <Skeleton className="h-6 w-32 mb-6" />
              <div className="space-y-4">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </AdminPageWrapper>
    );
  }

  const { summary, linkDetails, topReferrers, devices, countries, clicksOverTime } = analytics;

  // Chart Configuration
  const chartData = {
    labels: clicksOverTime.map((item) => item.date),
    datasets: [
      {
        fill: true,
        label: 'Clicks',
        data: clicksOverTime.map((item) => item.clicks),
        borderColor: 'rgb(0, 0, 0)',
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        tension: 0.4,
        pointBackgroundColor: 'rgb(0, 0, 0)',
        pointBorderColor: '#fff',
        pointHoverBackgroundColor: '#fff',
        pointHoverBorderColor: 'rgb(0, 0, 0)',
        pointRadius: 4,
        pointHitRadius: 10,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#fff',
        titleColor: '#000',
        bodyColor: '#666',
        borderColor: '#eee',
        borderWidth: 1,
        padding: 12,
        boxPadding: 4,
        usePointStyle: true,
        callbacks: {
          label: (context) => ` ${context.parsed.y} clicks`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          font: {
            size: 11,
          },
          color: '#999',
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false,
        },
        ticks: {
          stepSize: 1,
          font: {
            size: 11,
          },
          color: '#999',
          padding: 8,
        },
      },
    },
  };

  return (
    <AdminPageWrapper
      title={`Analytics for /r/${slug}`}
      description={linkDetails?.title || `Detailed click analytics for ${linkDetails?.destination}`}
      actionButton={
        <div className="flex space-x-4 items-center">
          <select
            value={days}
            onChange={(e) => setDays(e.target.value)}
            className="border-2 border-neutral-300 rounded-md px-3 py-2 text-sm focus:border-black focus:ring-0 bg-white"
          >
            <option value="7">Last 7 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
          </select>
          <Link href="/admin/short-links">
            <Button variant="outline">
              <i className="fas fa-arrow-left mr-2"></i> Back
            </Button>
          </Link>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card variant="bordered" className="p-6">
          <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">
            Total Clicks
          </h3>
          <p className="text-3xl font-bold mt-2 font-['Playfair_Display']">{summary.totalClicks}</p>
        </Card>
        <Card variant="bordered" className="p-6">
          <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">
            Unique Visitors
          </h3>
          <p className="text-3xl font-bold mt-2 font-['Playfair_Display']">
            {summary.uniqueVisitors}
          </p>
        </Card>
        <Card variant="bordered" className="p-6">
          <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Status</h3>
          <div className="mt-2">
            <Badge
              variant="tag"
              className={
                linkDetails?.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }
            >
              {linkDetails?.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </Card>
        <Card variant="bordered" className="p-6">
          <h3 className="text-sm font-medium text-neutral-500 uppercase tracking-wider">Tags</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {linkDetails?.tags?.length > 0 ? (
              linkDetails.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="tag"
                  className="bg-neutral-100 text-neutral-800 border-neutral-200"
                >
                  {tag}
                </Badge>
              ))
            ) : (
              <span className="text-sm text-neutral-400">No tags</span>
            )}
          </div>
        </Card>
      </div>

      {/* Click trends chart */}
      <Card
        variant="bordered"
        className="p-6 mb-8 border-2 border-transparent hover:border-black transition-all"
      >
        <h3 className="text-lg font-bold mb-4 font-['Playfair_Display']">Clicks Over Time</h3>
        {clicksOverTime.length > 0 ? (
          <div className="h-72">
            <Line data={chartData} options={chartOptions} />
          </div>
        ) : (
          <div className="h-64 flex flex-col justify-center text-center text-neutral-400 bg-neutral-50 rounded-lg">
            <i className="fas fa-chart-line text-4xl mb-2"></i>
            <p>No analytics data available for the selected time range.</p>
          </div>
        )}
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card variant="bordered" className="p-6">
          <h3 className="text-lg font-bold mb-4 font-['Playfair_Display']">Top Referrers</h3>
          {topReferrers.length > 0 ? (
            <ul className="space-y-3">
              {topReferrers.map((ref, idx) => (
                <li
                  key={idx}
                  className="flex justify-between items-center text-sm border-b border-neutral-100 pb-2 last:border-0"
                >
                  <span className="font-medium truncate max-w-[150px]">{ref.referrer}</span>
                  <span className="text-neutral-500">{ref.count} clicks</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-neutral-500 text-sm">No referrer data.</p>
          )}
        </Card>

        <Card variant="bordered" className="p-6">
          <h3 className="text-lg font-bold mb-4 font-['Playfair_Display']">Top Locations</h3>
          {countries.length > 0 ? (
            <ul className="space-y-3">
              {countries.map((loc, idx) => (
                <li
                  key={idx}
                  className="flex justify-between items-center text-sm border-b border-neutral-100 pb-2 last:border-0"
                >
                  <span className="font-medium">{loc.country || 'Unknown'}</span>
                  <span className="text-neutral-500">{loc.count} clicks</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-neutral-500 text-sm">No location data.</p>
          )}
        </Card>

        <Card variant="bordered" className="p-6">
          <h3 className="text-lg font-bold mb-4 font-['Playfair_Display']">Devices</h3>
          {devices.length > 0 ? (
            <ul className="space-y-3">
              {devices.map((dev, idx) => (
                <li
                  key={idx}
                  className="flex justify-between items-center text-sm border-b border-neutral-100 pb-2 last:border-0"
                >
                  <span className="font-medium flex items-center gap-2">
                    <i
                      className={`fas fa-${dev.device === 'Mobile' ? 'mobile-alt' : dev.device === 'Tablet' ? 'tablet-alt' : 'desktop'}`}
                    ></i>
                    {dev.device || 'Unknown'}
                  </span>
                  <span className="text-neutral-500">{dev.count} clicks</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-neutral-500 text-sm">No device data.</p>
          )}
        </Card>
      </div>
    </AdminPageWrapper>
  );
}
