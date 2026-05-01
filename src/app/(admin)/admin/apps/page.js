'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { Button, Card, Skeleton } from '@/components/custom-ui';
import { TerminalSquare, Plus, Play, Edit2, Trash2, Cpu, PenTool, Search, X } from 'lucide-react';

export default function AppBuilderDashboard() {
  const router = useRouter();
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
      <div className="space-y-6 pb-24 animate-in fade-in duration-300">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-12 w-full md:w-80 lg:w-96 rounded-xl" />
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="p-8 border-2 border-neutral-100 flex flex-col h-72 rounded-2xl bg-white shadow-sm"
            >
              <div className="flex items-center gap-4 mb-8">
                <Skeleton className="w-14 h-14 rounded-2xl" />
                <div className="space-y-3 flex-1">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <Skeleton className="flex-1 w-full mb-6" />
              <div className="mt-auto pt-6 border-t border-neutral-50">
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-16 animate-in fade-in">
      {/* Page Header */}
      <div className="border-b border-neutral-200 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <TerminalSquare className="w-8 h-8 md:w-10 md:h-10 text-black" />
            <h1 className="text-3xl md:text-4xl font-bold text-black font-['Playfair_Display']">
              App Builder
            </h1>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            {/* Search */}
            <div className="relative w-full md:w-80 lg:w-96 group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-neutral-400 group-focus-within:text-black transition-colors duration-200" />
              </div>
              <input
                type="text"
                placeholder="Search apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setSearchQuery('');
                }}
                className="pl-12 pr-12 py-3.5 w-full bg-white border-2 border-black rounded-xl focus:ring-0 focus:outline-none transition-all duration-200 text-neutral-700 placeholder-neutral-400 font-medium text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-3 flex items-center text-neutral-400 hover:text-red-500 transition-colors"
                >
                  <X className="w-5 h-5 transition-transform duration-200" />
                </button>
              )}
            </div>

            <Link href="/admin/apps/create" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-6 py-3.5 bg-black hover:bg-neutral-800 transition-colors text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 cursor-pointer border-2 border-black">
                <Plus className="w-4 h-4" />
                Create App
              </button>
            </Link>
          </div>
        </div>
      </div>

      <div className="w-full space-y-8">
        {/* Grid */}
        {apps.length === 0 ? (
          <div className="text-center p-16 border-2 border-dashed border-neutral-200 rounded-3xl bg-neutral-50/50 flex flex-col items-center justify-center">
            <TerminalSquare className="w-12 h-12 text-neutral-300 mb-4" />
            <h3 className="text-xl font-bold text-neutral-800">No Apps Created Yet</h3>
            <p className="text-neutral-500 mt-2 max-w-md text-sm">
              Generate simple, standalone HTML tools using AI or build them manually.
            </p>
            <Link href="/admin/apps/create" className="mt-6">
              <button className="px-6 py-2.5 bg-white border-2 border-neutral-200 hover:border-black transition-colors rounded-xl text-sm font-bold text-black flex items-center justify-center gap-2 cursor-pointer">
                <Plus className="w-4 h-4" /> Create Your First App
              </button>
            </Link>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="text-center p-12 border-2 border-dashed border-neutral-200 rounded-2xl bg-neutral-50 text-neutral-500 font-medium">
            No apps match your search for "{searchQuery}".
          </div>
        ) : (
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredApps.map((app) => (
              <div
                key={app._id}
                className="block group cursor-pointer"
                onClick={() => router.push(`/admin/apps/${app._id}/run`)}
              >
                <Card
                  interactive
                  className="h-full flex flex-col p-6 border-2 border-neutral-100 hover:border-black transition-all duration-300 bg-white rounded-xl relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0 group-hover:bg-neutral-200/50 border border-neutral-200/60 transition-colors duration-300">
                        <TerminalSquare className="w-6 h-6 text-black" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-neutral-900 leading-tight group-hover:text-black transition-colors">
                          {app.name}
                        </h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          {app.type === 'ai' ? (
                            <>
                              <Cpu className="w-3 h-3 text-neutral-400" />
                              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                                AI Generated
                              </span>
                            </>
                          ) : (
                            <>
                              <PenTool className="w-3 h-3 text-neutral-400" />
                              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                                Manual
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Link
                        href={`/admin/apps/${app._id}/edit`}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-black hover:bg-neutral-100 transition-colors z-10 relative cursor-pointer"
                        title="Edit App"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(app._id, e);
                        }}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors z-10 relative cursor-pointer"
                        title="Delete App"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <p className="text-sm text-neutral-600 line-clamp-2 mb-6 flex-1 leading-relaxed">
                    {app.description}
                  </p>

                  <div className="mt-auto pt-4 border-t border-neutral-100">
                    <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold mb-1.5 flex justify-between items-center">
                      <span>Launch Status</span>
                      <span className="inline-flex items-center gap-1.5 text-black">
                        Ready
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                      </span>
                    </p>
                    <div className="text-xs font-bold uppercase tracking-widest bg-neutral-50 text-neutral-600 px-3 py-3 rounded-lg border border-neutral-100 flex items-center justify-between group-hover:bg-black group-hover:text-white group-hover:border-black transition-colors duration-300">
                      <span>Open Workspace</span>
                      <Play className="w-3.5 h-3.5 group-hover:fill-white" />
                    </div>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
