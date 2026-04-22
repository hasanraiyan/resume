'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { LayoutDashboard, Link2, BarChart3, Settings, Menu } from 'lucide-react';
import SessionProvider from '@/components/SessionProvider';
import AppLayout from '@/components/layout/AppLayout';

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
    <AppLayout
      appName="SnapLinks"
      appLogo="/images/apps/Snaplinks.png"
      tabs={tabs}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      tabTitles={tabTitles}
    >
      <div className="pt-2 lg:pt-6 pb-20 lg:pb-0">
        {renderTab()}
      </div>
    </AppLayout>
  );
}

export default function SnapLinksPage() {
  return (
    <SessionProvider>
      <SnapLinksContent />
    </SessionProvider>
  );
}
