'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Pacifico, Nunito } from 'next/font/google';
import {
  HardDrive,
  Clock,
  Star,
  Trash2,
  PieChart,
  Search,
  ArrowLeft,
  X,
  Activity,
  ChevronLeft,
} from 'lucide-react';
import { DrivelyProvider, useDrively } from '@/context/DrivelyContext';
import MyDriveTab from '@/components/drively/MyDriveTab';
import RecentTab from '@/components/drively/RecentTab';
import StarredTab from '@/components/drively/StarredTab';
import TrashTab from '@/components/drively/TrashTab';
import StorageTab from '@/components/drively/StorageTab';
import BulkActionToolbar from '@/components/drively/BulkActionToolbar';
import FilePreviewPanel from '@/components/drively/FilePreviewPanel';
import SearchResults from '@/components/drively/SearchResults';
import ActivityFeed from '@/components/drively/ActivityFeed';
import ErrorBoundary from '@/components/drively/ErrorBoundary';
import RenameModal from '@/components/drively/RenameModal';
import debounce from 'lodash.debounce';

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
  const {
    trashCount,
    searchQuery,
    setSearchQuery,
    previewFile,
    setPreviewFile,
    activity,
    renameTarget,
    setRenameTarget,
    updateItem,
  } = useDrively();

  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showActivity, setShowActivity] = useState(false);

  const performSearch = useCallback(
    debounce(async (query) => {
      if (!query.trim()) {
        setSearchResults(null);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(`/api/drively/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        if (data.success) {
          setSearchResults({ files: data.files, folders: data.folders });
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    performSearch(searchQuery);
  }, [searchQuery, performSearch]);

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

  const renderContent = () => {
    if (searchQuery) {
      return (
        <SearchResults
          results={searchResults || { files: [], folders: [] }}
          query={searchQuery}
          onClear={() => setSearchQuery('')}
        />
      );
    }

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
                onClick={() => {
                  setActiveTab(tab.id);
                  setSearchQuery('');
                }}
                className={`w-full cursor-pointer flex items-center justify-between px-4 py-3 rounded-lg text-sm font-bold transition-all ${
                  activeTab === tab.id && !searchQuery
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
      <div
        className={`flex min-w-0 flex-1 flex-col lg:ml-64 min-h-screen overflow-x-hidden pb-20 lg:pb-0 transition-all ${showActivity ? 'lg:mr-80' : ''}`}
      >
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
              {searchQuery ? 'Search Results' : tabs.find((t) => t.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7c8e88]" />
              <input
                type="text"
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-10 py-2 rounded-xl border border-[#e5e3d8] bg-white text-sm outline-none focus:border-[#1f644e] w-64"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-4 h-4 text-[#7c8e88] hover:text-[#1e3a34]" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowActivity(!showActivity)}
              className={`p-2 rounded-xl border transition-colors hidden lg:flex ${showActivity ? 'bg-[#1f644e] border-[#1f644e] text-white' : 'bg-white border-[#e5e3d8] text-[#7c8e88] hover:border-[#1f644e] hover:text-[#1f644e]'}`}
            >
              <Activity className="w-5 h-5" />
            </button>
            <div className="h-8 w-8 rounded-full bg-[#1f644e] flex items-center justify-center text-white text-xs font-bold">
              {session?.user?.name?.[0] || 'A'}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8 max-w-6xl mx-auto w-full">
          <ErrorBoundary key={activeTab + searchQuery}>{renderContent()}</ErrorBoundary>
        </main>
      </div>

      {/* Desktop Activity Sidebar */}
      <aside
        className={`hidden lg:flex flex-col w-80 bg-white border-l border-[#e5e3d8] fixed inset-y-0 right-0 z-30 transition-transform duration-300 ${showActivity ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-6 h-full overflow-y-auto">
          <ActivityFeed activity={activity} />
        </div>
      </aside>

      {renameTarget && (
        <RenameModal
          type={renameTarget.type}
          item={renameTarget.item}
          onConfirm={async (newName) => {
            const payload =
              renameTarget.type === 'file' ? { filename: newName } : { name: newName };
            await updateItem(renameTarget.type, renameTarget.item._id, payload);
          }}
          onClose={() => setRenameTarget(null)}
        />
      )}

      {previewFile && (
        <>
          <div
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setPreviewFile(null)}
          />
          <FilePreviewPanel file={previewFile} onClose={() => setPreviewFile(null)} />
        </>
      )}

      {/* Mobile Nav */}
      <BulkActionToolbar />

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#e5e3d8] z-40 flex items-center justify-around py-2 px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setSearchQuery('');
            }}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
              activeTab === tab.id && !searchQuery ? 'text-[#1f644e]' : 'text-[#7c8e88]'
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
        <button
          onClick={() => {
            setActiveTab('activity');
            setSearchQuery('');
          }}
          className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
            activeTab === 'activity' ? 'text-[#1f644e]' : 'text-[#7c8e88]'
          }`}
        >
          <Activity className="w-6 h-6" strokeWidth={activeTab === 'activity' ? 2 : 1.5} />
          <span className="text-[10px] font-bold">Activity</span>
        </button>
      </nav>

      {activeTab === 'activity' && (
        <div className="lg:hidden fixed inset-0 bg-[#fcfbf5] z-[45] p-4 pt-20">
          <button
            onClick={() => setActiveTab('mydrive')}
            className="absolute top-4 left-4 p-2 bg-white border border-[#e5e3d8] rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <ActivityFeed activity={activity} />
        </div>
      )}
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
