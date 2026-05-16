'use client';

import {
  Server,
  Network,
  MessageCircle,
  Activity,
  BookOpen,
  Bot,
  Search,
  Settings,
} from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useSmallClaw } from '@/context/SmallClawContext';
import { usePathname, useRouter } from 'next/navigation';

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

export default function SmallClawAppLayout({ children }) {
  const { searchQuery, setSearchQuery } = useSmallClaw();
  const pathname = usePathname();
  const router = useRouter();

  // Determine active tab based on pathname
  // e.g. /apps/smallclaw/agents -> agents
  const pathParts = pathname.split('/').filter(Boolean);
  const lastPart = pathParts[pathParts.length - 1];
  const activeTab = lastPart === 'smallclaw' ? 'agents' : lastPart || 'agents';

  const setActiveTab = (tabId) => {
    router.push(`/apps/smallclaw/${tabId}`);
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
      <div className="p-4 lg:p-8">{children}</div>
    </AppLayout>
  );
}
