'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Skeleton } from '@/components/ui';
import { TerminalSquare, ArrowLeft, Maximize, Minimize } from 'lucide-react';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';

export default function RunAppPage() {
  const router = useRouter();
  const params = useParams();
  const appId = params?.id;

  const [loading, setLoading] = useState(true);
  const [app, setApp] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (appId) fetchApp();
  }, [appId]);

  const fetchApp = async () => {
    try {
      const res = await fetch(`/api/admin/apps/${appId}`);
      if (!res.ok) throw new Error('Failed to fetch app');
      const data = await res.json();
      setApp(data.app);
    } catch (error) {
      console.error(error);
      alert('Error loading app details.');
      router.push('/admin/apps');
    } finally {
      setLoading(false);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  if (loading) {
    return (
      <AdminPageWrapper>
        <div className="space-y-8 pb-24 h-screen flex flex-col">
          <Skeleton className="h-10 w-64 mb-4" />
          <Skeleton className="flex-1 w-full rounded-2xl" />
        </div>
      </AdminPageWrapper>
    );
  }

  if (!app) return null;

  return (
    <div
      className={`flex flex-col animate-in fade-in duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : 'max-w-7xl mx-auto h-[calc(100vh-120px)]'}`}
    >
      {/* Header Toolbar */}
      <div
        className={`flex items-center justify-between border-b-2 border-neutral-100 bg-white px-8 py-5 shrink-0 transition-all ${isFullscreen ? '' : 'rounded-t-2xl border-x-2 border-t-2 mt-8'}`}
      >
        <div className="flex items-center gap-6">
          <button
            onClick={() => router.push('/admin/apps')}
            className="p-2.5 rounded-xl hover:bg-neutral-100 transition-colors cursor-pointer text-neutral-500 hover:text-black"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-black text-white flex items-center justify-center shadow-inner">
              <TerminalSquare className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-900 leading-tight font-['Playfair_Display']">
                {app.name}
              </h1>
              <p className="text-[10px] text-neutral-400 font-black uppercase tracking-widest mt-1">
                {app.type === 'ai' ? 'AI GENERATED WORKSPACE' : 'MANUAL WORKSPACE'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleFullscreen}
            className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-neutral-50 hover:bg-neutral-100 border-2 border-neutral-100 hover:border-black rounded-xl text-xs font-bold text-neutral-600 hover:text-black transition-all cursor-pointer"
          >
            {isFullscreen ? (
              <>
                <Minimize className="w-4 h-4" /> Exit Focus
              </>
            ) : (
              <>
                <Maximize className="w-4 h-4" /> Focus Mode
              </>
            )}
          </button>
        </div>
      </div>

      {/* App Container */}
      <div
        className={`flex-1 bg-white relative overflow-hidden ${isFullscreen ? '' : 'rounded-b-2xl border-2 border-t-0 border-neutral-100'}`}
      >
        <iframe
          srcDoc={app.content}
          title={app.name}
          sandbox="allow-scripts allow-forms allow-modals allow-popups"
          className="w-full h-full border-none absolute inset-0 bg-white"
        />
      </div>
    </div>
  );
}
