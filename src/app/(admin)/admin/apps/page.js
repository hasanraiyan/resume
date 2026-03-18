'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { Button, Card, Skeleton } from '@/components/ui';
import { TerminalSquare, Plus, Play, Edit2, Trash2, Cpu, PenTool, Search, X } from 'lucide-react';

export default function AppBuilderDashboard() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchApps();
  }, []);

  const fetchApps = async () => {
    try {
      const res = await fetch('/api/admin/apps');
      if (res.ok) {
        const data = await res.json();
        setApps(data.apps || []);
      }
    } catch (error) {
      console.error('Failed to fetch apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.preventDefault();
    if (!confirm('Are you sure you want to delete this app?')) return;

    try {
      const res = await fetch(`/api/admin/apps/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchApps();
      } else {
        alert('Failed to delete app.');
      }
    } catch (error) {
      console.error(error);
    }
  };

  const filteredApps = apps.filter(
    (app) =>
      app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <AdminPageWrapper>
        <div className="space-y-8 pb-24">
          <div className="border-b border-neutral-200 pb-8">
            <Skeleton className="h-10 w-64 mb-4" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-64 rounded-xl" />
            ))}
          </div>
        </div>
      </AdminPageWrapper>
    );
  }

  return (
    <div className="space-y-8 pb-24">
      {/* Page Header */}
      <div className="border-b border-neutral-200 pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-black font-['Playfair_Display'] flex items-center gap-3">
              <TerminalSquare className="w-10 h-10" />
              App Builder
            </h1>
            <p className="text-neutral-500 mt-2 text-lg">
              Create and manage your mini internal tools.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            {/* Search */}
            <div className="relative w-full sm:w-64 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-neutral-400 group-focus-within:text-black transition-colors duration-200" />
              </div>
              <input
                type="text"
                placeholder="Search apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10 py-2.5 w-full bg-white border-2 border-neutral-200 rounded-xl focus:border-black focus:ring-0 focus:outline-none transition-all duration-200 text-sm font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-3 flex items-center text-neutral-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <Link href="/admin/apps/create" className="w-full sm:w-auto">
              <Button
                variant="primary"
                className="w-full sm:w-auto flex items-center gap-2 font-semibold"
              >
                <Plus className="w-5 h-5" />
                Create App
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Grid */}
      {apps.length === 0 ? (
        <div className="text-center p-16 border-2 border-dashed border-neutral-200 rounded-3xl bg-neutral-50/50 flex flex-col items-center justify-center">
          <TerminalSquare className="w-12 h-12 text-neutral-300 mb-4" />
          <h3 className="text-xl font-bold text-neutral-800">No Apps Created Yet</h3>
          <p className="text-neutral-500 mt-2 max-w-md">
            Generate simple, standalone HTML tools using AI or build them manually.
          </p>
          <Link href="/admin/apps/create" className="mt-6">
            <Button variant="primary" className="flex items-center gap-2">
              <Plus className="w-4 h-4" /> Create Your First App
            </Button>
          </Link>
        </div>
      ) : filteredApps.length === 0 ? (
        <div className="text-center p-12 border border-dashed border-neutral-200 rounded-2xl bg-neutral-50 text-neutral-500">
          No apps match your search for "{searchQuery}".
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredApps.map((app) => (
            <Link key={app._id} href={`/admin/apps/${app._id}/run`} className="block group">
              <Card className="h-full flex flex-col p-6 hover:border-black transition-colors duration-300 cursor-pointer border-2 border-neutral-100 bg-white">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0 group-hover:bg-black group-hover:text-white transition-colors duration-300">
                    <TerminalSquare className="w-6 h-6" />
                  </div>
                  <div className="flex gap-1.5">
                    <Link
                      href={`/admin/apps/${app._id}/edit`}
                      className="p-2 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors z-10 relative"
                      onClick={(e) => e.stopPropagation()}
                      title="Edit App"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(app._id, e);
                      }}
                      className="p-2 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors z-10 relative"
                      title="Delete App"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-neutral-900 group-hover:text-black line-clamp-1 mb-2">
                  {app.name}
                </h3>

                <p className="text-sm text-neutral-500 line-clamp-2 mb-6 flex-1">
                  {app.description}
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-50 border border-neutral-200">
                    {app.type === 'ai' ? (
                      <>
                        <Cpu className="w-3 h-3 text-blue-500" />
                        <span className="text-[10px] font-bold text-neutral-600 uppercase">
                          AI Generated
                        </span>
                      </>
                    ) : (
                      <>
                        <PenTool className="w-3 h-3 text-orange-500" />
                        <span className="text-[10px] font-bold text-neutral-600 uppercase">
                          Manual
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs font-bold text-black uppercase tracking-wider group-hover:translate-x-1 transition-transform">
                    Open <Play className="w-3 h-3 fill-black" />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
