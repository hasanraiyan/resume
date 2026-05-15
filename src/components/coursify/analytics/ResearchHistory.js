'use client';

import { useState, useEffect } from 'react';
import {
  History,
  Search,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Clock,
  Zap,
  Coins,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { Card, Button, Badge } from '@/components/custom-ui';
import { cn } from '@/utils/classNames';

export function ResearchHistory() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1 });
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Handle search debouncing
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchHistory = async (p = page, s = debouncedSearch) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/coursify/history?page=${p}&search=${s}&limit=10`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs);
        setPagination(data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(page, debouncedSearch);
  }, [page, debouncedSearch]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.pages) {
      setPage(newPage);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-[#1e3a34] flex items-center gap-2">
            <History className="w-5 h-5 text-[#1f644e]" />
            Research Logs
          </h2>
          <p className="text-[10px] font-bold text-[#b5c4be] uppercase tracking-widest mt-1">
            Complete audit trail of AI agent executions
          </p>
        </div>

        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#b5c4be]" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1); // Reset to first page on search
            }}
            placeholder="Search topics..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-[#e5e3d8] rounded-xl text-xs outline-none focus:border-[#1f644e] transition-colors"
          />
        </div>
      </div>

      {/* Logs Table */}
      <Card className="p-0 border-[#e5e3d8] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-[10px] font-bold text-[#7c8e88] uppercase tracking-widest border-b">
              <tr>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Research Topic</th>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Resources</th>
                <th className="px-6 py-4 text-right">Investment</th>
              </tr>
            </thead>
            <tbody className="divide-y text-xs">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-6 py-8">
                      <div className="h-4 bg-gray-100 animate-pulse rounded w-full" />
                    </td>
                  </tr>
                ))
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#7c8e88]">
                    No research logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-[#f0f5f2]/20 transition-colors">
                    <td className="px-6 py-4">
                      {log.status === 'success' ? (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-100 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" /> Success
                        </Badge>
                      ) : (
                        <Badge className="bg-red-50 text-red-700 border-red-100 flex items-center gap-1 w-fit">
                          <XCircle className="w-3 h-3" /> Failed
                        </Badge>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {log.outputSlug ? (
                        <a
                          href={`/coursify/r/${log.outputSlug}`}
                          target="_blank"
                          className="group inline-block"
                        >
                          <p className="font-bold text-[#1e3a34] line-clamp-1 group-hover:text-[#1f644e] group-hover:underline transition-all">
                            {log.displayTopic}
                          </p>
                        </a>
                      ) : (
                        <p className="font-bold text-[#1e3a34] line-clamp-1">{log.displayTopic}</p>
                      )}
                      <p className="text-[10px] text-[#7c8e88] mt-0.5 uppercase font-medium">
                        Agent ID: {log.agentId}
                      </p>
                    </td>
                    <td className="px-6 py-4 text-[#7c8e88]">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {new Date(log.createdAt).toLocaleString([], {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 text-[#7c8e88]">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-amber-500" />
                          {(log.usage?.totalTokens / 1000).toFixed(1)}k
                        </span>
                        {log.durationMs && (
                          <span className="text-[10px]">{(log.durationMs / 1000).toFixed(1)}s</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end gap-2">
                        <span className="font-bold text-[#1e3a34] flex items-center gap-1">
                          <Coins className="w-3 h-3 text-[#1f644e]" />${log.costUSD.toFixed(3)}
                        </span>
                        {log.outputSlug && (
                          <a
                            href={`/coursify/r/${log.outputSlug}`}
                            target="_blank"
                            className="flex items-center gap-1 text-[10px] font-bold text-[#1f644e] hover:underline bg-[#f0f5f2] px-2 py-1 rounded-md transition-all"
                          >
                            View Result
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-gray-50/50 border-t border-[#e5e3d8] flex items-center justify-between">
          <p className="text-[10px] font-bold text-[#7c8e88] uppercase tracking-widest">
            Showing {(page - 1) * pagination.limit + 1} to{' '}
            {Math.min(page * pagination.limit, pagination.total)} of {pagination.total}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || loading}
              className="h-8 w-8 p-0 border-[#e5e3d8]"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-1 px-2">
              <span className="text-xs font-bold text-[#1f644e]">{page}</span>
              <span className="text-xs text-[#7c8e88]">/</span>
              <span className="text-xs text-[#7c8e88]">{pagination.pages}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === pagination.pages || loading}
              className="h-8 w-8 p-0 border-[#e5e3d8]"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
