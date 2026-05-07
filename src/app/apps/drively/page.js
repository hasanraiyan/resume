'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Pacifico, Nunito } from 'next/font/google';
import {
  HardDrive,
  Clock,
  Star,
  Trash2,
  PieChart,
  Plus,
  Upload,
  FolderPlus,
  ChevronRight,
  MoreVertical,
  Search,
  File,
  Folder,
  ArrowLeft,
} from 'lucide-react';
import { DrivelyProvider, useDrively } from '@/context/DrivelyContext';
import MyDriveTab from '@/components/drively/MyDriveTab';
import RecentTab from '@/components/drively/RecentTab';
import StarredTab from '@/components/drively/StarredTab';
import TrashTab from '@/components/drively/TrashTab';
import StorageTab from '@/components/drively/StorageTab';

const pacifico = Pacifico({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-logo',
  display: 'swap',
});

const nunito = Nunito({
  weight: ['400', '600', '700', '800'],
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

function DrivelyApp() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('mydrive');
  const { trashCount } = useDrively();

  if (status === 'loading') return null;
  if (status === 'unauthenticated' || session?.user?.role !== 'admin') {
    router.push('/login');
    return null;
  }

  const tabs = [
    { id: 'mydrive', label: 'My Drive', icon: HardDrive },
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'starred', label: 'Starred', icon: Star },
    { id: 'trash', label: 'Trash', icon: Trash2, badge: trashCount },
    { id: 'storage', label: 'Storage', icon: PieChart },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case 'mydrive':
        return <MyDriveTab />;
      case 'recent':
        return <RecentTab />;
      case 'starred':
        return <StarredTab />;
      case 'trash':
        return <TrashTab />;
      case 'storage':
        return <StorageTab />;
      default:
        return <MyDriveTab />;
    }
  };

  return (
    <div
      className={`min-h-screen bg-[#fcfbf5] font-[family-name:var(--font-sans)] text-[#1e3a34] flex ${pacifico.variable} ${nunito.variable}`}
    >
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#e5e3d8] fixed inset-y-0 left-0 z-30">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-8 w-8 bg-[#1f644e] rounded-lg flex items-center justify-center">
              <HardDrive className="text-white w-5 h-5" />
            </div>
            <span className="font-[family-name:var(--font-logo)] text-2xl">Drively</span>
          </div>

          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full cursor-pointer flex items-center justify-between px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#1f644e] text-white'
                    : 'text-[#7c8e88] hover:bg-[#f0f5f2] hover:text-[#1e3a34]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <tab.icon className="w-5 h-5" strokeWidth={activeTab === tab.id ? 2 : 1.5} />
                  {tab.label}
                </div>
                {tab.badge > 0 && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === tab.id ? 'bg-white text-[#1f644e]' : 'bg-[#e5e3d8] text-[#1e3a34]'}`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col lg:ml-64 min-h-screen overflow-x-hidden pb-20 lg:pb-0">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-[#fcfbf5]/80 backdrop-blur-md border-b border-[#e5e3d8] px-4 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.push('/apps')}
              className="lg:hidden p-2 hover:bg-[#e5e3d8] rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold lg:text-xl">
              {tabs.find((t) => t.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7c8e88]" />
              <input
                type="text"
                placeholder="Search files..."
                className="pl-9 pr-4 py-2 rounded-xl border border-[#e5e3d8] bg-white text-sm outline-none focus:border-[#1f644e] w-64"
              />
            </div>
            <div className="h-8 w-8 rounded-full bg-[#1f644e] flex items-center justify-center text-white text-xs font-bold">
              {session?.user?.name?.[0] || 'A'}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-6xl mx-auto w-full">{renderTab()}</main>
      </div>

      {/* Mobile Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5e3d8] z-40 flex items-center justify-around py-2 px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              activeTab === tab.id ? 'text-[#1f644e]' : 'text-[#7c8e88]'
            }`}
          >
            <div className="relative">
              <tab.icon className="w-6 h-6" strokeWidth={activeTab === tab.id ? 2 : 1.5} />
              {tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#c94c4c] text-white text-[8px] font-bold px-1 rounded-full border border-white">
                  {tab.badge}
                </span>
              )}
            </div>
            <span className="text-[10px] font-bold">{tab.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}

export default function DrivelyPage() {
  return (
    <DrivelyProvider>
      <DrivelyApp />
    </DrivelyProvider>
  );
}
