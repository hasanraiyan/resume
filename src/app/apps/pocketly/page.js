'use client';

import Image from 'next/image';
import { MoneyProvider, useMoney } from '@/context/MoneyContext';
import { FinanceChatProvider, useFinanceChat } from '@/context/FinanceChatContext';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
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
  MessageCircle,
} from 'lucide-react';
import { useCallback, useState } from 'react';
import AppLayout from '@/components/layout/AppLayout';

const AccountsTab = dynamic(() => import('@/components/pocketly-tracker/AccountsTab'));
const CategoriesTab = dynamic(() => import('@/components/pocketly-tracker/CategoriesTab'));
const AnalysisTab = dynamic(() => import('@/components/pocketly-tracker/AnalysisTab'));
const ChatTab = dynamic(() => import('@/components/pocketly-tracker/ChatTab'));
const FinanceSettingsTab = dynamic(
  () => import('@/components/pocketly-tracker/FinanceSettingsTab')
);

const tabs = [
  { id: 'records', label: 'Records', icon: Receipt },
  { id: 'analysis', label: 'Analysis', icon: BarChart3 },
  { id: 'accounts', label: 'Accounts', icon: Wallet },
  { id: 'categories', label: 'Categories', icon: Tag },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function FinanceContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
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
  } = useMoney();
  const { clearChat } = useFinanceChat();
  const [requestAddAccountModal, setRequestAddAccountModal] = useState(false);
  const [showDelayedBootstrapSkeleton, setShowDelayedBootstrapSkeleton] = useState(false);
  const handleAddModalClose = useCallback(() => setRequestAddAccountModal(false), []);

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

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/login');
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfbf5]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#1f644e] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-[#7c8e88] font-medium">Loading Pocketly...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

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

    const skeletonTabs = ['records', 'analysis', 'accounts', 'categories', 'chat', 'settings'];
    const shouldShowSkeleton =
      skeletonTabs.includes(activeTab) && isBootstrapLoading && showDelayedBootstrapSkeleton;

    const tabContent = (() => {
      switch (activeTab) {
        case 'records':
          return <RecordsTab />;
        case 'analysis':
          return <AnalysisTab />;
        case 'accounts':
          return (
            <AccountsTab
              openAddModal={requestAddAccountModal}
              onAddModalClose={handleAddModalClose}
            />
          );
        case 'categories':
          return <CategoriesTab />;
        case 'chat':
          return <ChatTab />;
        case 'settings':
          return <FinanceSettingsTab />;
        default:
          return <RecordsTab />;
      }
    })();

    return <SkeletonWrapper loading={shouldShowSkeleton}>{tabContent}</SkeletonWrapper>;
  };

  const tabTitles = {
    records: 'Records',
    analysis: 'Analysis',
    accounts: 'Accounts',
    categories: 'Categories',
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
          {activeTab === 'chat' && (
            <button
              onClick={clearChat}
              className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
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
    </SessionProvider>
  );
}
