'use client';

import {
  Server,
  Network,
  MessageCircle,
  Activity,
  BookOpen,
  Bot,
  Search,
  Plus,
  Settings,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useSmallClaw } from '@/context/SmallClawContext';
import dynamic from 'next/dynamic';
import { useState } from 'react';

// Dynamically import tab components to keep initial bundle small
const ProvidersTab = dynamic(() => import('./ProvidersTab'));
const AgentsTab = dynamic(() => import('./AgentsTab'));
const ChannelsTab = dynamic(() => import('./ChannelsTab'));
const McpTab = dynamic(() => import('./McpTab'));
const SkillsTab = dynamic(() => import('./SkillsTab'));
const AssistantTab = dynamic(() => import('./AssistantTab'));
const SettingsTab = dynamic(() => import('./SettingsTab'));

const tabs = [
  { id: 'agents', label: 'Agents', icon: Network },
  { id: 'providers', label: 'Providers', icon: Server },
  { id: 'channels', label: 'Channels', icon: MessageCircle },
  { id: 'mcp', label: 'MCP', icon: Activity },
  { id: 'skills', label: 'Skills', icon: BookOpen },
  { id: 'assistant', label: 'Assistant', icon: Bot },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const tabTitles = {
  agents: 'SmallClaw',
  providers: 'API Providers',
  channels: 'Communication Channels',
  mcp: 'MCP Infrastructure',
  skills: 'Agent Skills',
  assistant: 'Kiro Assistant',
  settings: 'System Configuration',
};

export default function SmallClawApp() {
  const { activeTab, setActiveTab, loading, searchQuery, setSearchQuery } = useSmallClaw();

  const renderTab = () => {
    switch (activeTab) {
      case 'agents':
        return <AgentsTab />;
      case 'providers':
        return <ProvidersTab />;
      case 'channels':
        return <ChannelsTab />;
      case 'mcp':
        return <McpTab />;
      case 'skills':
        return <SkillsTab />;
      case 'assistant':
        return <AssistantTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <ProvidersTab />;
    }
  };

  const headerActions = (
    <div className="flex items-center gap-4">
      <div className="relative hidden md:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search..."
          className="bg-white border border-[#e5e3d8] rounded-full py-1.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#1f644e] w-48 lg:w-64"
        />
      </div>
    </div>
  );

  return (
    <AppLayout
      appName="SmallClaw"
      appLogo={<span className="text-2xl mr-2">🦞</span>}
      tabs={tabs}
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      tabTitles={tabTitles}
      headerActions={headerActions}
    >
      <div className="p-4 lg:p-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#1f644e] border-t-transparent"></div>
            <p className="mt-4 text-neutral-500 font-medium">Bootstrapping SmallClaw...</p>
          </div>
        ) : (
          renderTab()
        )}
      </div>
    </AppLayout>
  );
}
