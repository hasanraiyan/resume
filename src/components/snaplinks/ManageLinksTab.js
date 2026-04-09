'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, Badge, Skeleton } from '@/components/ui';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import {
  ArrowLeft,
  ExternalLink,
  CalendarDays,
  Globe,
  Smartphone,
  BarChart3,
  Edit,
  Trash,
  Copy,
  Check,
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

export default function ManageLinksTab() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    slug: '',
    destination: '',
    description: '',
    tags: '',
    expiresAt: '',
    isActive: true,
  });

  // Analytics State
  const [selectedSlug, setSelectedSlug] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [copiedSlug, setCopiedSlug] = useState(null);

  useEffect(() => {
    fetchLinks();
  }, []);

  const fetchLinks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/short-links');
      if (!response.ok) throw new Error('Failed to fetch short links');
      const result = await response.json();
      if (result.success) setLinks(result.data);
    } catch (err) {
      console.error(err);
      setError('Could not load short links. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setFormData({
      id: '',
      title: '',
      slug: '',
      destination: '',
      description: '',
      tags: '',
      expiresAt: '',
      isActive: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (link) => {
    setIsEditing(true);
    setFormData({
      id: link._id,
      title: link.title || '',
      slug: link.slug,
      destination: link.destination,
      description: link.description || '',
      tags: link.tags ? link.tags.join(', ') : '',
      expiresAt: link.expiresAt ? new Date(link.expiresAt).toISOString().split('T')[0] : '',
      isActive: link.isActive,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        ...(isEditing && { id: formData.id }),
        title: formData.title,
        slug: formData.slug,
        destination: formData.destination,
        description: formData.description,
        tags: formData.tags
          ? formData.tags
              .split(',')
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
        isActive: formData.isActive,
      };

      const url = isEditing ? `/api/admin/short-links?id=${formData.id}` : '/api/admin/short-links';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save short link');
      }

      setIsModalOpen(false);
      fetchLinks();
    } catch (err) {
      console.error(err);
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this short link? This action cannot be undone.'))
      return;

    try {
      const response = await fetch(`/api/admin/short-links?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete');
      }

      fetchLinks();
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleCopyLink = (slug) => {
    const fullUrl = `${window.location.origin}/r/${slug}`;
    navigator.clipboard.writeText(fullUrl).then(() => {
      setCopiedSlug(slug);
      setTimeout(() => setCopiedSlug(null), 2000);
    });
  };

  const fetchAnalytics = async (slug) => {
    setAnalyticsLoading(true);
    try {
      const response = await fetch(
        `/api/admin/short-links/analytics?slug=${encodeURIComponent(slug)}&days=30`
      );
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

  const handleBackToLinks = () => {
    setSelectedSlug(null);
    setAnalytics(null);
  };

  // --- Detailed Analytics View ---
  if (selectedSlug) {
    if (analyticsLoading || !analytics) {
      return (
        <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
          <Button
            variant="ghost"
            onClick={handleBackToLinks}
            className="mb-4 text-[#7c8e88] hover:text-[#1e3a34] "
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to all links
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
      labels: clicksOverTime
        ? clicksOverTime.map((c) => {
            const date = new Date(c.date);
            return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
          })
        : [],
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
        x: { grid: { display: false }, ticks: { maxTicksLimit: 7, font: { size: 11 } } },
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

    const renderProgressBar = (count, total) => {
      const percentage = total > 0 ? (count / total) * 100 : 0;
      return (
        <div
          className="absolute top-0 left-0 h-full bg-[#1f644e]/10  rounded-md -z-10 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      );
    };

    const totalDeviceClicks = devices?.reduce((acc, curr) => acc + curr.count, 0) || 0;
    const totalCountryClicks = countries?.reduce((acc, curr) => acc + curr.count, 0) || 0;
    const totalReferrerClicks = referrers?.reduce((acc, curr) => acc + curr.count, 0) || 0;

    return (
      <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={handleBackToLinks}
          className="mb-2 text-[#7c8e88] hover:text-[#1e3a34] "
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to all links
        </Button>

        <Card
          variant="flat"
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white  p-6 border-neutral-200 shadow-sm"
        >
          <div>
            <h2 className="text-2xl font-bold font-['Playfair_Display'] text-[#1e3a34] ">
              {link.title || link.slug}
            </h2>
            <div className="flex items-center gap-2 mt-2 text-sm text-[#7c8e88] ">
              <span className="bg-[#fcfbf5]  px-2 py-1 rounded font-mono">/r/{link.slug}</span>
              <ArrowLeft className="w-3 h-3" />
              <a
                href={link.destination}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 hover:text-[#1e3a34]  hover:underline truncate max-w-[200px] md:max-w-md"
              >
                {link.destination} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-sm text-[#7c8e88]  mb-1">Total Clicks</p>
              <p className="text-4xl font-bold text-[#1f644e] ">{summary.totalClicks}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-[#7c8e88]  mb-1">Unique (Est.)</p>
              <p className="text-4xl font-bold text-[#1e3a34] ">{summary.uniqueVisitors}</p>
            </div>
          </div>
        </Card>

        <Card variant="flat" className="p-6 bg-white  border-neutral-200">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-[#1e3a34] ">
            <CalendarDays className="w-5 h-5 text-[#7c8e88]" />
            Click History (Last 30 Days)
          </h3>
          <div className="h-[300px] w-full">
            {chartData?.data?.some((d) => d > 0) ? (
              <Line options={chartOptions} data={lineChartData} />
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[#7c8e88] space-y-3">
                <BarChart3 className="w-12 h-12 opacity-20" />
                <p>No clicks recorded in this period.</p>
                <p className="text-sm">Share your link to get started!</p>
              </div>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card variant="flat" className="p-6 bg-white  border-neutral-200">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#1e3a34] ">
              <Globe className="w-5 h-5 text-[#7c8e88]" /> Top Referrers
            </h3>
            <div className="space-y-2">
              {referrers?.length > 0 ? (
                referrers.slice(0, 5).map((ref, i) => (
                  <div
                    key={i}
                    className="relative z-10 flex justify-between items-center text-sm p-2 rounded-md"
                  >
                    {renderProgressBar(ref.count, totalReferrerClicks)}
                    <span className="truncate max-w-[150px] font-medium text-[#1e3a34] ">
                      {ref.referrer || 'Direct / Unknown'}
                    </span>
                    <span className="font-bold text-[#1f644e] ">{ref.count}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#7c8e88]">No referrer data.</p>
              )}
            </div>
          </Card>

          <Card variant="flat" className="p-6 bg-white  border-neutral-200">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#1e3a34] ">
              <Smartphone className="w-5 h-5 text-[#7c8e88]" /> Devices
            </h3>
            <div className="space-y-2">
              {devices?.length > 0 ? (
                devices.map((dev, i) => (
                  <div
                    key={i}
                    className="relative z-10 flex justify-between items-center text-sm p-2 rounded-md"
                  >
                    {renderProgressBar(dev.count, totalDeviceClicks)}
                    <span className="font-medium text-[#1e3a34] ">{dev.device || 'Unknown'}</span>
                    <span className="font-bold text-[#1f644e] ">{dev.count}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#7c8e88]">No device data.</p>
              )}
            </div>
          </Card>

          <Card variant="flat" className="p-6 bg-white  border-neutral-200">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-[#1e3a34] ">
              <Globe className="w-5 h-5 text-[#7c8e88]" /> Countries
            </h3>
            <div className="space-y-2">
              {countries?.length > 0 ? (
                countries.slice(0, 5).map((country, i) => (
                  <div
                    key={i}
                    className="relative z-10 flex justify-between items-center text-sm p-2 rounded-md"
                  >
                    {renderProgressBar(country.count, totalCountryClicks)}
                    <span className="font-medium text-[#1e3a34] ">
                      {country.country || 'Unknown'}
                    </span>
                    <span className="font-bold text-[#1f644e] ">{country.count}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#7c8e88]">No location data.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // --- Main List View ---
  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="mb-8">
        <p className="text-neutral-500 mb-4">Manage, edit, and create new short URLs.</p>
        <Button onClick={openCreateModal} variant="brand" className="w-full">
          <i className="fas fa-plus mr-2"></i> Create Link
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}

      <Card
        variant="flat"
        className="p-0 overflow-hidden bg-white shadow-sm border border-neutral-200"
      >
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : links.length === 0 ? (
          <div className="p-12 text-center text-neutral-500">
            <i className="fas fa-link text-4xl mb-4 opacity-50"></i>
            <p>No short links found. Create your first one!</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {/* Desktop Table */}
            <div className="hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-50 text-neutral-600 text-sm border-b border-neutral-100">
                    <th className="px-6 py-4 font-medium">Link Details</th>
                    <th className="px-6 py-4 font-medium">Destination</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {links.map((link) => (
                    <tr key={link._id} className="hover:bg-neutral-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-medium text-black">{link.title || link.slug}</div>
                        <div className="text-sm text-neutral-500 flex items-center mt-1 group">
                          /r/{link.slug}
                          <button
                            onClick={() => handleCopyLink(link.slug)}
                            className="ml-2 text-neutral-400 hover:text-[#1f644e] transition-colors p-1.5 rounded-md hover:bg-[#1f644e]/10 flex items-center justify-center relative"
                            title="Copy Link"
                            aria-label="Copy link"
                          >
                            {copiedSlug === link.slug ? (
                              <Check className="w-4 h-4 text-[#1f644e]" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                            {copiedSlug === link.slug && (
                              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded shadow-sm whitespace-nowrap">
                                Copied!
                              </span>
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div
                          className="text-sm text-neutral-600 max-w-xs truncate"
                          title={link.destination}
                        >
                          <a
                            href={link.destination}
                            target="_blank"
                            rel="noreferrer"
                            className="hover:underline flex items-center gap-1"
                          >
                            <i className="fas fa-external-link-alt text-xs opacity-50"></i>
                            <span className="truncate">{link.destination}</span>
                          </a>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant="tag"
                          className={
                            link.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }
                        >
                          {link.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            className="px-2 py-1 h-8 text-[#1e3a34] hover:text-[#1f644e] hover:border-[#1f644e] hover:bg-[#1f644e]/5 border-transparent shadow-none"
                            onClick={() => handleSelectLink(link.slug)}
                            title="View Analytics"
                          >
                            <BarChart3 className="w-4 h-4" strokeWidth={2.5} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="px-2 py-1 h-8 text-[#1e3a34] hover:text-[#1e3a34] border-transparent hover:bg-neutral-100 shadow-none"
                            onClick={() => openEditModal(link)}
                            title="Edit Link"
                          >
                            <Edit className="w-4 h-4" strokeWidth={2.5} />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="px-2 py-1 h-8 text-[#1e3a34] hover:text-red-600 hover:border-red-200 hover:bg-red-50 border-transparent shadow-none"
                            onClick={() => handleDelete(link._id)}
                            title="Delete Link"
                          >
                            <Trash className="w-4 h-4" strokeWidth={2.5} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile List */}
            <div className="md:hidden p-4">
              {links.map((link) => (
                <div
                  key={link._id}
                  className="border-b border-neutral-100 last:border-b-0 p-4 hover:bg-[#fcfbf5] transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="max-w-[70%]">
                      <div
                        className="font-medium text-black truncate"
                        title={link.title || link.slug}
                      >
                        {link.title || link.slug}
                      </div>
                      <div className="text-xs text-neutral-500 flex items-center mt-1 break-all relative">
                        /r/{link.slug}
                        <button
                          onClick={() => handleCopyLink(link.slug)}
                          className="ml-2 text-neutral-400 hover:text-[#1f644e] transition-colors p-2 rounded-md hover:bg-[#1f644e]/10 flex items-center justify-center"
                          title="Copy Link"
                        >
                          {copiedSlug === link.slug ? (
                            <Check className="w-4 h-4 text-[#1f644e]" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                          {copiedSlug === link.slug && (
                            <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded shadow-sm whitespace-nowrap z-10">
                              Copied!
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                    <Badge
                      variant="tag"
                      className={
                        link.isActive
                          ? 'bg-green-100 text-green-800 shrink-0'
                          : 'bg-red-100 text-red-800 shrink-0'
                      }
                    >
                      {link.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>

                  <div className="mb-3 text-sm text-neutral-600 truncate">
                    <a
                      href={link.destination}
                      target="_blank"
                      rel="noreferrer"
                      className="hover:underline flex items-center gap-1"
                    >
                      <i className="fas fa-link text-xs opacity-50"></i>
                      <span className="truncate">{link.destination}</span>
                    </a>
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-neutral-50">
                    <div className="text-sm">
                      <span className="font-medium">{link.totalClicks}</span>{' '}
                      <span className="text-neutral-500">clicks</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-2 py-1 h-8 text-[#1e3a34] hover:text-[#1f644e] hover:border-[#1f644e] hover:bg-[#1f644e]/5 border-transparent shadow-none"
                        onClick={() => handleSelectLink(link.slug)}
                        title="View Analytics"
                      >
                        <BarChart3 className="w-4 h-4" strokeWidth={2.5} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-2 py-1 h-8 text-[#1e3a34] hover:text-[#1e3a34] border-transparent hover:bg-neutral-100 shadow-none"
                        onClick={() => openEditModal(link)}
                      >
                        <Edit className="w-4 h-4" strokeWidth={2.5} />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="px-2 py-1 h-8 text-[#1e3a34] hover:text-red-600 hover:border-red-200 hover:bg-red-50 border-transparent shadow-none"
                        onClick={() => handleDelete(link._id)}
                      >
                        <Trash className="w-4 h-4" strokeWidth={2.5} />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Modal / Form overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card
            variant="flat"
            className="p-6 md:p-8 w-full max-w-2xl bg-white max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold mb-6 font-[family-name:var(--font-sans)]">
              {isEditing ? 'Edit SnapLink' : 'Create SnapLink'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Slug (Required)</label>
                  <div className="flex items-center">
                    <span className="bg-neutral-100 border-2 border-r-0 border-neutral-300 rounded-l-xl px-3 py-2 text-neutral-500 text-sm">
                      /r/
                    </span>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) =>
                        setFormData({ ...formData, slug: e.target.value.toLowerCase() })
                      }
                      className="w-full border-2 border-neutral-300 rounded-r-xl px-4 py-2 focus:border-[#1f644e] focus:ring-0 text-sm outline-none transition-colors"
                      placeholder="e.g., github"
                      pattern="^[a-z0-9-]+$"
                      maxLength={50}
                      title="Only lowercase letters, numbers, and hyphens (Max 50 characters)"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Title (Optional)</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full border-2 border-neutral-300 rounded-xl px-4 py-2 focus:border-[#1f644e] focus:ring-0 text-sm outline-none transition-colors"
                    placeholder="My GitHub Profile"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Destination URL (Required)</label>
                <input
                  type="url"
                  required
                  value={formData.destination}
                  onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  className="w-full border-2 border-neutral-300 rounded-xl px-4 py-2 focus:border-[#1f644e] focus:ring-0 text-sm outline-none transition-colors"
                  placeholder="https://github.com/hasanraiyan"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full border-2 border-neutral-300 rounded-xl px-4 py-2 focus:border-[#1f644e] focus:ring-0 text-sm min-h-[80px] outline-none transition-colors"
                  placeholder="Notes about where this link is used..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Tags (Comma separated)</label>
                  <div className="w-full border-2 border-neutral-300 rounded-xl px-3 py-2 focus-within:border-[#1f644e] transition-colors flex flex-wrap gap-2 items-center min-h-[44px]">
                    {formData.tags
                      .split(',')
                      .filter((t) => t.trim())
                      .map((tag, idx) => (
                        <span
                          key={idx}
                          className="bg-[#1f644e]/10 text-[#1f644e] px-2 py-1 rounded text-xs font-semibold flex items-center"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="flex-1 outline-none text-sm min-w-[120px] bg-transparent"
                      placeholder={formData.tags ? '' : 'social, resume, ai-project'}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Expires At (Optional)</label>
                  <input
                    type="date"
                    value={formData.expiresAt}
                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                    className="w-full border-2 border-neutral-300 rounded-xl px-4 py-2 focus:border-[#1f644e] focus:ring-0 text-sm outline-none transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center mt-4">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 rounded border-neutral-300 text-black focus:ring-black"
                />
                <label htmlFor="isActive" className="ml-2 text-sm text-neutral-700">
                  Link is currently Active
                </label>
              </div>

              <div className="flex justify-end gap-3 mt-8">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={submitting}
                  className="bg-[#1f644e] hover:bg-[#164a39] text-white"
                >
                  {isEditing ? 'Update Link' : 'Create Link'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
