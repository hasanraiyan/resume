'use client';

import { MoneyProvider, useMoney } from '@/context/MoneyContext';
import { FinanceChatProvider } from '@/context/FinanceChatContext';
import RecordsTab from '@/components/finance-tracker/RecordsTab';
import AccountsTab from '@/components/finance-tracker/AccountsTab';
import CategoriesTab from '@/components/finance-tracker/CategoriesTab';
import AnalysisTab from '@/components/finance-tracker/AnalysisTab';
import BudgetsTab from '@/components/finance-tracker/BudgetsTab';
import AddTransactionModal from '@/components/finance-tracker/AddTransactionModal';
import ChatTab from '@/components/finance-tracker/ChatTab';
import FinanceSettingsTab from '@/components/finance-tracker/FinanceSettingsTab';
import {
  Receipt,
  BarChart3,
  Wallet,
  Tag,
  Calculator,
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

const tabs = [
  { id: 'records', label: 'Records', icon: Receipt },
  { id: 'analysis', label: 'Analysis', icon: BarChart3 },
  { id: 'budgets', label: 'Budgets', icon: Calculator },
  { id: 'accounts', label: 'Accounts', icon: Wallet },
  { id: 'categories', label: 'Categories', icon: Tag },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function FinanceContent() {
  const { activeTab, setActiveTab, isSyncing, error, accounts, fetchData } = useMoney();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [requestAddAccountModal, setRequestAddAccountModal] = useState(false);
  const handleAddModalClose = useCallback(() => setRequestAddAccountModal(false), []);

  const tabTitles = {
    records: 'Records',
    analysis: 'Analysis',
    budgets: 'Budgets',
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
          <p className="text-sm text-[#7c8e88] mb-4 text-center">{error}</p>
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
      case 'budgets':
        return <BudgetsTab />;
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
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#e5e3d8] fixed inset-y-0 left-0 z-30">
        <div className="p-6 border-b border-[#e5e3d8]">
          <h1 className="font-[family-name:var(--font-logo)] text-2xl text-[#1f644e]">MyMoney</h1>
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
        <div className="p-4 border-t border-[#e5e3d8]">
          <p className="text-[10px] text-[#7c8e88] text-center">Powered by MyMoney</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-[#fcfbf5] sticky top-0 z-20 border-b border-[#e5e3d8]/50">
          <div className="w-full px-4 lg:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-1" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5 text-[#1e3a34]" />
              </button>
              <h1 className="font-[family-name:var(--font-logo)] text-xl lg:text-2xl text-[#1f644e] lg:hidden">
                MyMoney
              </h1>
              <h1 className="hidden lg:block text-lg font-bold text-[#1e3a34]">
                {tabTitles[activeTab]}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              {isSyncing && (
                <div className="flex items-center gap-1.5 text-xs text-[#7c8e88]">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Syncing...</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 w-full">{renderTab()}</main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white shadow-xl animate-in slide-in-from-left duration-300">
            <div className="p-6 border-b border-[#e5e3d8]">
              <h1 className="font-[family-name:var(--font-logo)] text-2xl text-[#1f644e]">
                MyMoney
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

      {/* FAB */}
      {accounts.length > 0 && activeTab !== 'settings' && activeTab !== 'chat' && (
        <AddTransactionModal />
      )}

      {/* Mobile Bottom Nav */}
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

export default function FinancePage() {
  return (
    <MoneyProvider>
      <FinanceChatProvider>
        <FinanceContent />
      </FinanceChatProvider>
    </MoneyProvider>
  );
}
