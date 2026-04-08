'use client';

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
  Menu,
  Search,
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

function FinanceContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { activeTab, setActiveTab, isSyncing, error, accounts, fetchData, isBootstrapLoading } =
    useMoney();
  const { clearChat } = useFinanceChat();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [requestAddAccountModal, setRequestAddAccountModal] = useState(false);
  const handleAddModalClose = useCallback(() => setRequestAddAccountModal(false), []);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/login');
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfbf5]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#1f644e] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-[#7c8e88] font-medium">Loading finance...</p>
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

  const renderTab = () => {
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-6">
          <div className="w-16 h-16 rounded-full bg-[#fef2f2] flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-[#c94c4c]" />
          </div>
          <p className="text-sm text-[#7c8e88] [#a0a0a0] mb-4 text-center">{error}</p>
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
    <div className="min-h-screen bg-[#fcfbf5] [#121212] font-[family-name:var(--font-sans)] text-[#1e3a34] [#e0e0e0] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white [#1e1e1e] border-r border-[#e5e3d8] [#333333] fixed inset-y-0 left-0 z-30">
        <div className="p-6 border-b border-[#e5e3d8] [#333333]">
          <h1 className="font-[family-name:var(--font-logo)] text-2xl text-black ">Pocketly</h1>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full cursor-pointer flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                activeTab === tab.id
                  ? 'bg-[#1f644e] text-white'
                  : 'text-[#7c8e88] [#a0a0a0] hover:bg-[#f0f5f2] :bg-[#2c3e3a] [#2c3e3a] hover:text-[#1e3a34] [#e0e0e0]'
              }`}
            >
              <tab.icon className="w-5 h-5" strokeWidth={activeTab === tab.id ? 2 : 1.5} />
              {tab.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-[#e5e3d8] [#333333]">
          <p className="text-[10px] text-[#7c8e88] [#a0a0a0] text-center">Powered by Pocketly</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col lg:ml-64 min-h-screen overflow-x-hidden">
        {/* Header */}
        <header className="bg-[#fcfbf5] [#121212] sticky top-0 z-20 border-b border-[#e5e3d8] [#333333]/50">
          <div className="w-full px-4 lg:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-1" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5 text-[#1e3a34] [#e0e0e0]" />
              </button>
              <h1 className="font-[family-name:var(--font-logo)] text-xl lg:text-2xl text-black lg:hidden">
                Pocketly
              </h1>
              <h1 className="hidden lg:block text-lg font-bold text-[#1e3a34] [#e0e0e0]">
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
                <div className="flex items-center gap-1.5 text-xs text-[#7c8e88] [#a0a0a0]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Syncing...</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="min-w-0 flex-1 w-full overflow-x-hidden">
          {isBootstrapLoading && activeTab === 'records' ? <RecordsSkeleton /> : renderTab()}
        </main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white [#1e1e1e] shadow-xl animate-in slide-in-from-left duration-300">
            <div className="p-6 border-b border-[#e5e3d8] [#333333]">
              <h1 className="font-[family-name:var(--font-logo)] text-2xl text-black ">Pocketly</h1>
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
                      : 'text-[#7c8e88] [#a0a0a0] hover:bg-[#f0f5f2] :bg-[#2c3e3a] [#2c3e3a]'
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

      {/* FAB */}
      {accounts.length > 0 && activeTab !== 'settings' && activeTab !== 'chat' && (
        <AddTransactionModal />
      )}

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#fcfbf5] [#121212] border-t border-[#e5e3d8] [#333333] z-30 flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center py-2 ${
              activeTab === tab.id ? 'text-[#1f644e]' : 'text-[#7c8e88] [#a0a0a0]'
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
