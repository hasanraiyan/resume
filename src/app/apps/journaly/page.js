'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import SessionProvider from '@/components/SessionProvider';
import { JournalyProvider, useJournaly } from '@/context/JournalyContext';
import { JournalyChatProvider, useJournalyChat } from '@/context/JournalyChatContext';
import AppLayout from '@/components/layout/AppLayout';
import { SkeletonProvider, SkeletonWrapper } from 'react-skeletonify';
import 'react-skeletonify/dist/index.css';
import {
  PenTool,
  Clock,
  Search,
  BarChart2,
  MessageCircle,
  Plus,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';

const JournalTab = dynamic(() => import('@/components/journaly/JournalTab'));
const TimelineTab = dynamic(() => import('@/components/journaly/TimelineTab'));
const SearchTab = dynamic(() => import('@/components/journaly/SearchTab'));
const InsightsTab = dynamic(() => import('@/components/journaly/InsightsTab'));
const ChatTab = dynamic(() => import('@/components/journaly/ChatTab'));

const tabs = [
  { id: 'journal', label: 'Journal', icon: PenTool },
  { id: 'timeline', label: 'Timeline', icon: Clock },
  { id: 'search', label: 'Search', icon: Search },
  { id: 'insights', label: 'Insights', icon: BarChart2 },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
];

const tabTitles = {
  journal: 'Journal',
  timeline: 'Timeline',
  search: 'Search',
  insights: 'Insights',
  chat: 'Chat',
};

function JournalyContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const {
    activeTab,
    setActiveTab,
    isLoading,
    error,
    isSyncing,
    fetchBootstrap,
  } = useJournaly();
  const { clearChat } = useJournalyChat();
  const [showDelayedSkeleton, setShowDelayedSkeleton] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login');
  }, [status, router]);

  useEffect(() => {
    if (!isLoading) {
      setShowDelayedSkeleton(false);
      return;
    }
    const timer = setTimeout(() => setShowDelayedSkeleton(true), 200);
    return () => clearTimeout(timer);
  }, [isLoading]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfbf5]">
        <Loader2 className="w-10 h-10 animate-spin text-[#1f644e]" />
      </div>
    );
  }

  if (!session) return null;

  const renderTab = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-20">
          <AlertTriangle className="w-12 h-12 text-[#c94c4c] mb-4" />
          <p className="text-[#7c8e88] mb-6">{error}</p>
          <button
            onClick={fetchBootstrap}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#1f644e] text-white font-bold rounded-xl hover:bg-[#17503e] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      );
    }

    const content = (() => {
      switch (activeTab) {
        case 'journal': return <JournalTab />;
        case 'timeline': return <TimelineTab />;
        case 'search': return <SearchTab />;
        case 'insights': return <InsightsTab />;
        case 'chat': return <ChatTab />;
        default: return <JournalTab />;
      }
    })();

    return (
      <SkeletonWrapper loading={isLoading && showDelayedSkeleton}>
        {content}
      </SkeletonWrapper>
    );
  };

  return (
    <AppLayout
      appName="Journaly"
      appLogo="/images/apps/journaly.png"
      tabs={tabs}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      tabTitles={tabTitles}
      headerActions={
        <div className="flex items-center gap-3">
          {activeTab === 'chat' && (
            <button
              onClick={clearChat}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[#7c8e88] hover:text-[#1e3a34] hover:bg-[#f0f5f2] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Chat
            </button>
          )}
          {isSyncing && (
            <div className="flex items-center gap-1.5 text-xs text-[#7c8e88]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Syncing...</span>
            </div>
          )}
        </div>
      }
    >
      {renderTab()}
    </AppLayout>
  );
}

export default function JournalyPage() {
  return (
    <SessionProvider>
      <JournalyProvider>
        <JournalyChatProvider>
          <SkeletonProvider
            config={{
              animation: 'animation-1',
              borderRadius: '12px',
              animationSpeed: 2,
              background: '#e5e3d8',
            }}
          >
            <JournalyContent />
          </SkeletonProvider>
        </JournalyChatProvider>
      </JournalyProvider>
    </SessionProvider>
  );
}
