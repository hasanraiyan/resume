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
import {
  AccountsSkeleton,
  AnalysisSkeleton,
  CategoriesSkeleton,
  ChatSkeleton,
  RecordsSkeleton,
  Shimmer,
} from '@/components/pocketly-tracker/FinanceSkeletons';
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

const AccountsTab = dynamic(() => import('@/components/pocketly-tracker/AccountsTab'), {
  loading: () => <AccountsSkeleton />,
});
const CategoriesTab = dynamic(() => import('@/components/pocketly-tracker/CategoriesTab'), {
  loading: () => <CategoriesSkeleton />,
});
const AnalysisTab = dynamic(() => import('@/components/pocketly-tracker/AnalysisTab'), {
  loading: () => <AnalysisSkeleton />,
});
const ChatTab = dynamic(() => import('@/components/pocketly-tracker/ChatTab'), {
  loading: () => <ChatSkeleton />,
});
const FinanceSettingsTab = dynamic(
  () => import('@/components/pocketly-tracker/FinanceSettingsTab'),
  {
    loading: () => (
      <div className="p-6 space-y-6">
        <Shimmer className="h-32 w-full rounded-3xl" />
        <Shimmer className="h-28 w-full rounded-3xl" />
        <Shimmer className="h-32 w-full rounded-3xl" />
      </div>
    ),
  }
);

const tabs = [
  { id: 'records', label: 'Records', icon: Receipt },
  { id: 'analysis', label: 'Analysis', icon: BarChart3 },
  { id: 'accounts', label: 'Accounts', icon: Wallet },
  { id: 'categories', label: 'Categories', icon: Tag },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function PocketlyNavigation({ tabs, activeTab, setActiveTab }) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#e5e3d8] fixed inset-y-0 left-0 z-30">
        <div className="p-6 border-b border-[#e5e3d8]">
          <div className="flex items-center gap-2">
            <Image
              src="/images/apps/pocketly.png"
              alt="Pocketly app logo"
              width={28}
              height={28}
              className="rounded-xl shadow-sm"
              priority
            />
            <h1 className="font-[family-name:var(--font-logo)] text-2xl text-black ">Pocketly</h1>
          </div>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
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
        <div className="p-4 border-t border-[#e5e3d8]">
          <p className="text-[10px] text-[#7c8e88] text-center">Powered by Pocketly</p>
        </div>
      </aside>

      {/* Mobile Bottom Nav (without Settings tab) */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#fcfbf5] border-t border-[#e5e3d8] z-30 flex"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        {tabs
          .filter((tab) => tab.id !== 'settings')
          .map((tab) => (
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
    </>
  );
}

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

  const bootstrapSkeletonByTab = {
    records: <RecordsSkeleton />,
    accounts: <AccountsSkeleton />,
    categories: <CategoriesSkeleton />,
    analysis: <AnalysisSkeleton />,
  };
  const activeBootstrapSkeleton = bootstrapSkeletonByTab[activeTab] || null;

  useEffect(() => {
    if (!(activeBootstrapSkeleton && isBootstrapLoading)) {
      setShowDelayedBootstrapSkeleton(false);
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setShowDelayedBootstrapSkeleton(true);
    }, 200);

    return () => window.clearTimeout(timer);
  }, [activeBootstrapSkeleton, isBootstrapLoading]);

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

  const tabTitles = {
    records: 'Records',
    analysis: 'Analysis',
    accounts: 'Accounts',
    categories: 'Categories',
    chat: 'Chat',
    settings: 'Settings',
  };

  const hasBootstrappedData =
    transactions.length > 0 || accounts.length > 0 || categories.length > 0;
  const shouldShowBootstrapSkeleton =
    Boolean(activeBootstrapSkeleton) &&
    isBootstrapLoading &&
    !hasBootstrappedData &&
    showDelayedBootstrapSkeleton;
  const shouldHoldBootstrapFrame =
    Boolean(activeBootstrapSkeleton) &&
    isBootstrapLoading &&
    !hasBootstrappedData &&
    !showDelayedBootstrapSkeleton;

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
  };

  return (
    <div className="min-h-screen bg-[#fcfbf5] font-[family-name:var(--font-sans)] text-[#1e3a34] flex">
      <PocketlyNavigation tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col lg:ml-64 min-h-screen overflow-x-hidden pb-20 lg:pb-0 pt-14 lg:pt-0">
        {/* Header */}
        <header className="lg:sticky lg:top-0 fixed top-0 left-0 right-0 z-50 bg-[#fcfbf5] border-b border-[#e5e3d8]">
          <div className="w-full px-4 lg:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 lg:hidden">
                <Image
                  src="/images/apps/pocketly.png"
                  alt="Pocketly app logo"
                  width={24}
                  height={24}
                  className="rounded-lg shadow-sm"
                  priority
                />
                <h1 className="font-[family-name:var(--font-logo)] text-xl lg:text-2xl text-black">
                  Pocketly
                </h1>
              </div>
              <h1 className="hidden lg:block text-lg font-bold text-[#1e3a34]">
                {tabTitles[activeTab]}
              </h1>
            </div>
            <div className="flex items-center gap-3">
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
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="min-w-0 flex-1 w-full overflow-x-hidden">
          {shouldShowBootstrapSkeleton ? (
            activeBootstrapSkeleton
          ) : shouldHoldBootstrapFrame ? (
            <div className="min-h-[60vh]" />
          ) : (
            renderTab()
          )}
        </main>
      </div>

      {/* FAB / Edit Modal */}
      {(accounts.length > 0 && activeTab !== 'settings' && activeTab !== 'chat') ||
      editTransactionData ? (
        <AddTransactionModal />
      ) : null}
    </div>
  );
}

export default function FinancePage() {
  return (
    <SessionProvider>
      <MoneyProvider>
        <FinanceChatProvider>
          <FinanceContent />
        </FinanceChatProvider>
      </MoneyProvider>
    </SessionProvider>
  );
}
