'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';

const SmallClawContext = createContext(null);

export function SmallClawProvider({ children }) {
  const [searchQuery, setSearchQuery] = useState('');

  // Data State
  const [providers, setProviders] = useState([]);
  const [agents, setAgents] = useState([]);
  const [integrations, setIntegrations] = useState([]);
  const [mcpServers, setMcpServers] = useState([]);
  const [skills, setSkills] = useState([]);
  const [chatbotSettings, setChatbotSettings] = useState({
    aiName: 'Kiro',
    persona: '',
    baseKnowledge: '',
    servicesOffered: '',
    callToAction: '',
    suggestedPrompts: [''],
    welcomeMessage: '',
    rules: [''],
    isActive: true,
    defaultEngine: 'fast',
  });

  const fetchProviders = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/providers');
      const data = await res.json();
      if (res.ok) setProviders(data.providers || []);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    }
  }, []);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/agents');
      const data = await res.json();
      if (res.ok) setAgents(data.agents || []);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  }, []);

  const fetchIntegrations = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/integrations');
      const data = await res.json();
      if (res.ok) setIntegrations(data.integrations || []);
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    }
  }, []);

  const fetchMcpServers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/mcp-servers');
      const data = await res.json();
      if (res.ok) setMcpServers(data.servers || []);
    } catch (error) {
      console.error('Failed to fetch MCP servers:', error);
    }
  }, []);

  const fetchSkills = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/skills');
      const data = await res.json();
      if (res.ok) setSkills(data.skills || []);
    } catch (error) {
      console.error('Failed to fetch skills:', error);
    }
  }, []);

  const fetchChatbotSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/chatbot');
      const data = await res.json();
      if (res.ok && data) {
        setChatbotSettings({
          ...data,
          suggestedPrompts: data.suggestedPrompts || [''],
          rules: data.rules || [''],
        });
      }
    } catch (error) {
      console.error('Failed to fetch chatbot settings:', error);
    }
  }, []);

  const value = {
    searchQuery,
    setSearchQuery,
    providers,
    agents,
    integrations,
    mcpServers,
    skills,
    chatbotSettings,
    refreshProviders: fetchProviders,
    refreshAgents: fetchAgents,
    refreshIntegrations: fetchIntegrations,
    refreshMcpServers: fetchMcpServers,
    refreshSkills: fetchSkills,
    refreshChatbotSettings: fetchChatbotSettings,
  };

  return <SmallClawContext.Provider value={value}>{children}</SmallClawContext.Provider>;
}

export function useSmallClaw() {
  const context = useContext(SmallClawContext);
  if (!context) {
    throw new Error('useSmallClaw must be used within a SmallClawProvider');
  }
  return context;
}
