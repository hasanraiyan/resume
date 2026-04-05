'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { LayoutDashboard, Link2, BarChart3, Settings, Menu } from 'lucide-react';
import { SessionProvider } from 'next-auth/react';

const DashboardTab = dynamic(() => import('@/components/snaplinks/DashboardTab'), {
  loading: () => <div className="p-6">Loading Dashboard...</div>,
});
const ManageLinksTab = dynamic(() => import('@/components/snaplinks/ManageLinksTab'), {
  loading: () => <div className="p-6">Loading Links...</div>,
});
const AnalyticsTab = dynamic(() => import('@/components/snaplinks/AnalyticsTab'), {
  loading: () => <div className="p-6">Loading Analytics...</div>,
});
const SettingsTab = dynamic(() => import('@/components/snaplinks/SettingsTab'), {
  loading: () => <div className="p-6">Loading Settings...</div>,
});

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'manage', label: 'Manage Links', icon: Link2 },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function SnapLinksContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    analytics: 'Analytics',
    settings: 'Settings',
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab navigateTo={setActiveTab} />;
      case 'manage':
        return <ManageLinksTab />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <DashboardTab navigateTo={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#fcfbf5] dark:bg-[#121212] font-[family-name:var(--font-sans)] text-[#1e3a34] dark:text-[#e0e0e0] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-[#1e1e1e] border-r border-[#e5e3d8] dark:border-[#333333] fixed inset-y-0 left-0 z-30">
        <div className="p-6 border-b border-[#e5e3d8] dark:border-[#333333]">
          <h1 className="font-[family-name:var(--font-logo)] text-2xl text-[#1f644e] dark:text-[#2ecc71]">
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
                  : 'text-[#7c8e88] dark:text-[#a0a0a0] hover:bg-[#f0f5f2] dark:hover:bg-[#2c3e3a] dark:bg-[#2c3e3a] hover:text-[#1e3a34] dark:text-[#e0e0e0]'
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
        <header className="bg-[#fcfbf5] dark:bg-[#121212] sticky top-0 z-20 border-b border-[#e5e3d8] dark:border-[#333333]/50">
          <div className="w-full px-4 lg:px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button className="lg:hidden p-1" onClick={() => setSidebarOpen(true)}>
                <Menu className="w-5 h-5 text-[#1e3a34] dark:text-[#e0e0e0]" />
              </button>
              <h1 className="font-[family-name:var(--font-logo)] text-xl lg:text-2xl text-[#1f644e] dark:text-[#2ecc71] lg:hidden">
                SnapLinks
              </h1>
              <h1 className="hidden lg:block text-lg font-bold text-[#1e3a34] dark:text-[#e0e0e0]">
                {tabTitles[activeTab]}
              </h1>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="min-w-0 flex-1 w-full overflow-x-hidden">{renderTab()}</main>
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 bg-white dark:bg-[#1e1e1e] shadow-xl animate-in slide-in-from-left duration-300">
            <div className="p-6 border-b border-[#e5e3d8] dark:border-[#333333]">
              <h1 className="font-[family-name:var(--font-logo)] text-2xl text-[#1f644e] dark:text-[#2ecc71]">
                SnapLinks
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
                      : 'text-[#7c8e88] dark:text-[#a0a0a0] hover:bg-[#f0f5f2] dark:hover:bg-[#2c3e3a] dark:bg-[#2c3e3a]'
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

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#fcfbf5] dark:bg-[#121212] border-t border-[#e5e3d8] dark:border-[#333333] z-30 flex pb-safe">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center py-2 ${
              activeTab === tab.id ? 'text-[#1f644e]' : 'text-[#7c8e88] dark:text-[#a0a0a0]'
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

export default function SnapLinksPage() {
  return (
    <SessionProvider>
      <SnapLinksContent />
    </SessionProvider>
  );
}
