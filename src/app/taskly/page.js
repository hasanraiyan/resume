'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import SessionProvider from '@/components/SessionProvider';
import { TasklyProvider, useTaskly } from '@/context/TasklyContext';
import { TasklyTabSkeleton } from '@/components/taskly/TasklySkeletons';
import {
  CheckSquare,
  FolderKanban,
  LayoutGrid,
  BarChart3,
  Settings,
  Menu,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

const TasksTab = dynamic(() => import('@/components/taskly/TasksTab'), {
  loading: () => <TasklyTabSkeleton />,
});
const ProjectsTab = dynamic(() => import('@/components/taskly/ProjectsTab'), {
  loading: () => <TasklyTabSkeleton />,
});
const BoardTab = dynamic(() => import('@/components/taskly/BoardTab'), {
  loading: () => <TasklyTabSkeleton />,
});
const InsightsTab = dynamic(() => import('@/components/taskly/InsightsTab'), {
  loading: () => <TasklyTabSkeleton />,
});
const SettingsTab = dynamic(() => import('@/components/taskly/SettingsTab'), {
  loading: () => <TasklyTabSkeleton />,
});

const tabs = [
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'board', label: 'Board', icon: LayoutGrid },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function TasklyContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { activeTab, setActiveTab, fetchBootstrap, isBootstrapLoading, error } = useTaskly();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'admin') {
      router.push('/login?callbackUrl=/taskly');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfbf5]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#1f644e] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-[#7c8e88] font-medium">Loading Taskly...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'admin') {
    return null;
  }

  const tabTitles = {
    tasks: 'Tasks',
    projects: 'Projects',
    board: 'Board',
    insights: 'Insights',
    settings: 'Settings',
  };

  const renderTab = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <div className="w-16 h-16 rounded-full bg-[#fef2f2] flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-[#c94c4c]" />
          </div>
          <p className="text-sm text-[#7c8e88] mb-4 text-center">{error}</p>
          <button
            onClick={fetchBootstrap}
            className="px-6 py-2.5 bg-[#1f644e] text-white text-sm font-bold rounded-lg hover:bg-[#17503e] transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      );
    }

    if (isBootstrapLoading) {
      return <TasklyTabSkeleton />;
    }

    switch (activeTab) {
      case 'tasks':
        return <TasksTab />;
      case 'projects':
        return <ProjectsTab />;
      case 'board':
        return <BoardTab />;
      case 'insights':
        return <InsightsTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <TasksTab />;
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfbf5] font-[family-name:var(--font-sans)] text-[#1e3a34] flex">
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#e5e3d8] fixed inset-y-0 left-0 z-30">
        <div className="p-6 border-b border-[#e5e3d8]">
          <h1 className="font-[family-name:var(--font-logo)] text-2xl text-[#1f644e]">Taskly</h1>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full cursor-pointer flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#1f644e] text-white'
                  : 'text-[#7c8e88] hover:bg-[#f0f5f2] hover:text-[#1e3a34]'
              }`}
            >
              <tab.icon className="w-5 h-5" strokeWidth={activeTab === tab.id ? 2 : 1.5} />
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:ml-64 min-h-screen overflow-x-hidden">
        <header className="bg-[#fcfbf5] sticky top-0 z-20 border-b border-[#e5e3d8]">
          <div className="w-full px-4 lg:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-1" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5 text-[#1e3a34]" />
              </button>
              <h1 className="font-[family-name:var(--font-logo)] text-xl text-[#1f644e] lg:hidden">
                Taskly
              </h1>
              <h1 className="hidden lg:block text-lg font-bold text-[#1e3a34]">
                {tabTitles[activeTab]}
              </h1>
            </div>
            {isBootstrapLoading && (
              <div className="flex items-center gap-1.5 text-xs text-[#7c8e88]">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Syncing...</span>
              </div>
            )}
          </div>
        </header>

        <main className="min-w-0 flex-1 w-full overflow-x-hidden">{renderTab()}</main>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl animate-in slide-in-from-left duration-300">
            <div className="p-6 border-b border-[#e5e3d8]">
              <h1 className="font-[family-name:var(--font-logo)] text-2xl text-[#1f644e]">
                Taskly
              </h1>
            </div>
            <nav className="py-4 px-3 space-y-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSidebarOpen(false);
                  }}
                  className={`w-full cursor-pointer flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#1f644e] text-white'
                      : 'text-[#7c8e88] hover:bg-[#f0f5f2]'
                  }`}
                >
                  <tab.icon className="w-5 h-5" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </aside>
        </div>
      )}

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#fcfbf5] border-t border-[#e5e3d8] z-30 flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center py-2 ${
              activeTab === tab.id ? 'text-[#1f644e]' : 'text-[#7c8e88]'
            }`}
          >
            <tab.icon
              className="w-[22px] h-[22px] mb-0.5"
              strokeWidth={activeTab === tab.id ? 2 : 1.5}
            />
            <span className="text-[10px] font-bold">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default function TasklyPage() {
  return (
    <SessionProvider>
      <TasklyProvider>
        <TasklyContent />
      </TasklyProvider>
    </SessionProvider>
  );
}
