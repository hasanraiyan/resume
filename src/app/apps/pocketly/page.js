'use client';

import Image from 'next/image';
import { MoneyProvider, useMoney } from '@/context/MoneyContext';
import { FinanceChatProvider, useFinanceChat } from '@/context/FinanceChatContext';
import AdminGuard from '@/components/AdminGuard';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import SessionProvider from '@/components/SessionProvider';
import RecordsTab from '@/components/pocketly-tracker/RecordsTab';
import AddTransactionModal from '@/components/pocketly-tracker/AddTransactionModal';
import { SkeletonProvider, SkeletonWrapper } from 'react-skeletonify';
import 'react-skeletonify/dist/index.css';
import {
  Receipt,
  BarChart3,
  Tag,
  Wallet,
  Plus,
  RefreshCw,
  AlertTriangle,
  Settings,
  Loader2,
  Target,
  ChevronLeft,
  ChevronRight,
  Search,
  X,
} from 'lucide-react';
import { ChatIcon } from '@/components/pocketly-tracker/IconRenderer';
import { useCallback, useState, useMemo } from 'react';
import AppLayout from '@/components/layout/AppLayout';

const PlanningTab = dynamic(() => import('@/components/pocketly-tracker/PlanningTab'));
const AccountsTab = dynamic(() => import('@/components/pocketly-tracker/AccountsTab'));
const AnalysisTab = dynamic(() => import('@/components/pocketly-tracker/AnalysisTab'));
const ChatTab = dynamic(() => import('@/components/pocketly-tracker/ChatTab'));
const FinanceSettingsTab = dynamic(
  () => import('@/components/pocketly-tracker/FinanceSettingsTab')
);

