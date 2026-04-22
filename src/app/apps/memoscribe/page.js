'use client';

import React from 'react';
import { MemoscribeProvider, useMemoscribe } from '@/context/MemoscribeContext';
import { FileText, MessageCircle, Settings as SettingsIcon } from 'lucide-react';
import NotesTab from '@/components/memoscribe/NotesTab';
import ChatTab from '@/components/memoscribe/ChatTab';
import SettingsTab from '@/components/memoscribe/SettingsTab';
import AppLayout from '@/components/layout/AppLayout';

const tabs = [
  { id: 'notes', label: 'Clips', icon: FileText },
  { id: 'chat', label: 'Chat', icon: MessageCircle },
  { id: 'settings', label: 'Settings', icon: SettingsIcon },
];

function MemoscribeContent() {
  const { activeTab, setActiveTab } = useMemoscribe();

  return (
    <AppLayout
      appName="Memo Scribe"
      tabs={tabs}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
    >
      <div className="p-4 lg:p-6 max-w-6xl mx-auto">
        {activeTab === 'notes' && <NotesTab />}
        {activeTab === 'chat' && <ChatTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </AppLayout>
  );
}

export default function MemoMemoscribePage() {
  return (
    <MemoscribeProvider>
      <MemoscribeContent />
    </MemoscribeProvider>
  );
}
