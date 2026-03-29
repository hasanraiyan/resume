'use client';

import { MoneyProvider, useMoney } from '@/context/MoneyContext';
import RecordsTab from '@/components/finance-tracker/RecordsTab';
import AccountsTab from '@/components/finance-tracker/AccountsTab';
import CategoriesTab from '@/components/finance-tracker/CategoriesTab';
import AnalysisTab from '@/components/finance-tracker/AnalysisTab';
import BudgetsTab from '@/components/finance-tracker/BudgetsTab';
import AddTransactionModal from '@/components/finance-tracker/AddTransactionModal';
import { Receipt, BarChart3, Wallet, Tag, Calculator, Menu, Search, Plus } from 'lucide-react';
import { useState } from 'react';

const tabs = [
  { id: 'records', label: 'Records', icon: Receipt },
  { id: 'analysis', label: 'Analysis', icon: BarChart3 },
  { id: 'budgets', label: 'Budgets', icon: Calculator },
  { id: 'accounts', label: 'Accounts', icon: Wallet },
  { id: 'categories', label: 'Categories', icon: Tag },
];

function FinanceContent() {
  const { activeTab, setActiveTab, isLoading, accounts, seedData } = useMoney();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSeed = async () => {
    await seedData();
  };

  const tabTitles = {
    records: 'Records',
    analysis: 'Analysis',
    budgets: 'Budgets',
    accounts: 'Accounts',
    categories: 'Categories',
  };

  const renderTab = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-[3px] border-[#1f644e] border-t-transparent rounded-full animate-spin" />
        </div>
      );
    }

    if (accounts.length === 0) {
      return (
        <div className="text-center py-20 px-6">
          <div className="w-20 h-20 rounded-full bg-[#e8f0ec] flex items-center justify-center mx-auto mb-5">
            <Wallet className="w-10 h-10 text-[#1f644e]" />
          </div>
          <h3 className="text-xl font-bold mb-2 font-[family-name:var(--font-logo)]">
            Welcome to MyMoney
          </h3>
          <p className="text-sm text-[#7c8e88] mb-8 max-w-xs mx-auto">
            Get started by loading sample data to explore all features.
          </p>
          <button
            onClick={handleSeed}
            className="px-8 py-3 bg-[#1f644e] text-white text-sm font-bold rounded-lg hover:bg-[#17503e] transition-colors shadow-md"
          >
            Load Sample Data
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
        return <AccountsTab />;
      case 'categories':
        return <CategoriesTab />;
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
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
          <div className="max-w-4xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
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
            <button className="p-1">
              <Search className="w-5 h-5 text-[#1e3a34]" />
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 max-w-4xl mx-auto w-full">{renderTab()}</main>
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
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-bold transition-all ${
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
      {accounts.length > 0 && <AddTransactionModal />}

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

export default function FinanceTrackerPage() {
  return (
    <MoneyProvider>
      <FinanceContent />
    </MoneyProvider>
  );
}
