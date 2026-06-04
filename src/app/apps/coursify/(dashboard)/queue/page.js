'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Clock, CheckCircle2, AlertCircle, Loader2, RotateCcw, X, Filter } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_ICONS = {
  queued: <Clock className="w-4 h-4 text-yellow-600" />,
  generating: <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />,
  done: <CheckCircle2 className="w-4 h-4 text-green-600" />,
  failed: <AlertCircle className="w-4 h-4 text-red-600" />,
  canceled: <X className="w-4 h-4 text-gray-600" />,
};

const STATUS_COLORS = {
  queued: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  generating: 'bg-blue-50 text-blue-800 border-blue-200',
  done: 'bg-green-50 text-green-800 border-green-200',
  failed: 'bg-red-50 text-red-800 border-red-200',
  canceled: 'bg-gray-50 text-gray-800 border-gray-200',
};

export default function QueuePage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusCounts, setStatusCounts] = useState({
    queued: 0,
    generating: 0,
    done: 0,
    failed: 0,
    canceled: 0,
  });
  const pollRef = useRef(null);
  const [actionInProgress, setActionInProgress] = useState(null);

  const fetchJobs = useCallback(async (isPolling = false) => {
    try {
      if (!isPolling && page === 1) setLoading(true);
      const params = new URLSearchParams();
      if (filter) params.append('status', filter);
      params.append('sort', sort);
      params.append('page', page.toString());
      params.append('limit', '50');

      const res = await fetch(`/api/coursify/queue/jobs?${params}`);
      const data = await res.json();
      if (data.success) {
        setJobs(data.jobs || []);
        setTotalPages(data.totalPages || 1);
        if (data.statusCounts) setStatusCounts(data.statusCounts);
      }
    } catch (err) {
      console.error('[QueuePage] Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [filter, sort, page]);

  // Reset page when filter/sort changes
  useEffect(() => {
    setPage(1);
  }, [filter, sort]);

  // Initial load + polling
  useEffect(() => {
    fetchJobs();
    const tick = () => {
      fetchJobs(true);
      pollRef.current = setTimeout(tick, 10_000); // Poll every 10s
    };
    pollRef.current = setTimeout(tick, 10_000);
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current);
    };
  }, [fetchJobs]);

  const handleRetry = async (jobId) => {
    setActionInProgress(jobId);
    try {
      const res = await fetch('/api/coursify/queue/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, action: 'retry' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Job requeued');
        fetchJobs();
      } else {
        toast.error(data.error || 'Failed to retry');
      }
    } catch (err) {
      toast.error('Error retrying job');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleCancel = async (jobId) => {
    setActionInProgress(jobId);
    try {
      const res = await fetch('/api/coursify/queue/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId, action: 'cancel' }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Job canceled');
        fetchJobs();
      } else {
        toast.error(data.error || 'Failed to cancel');
      }
    } catch (err) {
      toast.error('Error canceling job');
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#1e3a34] mb-2">Generation Queue</h1>
        <p className="text-[#7c8e88] text-sm">
          Monitor background generation jobs (sections and external topics) and their progress.
        </p>
      </div>

      {/* Status pills */}
      <div className="flex flex-wrap gap-2 mb-8">
        {Object.entries(statusCounts).map(([status, count]) => (
          <button
            key={status}
            onClick={() => setFilter(filter === status ? '' : status)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
              filter === status
                ? 'bg-[#1f644e] text-white border-[#1f644e]'
                : 'bg-[#f0f5f2] text-[#7c8e88] border-[#e5e3d8] hover:border-[#1f644e]'
            }`}
          >
            <span className="capitalize">{status}</span> {count}
          </button>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2 mb-6">
        <Filter className="w-4 h-4 text-[#7c8e88]" />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="text-xs font-bold rounded-lg border border-[#e5e3d8] bg-white text-[#7c8e88] px-2 py-1.5 focus:outline-none focus:border-[#1f644e]"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="status">By status</option>
        </select>
      </div>

      {/* Table & Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-[#7c8e88]" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-16 bg-[#f0f5f2] rounded-2xl border border-[#e5e3d8]">
          <p className="text-[#7c8e88]">No jobs in the queue</p>
        </div>
      ) : (
        <>
          {/* Mobile Card Layout */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white border border-[#e5e3d8] rounded-xl p-4 shadow-sm"
              >
                <div className="flex justify-between items-start mb-3">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      job.jobType === 'section'
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-orange-100 text-orange-700'
                    }`}
                  >
                    {job.jobType === 'section' ? 'Section' : 'External'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {STATUS_ICONS[job.status]}
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        STATUS_COLORS[job.status]
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                </div>

                <h3 className="text-[#1e3a34] font-bold mb-1 truncate">
                  {job.sectionTitle || job.courseTitle}
                </h3>
                <p className="text-[#7c8e88] text-xs mb-1 truncate">
                  {job.jobType === 'section' ? job.courseTitle : job.moduleTitle || '—'}
                  {job.jobType === 'section' && job.moduleTitle ? ` / ${job.moduleTitle}` : ''}
                </p>

                <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#f0f5f2]">
                  <div className="text-[10px] text-[#7c8e88]">
                    {new Date(job.createdAt).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    <span className="ml-2">• {job.attempts}/{job.maxAttempts} attempts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {job.status === 'failed' && (
                      <button
                        onClick={() => handleRetry(job.id)}
                        disabled={actionInProgress === job.id}
                        className="p-2 rounded-lg bg-blue-50 text-blue-600 disabled:opacity-50"
                      >
                        {actionInProgress === job.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <RotateCcw className="w-4 h-4" />
                        )}
                      </button>
                    )}
                    {['queued', 'generating'].includes(job.status) && (
                      <button
                        onClick={() => handleCancel(job.id)}
                        disabled={actionInProgress === job.id}
                        className="p-2 rounded-lg bg-red-50 text-red-600 disabled:opacity-50"
                      >
                        {actionInProgress === job.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <X className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                {job.error && (
                  <div className="mt-2 p-2 bg-red-50 rounded text-[10px] text-red-700 break-words border border-red-100">
                    {job.error}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Table Layout */}
          <div className="hidden md:block overflow-x-auto border border-[#e5e3d8] rounded-xl">
            <table className="w-full text-sm">
              <thead className="bg-[#f0f5f2] border-b border-[#e5e3d8]">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-[#1e3a34]">Type</th>
                  <th className="px-4 py-3 text-left font-bold text-[#1e3a34]">Status</th>
                  <th className="px-4 py-3 text-left font-bold text-[#1e3a34]">Section / Topic</th>
                  <th className="px-4 py-3 text-left font-bold text-[#1e3a34]">Course / Client</th>
                  <th className="px-4 py-3 text-left font-bold text-[#1e3a34]">Module</th>
                  <th className="px-4 py-3 text-center font-bold text-[#1e3a34]">Attempts</th>
                  <th className="px-4 py-3 text-left font-bold text-[#1e3a34]">Created</th>
                  <th className="px-4 py-3 text-left font-bold text-[#1e3a34]">Error</th>
                  <th className="px-4 py-3 text-right font-bold text-[#1e3a34]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="border-b border-[#e5e3d8] hover:bg-[#f0f5f2] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${
                          job.jobType === 'section'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-orange-100 text-orange-700'
                        }`}
                      >
                        {job.jobType === 'section' ? 'Section' : 'External'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {STATUS_ICONS[job.status]}
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold border ${
                            STATUS_COLORS[job.status]
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#1e3a34] font-medium">
                      {job.sectionTitle || job.courseTitle}
                    </td>
                    <td className="px-4 py-3 text-[#7c8e88]">
                      {job.jobType === 'section' ? job.courseTitle : job.moduleTitle || '—'}
                    </td>
                    <td className="px-4 py-3 text-[#7c8e88]">
                      {job.jobType === 'section' ? job.moduleTitle || '—' : '—'}
                    </td>
                    <td className="px-4 py-3 text-center text-[#7c8e88]">
                      {job.attempts}/{job.maxAttempts}
                    </td>
                    <td className="px-4 py-3 text-[#7c8e88] text-xs">
                      {new Date(job.createdAt).toLocaleString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {job.error ? (
                        <div title={job.error} className="text-red-700 text-xs max-w-xs truncate">
                          {job.error}
                        </div>
                      ) : (
                        <span className="text-[#7c8e88]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {job.status === 'failed' && (
                          <button
                            onClick={() => handleRetry(job.id)}
                            disabled={actionInProgress === job.id}
                            title="Retry this job"
                            className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
                          >
                            {actionInProgress === job.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <RotateCcw className="w-4 h-4" />
                            )}
                          </button>
                        )}
                        {['queued', 'generating'].includes(job.status) && (
                          <button
                            onClick={() => handleCancel(job.id)}
                            disabled={actionInProgress === job.id}
                            title="Cancel this job"
                            className="p-1.5 rounded-lg hover:bg-red-100 text-red-600 hover:text-red-800 disabled:opacity-50 transition-colors"
                          >
                            {actionInProgress === job.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="px-4 py-2 rounded-lg border border-[#e5e3d8] text-[#1e3a34] font-bold text-sm hover:bg-[#f0f5f2] disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm font-bold text-[#1e3a34]">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className="px-4 py-2 rounded-lg border border-[#e5e3d8] text-[#1e3a34] font-bold text-sm hover:bg-[#f0f5f2] disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      <p className="text-xs text-[#7c8e88] mt-6">
        Auto-refreshes every 10 seconds. Click status pills to filter.
      </p>
    </div>
  );
}
