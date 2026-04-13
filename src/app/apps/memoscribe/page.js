'use client';

import React from 'react';
import { MemoscribeProvider, useMemoscribe } from '@/context/MemoscribeContext';
import { FileText, MessageCircle, Settings as SettingsIcon } from 'lucide-react';
import NotesTab from '@/components/memoscribe/NotesTab';
import ChatTab from '@/components/memoscribe/ChatTab';
import SettingsTab from '@/components/memoscribe/SettingsTab';
import AppHeader from '@/components/memoscribe/AppHeader';

const tabs = [
  { id: 'notes', label: 'Clips', icon: FileText },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

function MemoscribeContent() {
  const { activeTab, setActiveTab } = useMemoscribe();

  return (
    <div className="min-h-screen bg-[#fcfbf5] font-[family-name:var(--font-sans)] text-[#1e3a34] flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-[#e5e3d8] fixed inset-y-0 left-0 z-30">
        <div className="p-6">
          <h1 className="font-[family-name:var(--font-logo)] text-2xl text-[#1f644e]">
            Memo Scribe
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
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

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col lg:ml-64 min-h-screen overflow-x-hidden pb-20 lg:pb-0 pt-14 lg:pt-0">
        <AppHeader />

        {/* Main Area */}
        <main className="min-w-0 flex-1 w-full overflow-x-hidden p-4 lg:p-6 max-w-6xl mx-auto">
          {activeTab === 'notes' && <NotesTab />}
          {activeTab === 'chat' && <ChatTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[#fcfbf5] border-t border-[#e5e3d8] z-30 flex">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex flex-col items-center py-2 cursor-pointer ${
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

export default function MemoMemoscribePage() {
  return (
    <MemoscribeProvider>
      <MemoscribeContent />
    </MemoscribeProvider>
  );
}
