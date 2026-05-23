'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { LayoutDashboard, Link2, Settings } from 'lucide-react';
import SessionProvider from '@/components/SessionProvider';
import AppLayout from '@/components/layout/AppLayout';
import AdminGuard from '@/components/AdminGuard';

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
  const [activeTab, setActiveTab] = useState('dashboard');

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
      <div className="pt-2 lg:pt-6 pb-20 lg:pb-0">{renderTab()}</div>
    </AppLayout>
  );
}

export default function SnapLinksPage() {
  return (
    <SessionProvider>
      <AdminGuard appName="SnapLinks">
        <SnapLinksContent />
      </AdminGuard>
    </SessionProvider>
  );
}
