'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import LogList from '@/components/admin/chatbot/LogList';
import Pagination from '@/components/admin/chatbot/Pagination';
import SearchBar from '@/components/admin/chatbot/SearchBar';
import PathFilter from '@/components/admin/chatbot/PathFilter';

export default function ChatLogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [distinctPaths, setDistinctPaths] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [pathFilter, setPathFilter] = useState('');

  const fetchLogs = useCallback(async (page, search, path) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page,
        limit: 15,
        search,
        path,
      });
      const response = await fetch(`/api/admin/chatbot/logs?${params.toString()}`);
      if (!response.ok) {
        throw new Error('Failed to fetch chat logs');
      }
      const data = await response.json();
      setLogs(data.logs);
      setTotalPages(data.totalPages);
      setCurrentPage(data.currentPage);
      setDistinctPaths(data.distinctPaths);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session.user.role === 'admin') {
      const page = parseInt(searchParams.get('page')) || 1;
      const search = searchParams.get('search') || '';
      const path = searchParams.get('path') || '';
      setCurrentPage(page);
      setSearchQuery(search);
      setPathFilter(path);
      fetchLogs(page, search, path);
    }
  }, [status, session, searchParams, fetchLogs]);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'admin') {
      router.push('/admin/login');
    }
  }, [session, status, router]);

  const updateURL = (page, search, path) => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', page);
    if (search) params.set('search', search);
    if (path) params.set('path', path);
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePageChange = (page) => {
    updateURL(page, searchQuery, pathFilter);
  };

  const handleSearch = (search) => {
    updateURL(1, search, pathFilter);
  };

  const handlePathFilter = (path) => {
    updateURL(1, searchQuery, path);
  };

  if (status === 'loading' || (!session && status !== 'unauthenticated')) {
    return (
      <AdminPageWrapper title="Chat Logs">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading chat logs...</p>
          </div>
        </div>
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper title="Chat Interaction Logs">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black font-['Playfair_Display']">Chat History</h1>
          <p className="text-neutral-600">
            Review conversations between visitors and the AI assistant.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <SearchBar onSearch={handleSearch} initialQuery={searchQuery} />
          </div>
          <div>
            <PathFilter
              paths={distinctPaths}
              onFilter={handlePathFilter}
              currentPath={pathFilter}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="text-red-500 bg-red-50 p-4 rounded-lg">{error}</div>
        ) : (
          <>
            <LogList logs={logs} />
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </AdminPageWrapper>
  );
}
