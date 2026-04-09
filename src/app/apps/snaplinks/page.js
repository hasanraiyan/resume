'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { LayoutDashboard, Link2, BarChart3, Settings, Menu } from 'lucide-react';
import SessionProvider from '@/components/SessionProvider';

const DashboardTab = dynamic(() => import('@/components/snaplinks/DashboardTab'), {
  loading: () => <div className="p-6">Loading Dashboard...</div>,
});
const ManageLinksTab = dynamic(() => import('@/components/snaplinks/ManageLinksTab'), {
  loading: () => <div className="p-6">Loading Links...</div>,
});
const SettingsTab = dynamic(() => import('@/components/snaplinks/SettingsTab'), {
  loading: () => <div className="p-6">Loading Settings...</div>,
});

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'manage', label: 'Manage Links', icon: Link2 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function SnapLinksContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'admin') {
      router.push('/login?callbackUrl=/snaplinks');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fcfbf5]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#1f644e] border-t-transparent mx-auto"></div>
          <p className="mt-4 text-[#7c8e88] font-medium">Loading SnapLinks...</p>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== 'admin') {
    return null;
  }

  const tabTitles = {
    dashboard: 'Dashboard',
    manage: 'Manage Links',
    settings: 'Settings',
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab navigateTo={setActiveTab} />;
      case 'manage':
        return <ManageLinksTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <DashboardTab navigateTo={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfbf5] font-[family-name:var(--font-sans)] text-[#1e3a34] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#e5e3d8] fixed inset-y-0 left-0 z-30">
        <div className="p-6 border-b border-[#e5e3d8]">
          <h1 className="font-[family-name:var(--font-logo)] text-2xl text-[#1f644e] flex items-center gap-2">
            <img src="/images/apps/Snaplinks.png" alt="SnapLinks" className="h-8 w-auto" />
            SnapLinks
          </h1>
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

      {/* Main Content Area */}
      <div className="flex min-w-0 flex-1 flex-col lg:ml-64 min-h-screen overflow-x-hidden">
        {/* Header */}
        <header className="bg-[#fcfbf5] fixed top-0 left-0 lg:left-64 right-0 z-40 border-b border-[#e5e3d8]/50">
          <div className="w-full px-4 lg:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="font-[family-name:var(--font-logo)] text-xl lg:text-2xl text-[#1f644e] lg:hidden flex items-center gap-2">
                <img src="/images/apps/Snaplinks.png" alt="SnapLinks" className="h-6 w-auto" />
                SnapLinks
              </h1>
              <h1 className="hidden lg:block text-lg font-bold text-[#1e3a34]">
                {tabTitles[activeTab]}
              </h1>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="min-w-0 flex-1 w-full overflow-x-hidden pt-12 lg:pt-0 pb-20 lg:pb-0">
          {renderTab()}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#fcfbf5] border-t border-[#e5e3d8] z-30 flex pb-safe">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center py-3 min-h-[60px] ${
              activeTab === tab.id ? 'text-[#1f644e]' : 'text-[#4a5c56] hover:text-[#1e3a34]'
            }`}
          >
            <tab.icon className="w-6 h-6 mb-1" strokeWidth={activeTab === tab.id ? 2.5 : 2} />
            <span
              className={`text-[10px] ${activeTab === tab.id ? 'font-extrabold' : 'font-bold'}`}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default function SnapLinksPage() {
  return (
    <SessionProvider>
      <SnapLinksContent />
    </SessionProvider>
  );
}