const tabs = [
  { id: 'records', label: 'Records', icon: Receipt },
  { id: 'analysis', label: 'Analysis', icon: BarChart3 },
  { id: 'accounts', label: 'Accounts', icon: Wallet },
  { id: 'planning', label: 'Planning', icon: Target },
  { id: 'chat', label: 'Chat', icon: ChatIcon },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function FinanceContent() {
  const {
    activeTab,
    setActiveTab,
    isSyncing,
    error,
    accounts,
    categories,
    transactions,
    fetchData,
    isBootstrapLoading,
    editTransactionData,
    periodStart,
    periodEnd,
    navigatePeriod,
    isTabLoading,
  } = useMoney();
  const { clearChat } = useFinanceChat();
  const [requestAddAccountModal, setRequestAddAccountModal] = useState(false);
  const [showDelayedBootstrapSkeleton, setShowDelayedBootstrapSkeleton] = useState(false);
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const handleAddModalClose = useCallback(() => setRequestAddAccountModal(false), []);

  const periodRangeLabel = useMemo(() => {
    const start = new Date(periodStart);
    const end = new Date(periodEnd);
    const opts = { month: 'short', day: 'numeric' };
    return `${start.toLocaleDateString('en-US', opts)} - ${end.toLocaleDateString('en-US', opts)}`;
  }, [periodEnd, periodStart]);

  useEffect(() => {
    if (!isBootstrapLoading) {
      setShowDelayedBootstrapSkeleton(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setShowDelayedBootstrapSkeleton(true);
    }, 200);

    return () => window.clearTimeout(timer);
  }, [isBootstrapLoading]);

  const hasBootstrappedData =
    transactions.length > 0 || accounts.length > 0 || categories.length > 0;

  const renderTab = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <div className="w-16 h-16 rounded-full bg-[#fef2f2] flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-[#c94c4c]" />
          </div>
          <p className="text-sm  text-[#a0a0a0] mb-4 text-center">{error}</p>
          <button
            onClick={fetchData}
            className="px-6 py-2.5 bg-[#1f644e] text-white text-sm font-bold rounded-lg hover:bg-[#17503e] transition-colors flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      );
    }

    const skeletonTabs = ['records', 'analysis', 'accounts', 'planning', 'chat', 'settings'];
    const shouldShowSkeleton =
      skeletonTabs.includes(activeTab) && isBootstrapLoading && showDelayedBootstrapSkeleton;

    const tabContent = (() => {
      switch (activeTab) {
        case 'records':
          return (
            <RecordsTab
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          );
        case 'analysis':
          return <AnalysisTab />;
        case 'accounts':
          return (
            <AccountsTab
              openAddModal={requestAddAccountModal}
              onAddModalClose={handleAddModalClose}
            />
          );
        case 'planning':
          return <PlanningTab />;
        case 'chat':
          return <ChatTab />;
        case 'settings':
          return <FinanceSettingsTab />;
        default:
          return (
            <RecordsTab
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          );
      }
    })();

    return <SkeletonWrapper loading={shouldShowSkeleton}>{tabContent}</SkeletonWrapper>;
  };

  const tabTitles = {
    records: 'Records',
    analysis: 'Analysis',
    accounts: 'Accounts',
    planning: 'Planning',
    chat: 'Chat',
    settings: 'Settings',
  };

  return (
    <AppLayout
      appName="Pocketly"
      appLogo="/images/apps/pocketly.png"
      tabs={tabs}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      tabTitles={tabTitles}
      hideSettingsFromMobileNav={true}
      headerActions={
        <>
          {activeTab === 'records' && (
            <div className="hidden lg:flex items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#7c8e88]" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-3 py-2 rounded-lg border border-[#e5e3d8] bg-white text-sm text-[#1e3a34] placeholder-[#a0a0a0] focus:outline-none focus:border-[#1f644e]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[#7c8e88] hover:text-[#1e3a34]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button
                onClick={() => navigatePeriod(-1)}
                disabled={isTabLoading}
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg transition hover:bg-[#f8f9f4] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
                aria-label="Previous week"
              >
                <ChevronLeft className="h-4 w-4 text-[#1e3a34]" />
              </button>
              <div className="min-w-[140px] text-center">
                <span className="text-sm font-bold text-[#1e3a34]">{periodRangeLabel}</span>
              </div>
              <button
                onClick={() => navigatePeriod(1)}
                disabled={isTabLoading}
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg transition hover:bg-[#f8f9f4] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
                aria-label="Next week"
              >
                <ChevronRight className="h-4 w-4 text-[#1e3a34]" />
              </button>
            </div>
          )}
          {activeTab === 'chat' && (
            <button
              onClick={clearChat}
              className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            >
              <ChatIcon className="w-3.5 h-3.5" strokeWidth={2} />
              New Chat
            </button>
          )}
          {isSyncing && (
            <div className="flex items-center gap-1.5 text-xs text-[#7c8e88]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Syncing...</span>
            </div>
          )}
          {/* Mobile Settings shortcut: move settings off bottom nav */}
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className="lg:hidden p-1.5 rounded-full text-[#7c8e88] hover:text-[#1e3a34] hover:bg-neutral-100 transition-colors"
            aria-label="Open settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </>
      }
      fab={
        (accounts.length > 0 && activeTab !== 'settings' && activeTab !== 'chat') ||
        editTransactionData ? (
          <AddTransactionModal />
        ) : null
      }
    >
      {!hasBootstrappedData && isBootstrapLoading && !showDelayedBootstrapSkeleton ? (
        <div className="min-h-[60vh]" />
      ) : (
        renderTab()
      )}
    </AppLayout>
  );
}

export default function FinancePage() {
  return (
    <SessionProvider>
      <AdminGuard appName="Pocketly">
        <MoneyProvider>
          <FinanceChatProvider>
            <SkeletonProvider
              config={{
                animation: 'animation-1',
                borderRadius: '8px',
                animationSpeed: 2,
                exceptTags: ['img', 'button', 'svg'],
                background: '#e5e3d8',
              }}
            >
              <FinanceContent />
            </SkeletonProvider>
          </FinanceChatProvider>
        </MoneyProvider>
      </AdminGuard>
    </SessionProvider>
  );
}
