'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import SessionProvider from '@/components/SessionProvider';
import { TasklyProvider, useTaskly } from '@/context/TasklyContext';
import { TasklyChatProvider, useTasklyChat } from '@/context/TasklyChatContext';
import { TasklyTabSkeleton, ChatSkeleton } from '@/components/taskly/TasklySkeletons';
import AppLayout from '@/components/layout/AppLayout';
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
  MessageCircle,
  Plus,
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
const ChatTab = dynamic(() => import('@/components/taskly/ChatTab'), {
  loading: () => <ChatSkeleton />,
});

const tabs = [
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'projects', label: 'Projects', icon: FolderKanban },
  { id: 'board', label: 'Board', icon: LayoutGrid },
  { id: 'insights', label: 'Insights', icon: BarChart3 },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function TasklyContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { activeTab, setActiveTab, fetchBootstrap, isBootstrapLoading, error } = useTaskly();
  const { clearChat } = useTasklyChat();
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
    chat: 'Chat',
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
      case 'chat':
        return <ChatTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <TasksTab />;
    }
  };

  return (
    <AppLayout
      appName="Taskly"
      tabs={tabs}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      tabTitles={tabTitles}
      useHamburgerMenu={false} // Uses standard bottom nav
      headerActions={
        <>
          {activeTab === 'chat' && (
            <button
              onClick={clearChat}
              className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Chat
            </button>
          )}
          {isBootstrapLoading && (
            <div className="flex items-center gap-1.5 text-xs text-[#7c8e88]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Syncing...</span>
            </div>
          )}
        </>
      }
    >
      {renderTab()}
    </AppLayout>
  );
}

export default function TasklyPage() {
  return (
    <SessionProvider>
      <TasklyProvider>
        <TasklyChatProvider>
          <TasklyContent />
        </TasklyChatProvider>
      </TasklyProvider>
    </SessionProvider>
  );
}
