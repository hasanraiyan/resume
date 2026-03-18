'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button, Skeleton } from '@/components/ui';
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
      className={`flex flex-col animate-in fade-in duration-300 ${isFullscreen ? 'fixed inset-0 z-50 bg-neutral-100' : 'max-w-7xl mx-auto h-[calc(100vh-120px)]'}`}
    >
      {/* Header Toolbar */}
      <div
        className={`flex items-center justify-between border-b border-neutral-200 bg-white px-6 py-4 shrink-0 shadow-sm ${isFullscreen ? '' : 'rounded-t-2xl'}`}
      >
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/apps')}
            className="rounded-full p-2 h-10 w-10 shrink-0 hover:bg-neutral-100"
          >
            <ArrowLeft className="w-5 h-5 text-neutral-600" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-inner">
              <TerminalSquare className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-neutral-900 leading-tight">{app.name}</h1>
              <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                {app.type === 'ai' ? 'AI Generated App' : 'Manual App'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={toggleFullscreen}
            className="hidden sm:flex items-center gap-2"
            size="small"
          >
            {isFullscreen ? (
              <>
                <Minimize className="w-4 h-4" /> Exit Fullscreen
              </>
            ) : (
              <>
                <Maximize className="w-4 h-4" /> Fullscreen
              </>
            )}
          </Button>
        </div>
      </div>

      {/* App Container */}
      <div
        className={`flex-1 bg-white relative overflow-hidden ${isFullscreen ? '' : 'rounded-b-2xl shadow-xl border border-t-0 border-neutral-200'}`}
      >
        <iframe
          srcDoc={app.content}
          title={app.name}
          sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
          className="w-full h-full border-none absolute inset-0 bg-white"
        />
      </div>
    </div>
  );
}
