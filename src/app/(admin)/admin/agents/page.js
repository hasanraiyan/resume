'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import {
  Sparkles,
  Bot,
  Plus,
  Trash2,
  Edit2,
  Server,
  Globe2,
  Network,
  Power,
  Activity,
  MessageCircle,
  Webhook,
  UserCircle,
  BookOpen,
  ShieldCheck,
  Save,
  RotateCcw,
  PlusCircle,
} from 'lucide-react';
import AgentConfigurationModal from '@/components/admin/AgentConfigurationModal';
import { Card } from '@/components/ui';
import { formatDistanceToNow } from 'date-fns';
import Switch from '@/components/admin/Switch';

export default function AgentsDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('providers'); // 'providers', 'agents', or 'channels'
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Providers State
  const [providers, setProviders] = useState([]);
  const [savingProvider, setSavingProvider] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [newProvider, setNewProvider] = useState({
    name: '',
    baseUrl: '',
    apiKey: '***************',
  });

  // Agents State
  const [agents, setAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);

  // Integrations State
  const [integrations, setIntegrations] = useState([]);
  const [savingIntegration, setSavingIntegration] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState(null);
  const [newIntegration, setNewIntegration] = useState({
    platform: 'telegram',
    name: '',
    credentials: {
      botToken: '',
      accessToken: '',
      phoneNumberId: '',
      verifyToken: '',
      accountSid: '',
      authToken: '',
      fromNumber: '',
      responseMode: 'all',
      allowedNumbers: '',
    },
    agentId: '',
    isActive: true,
  });

  // MCP Servers State
  const [mcpServers, setMcpServers] = useState([]);
  const [savingMcp, setSavingMcp] = useState(false);
  const [editingMcp, setEditingMcp] = useState(null);
  const [newMcp, setNewMcp] = useState({
    name: '',
    description: '',
    type: 'sse',
    url: '',
    icon: 'Server',
    color: 'blue-500',
    isActive: true,
    adminOnly: false,
    isDefault: false,
  });

  // Assistant / Chatbot State
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
  const [savingChatbot, setSavingChatbot] = useState(false);
  const [chatbotLoading, setChatbotLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'admin') {
      router.push('/admin/login');
      return;
    }
    fetchProviders();
    fetchAgents();
    fetchIntegrations();
    fetchMcpServers();
    fetchChatbotSettings();

    // Check for tab in URL
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab && ['providers', 'agents', 'channels', 'mcp', 'assistant'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [session, status, router]);

  const fetchProviders = async () => {
    try {
      const res = await fetch('/api/admin/providers');
      const data = await res.json();
      if (res.ok) setProviders(data.providers || []);
    } catch (error) {
      console.error('Failed to fetch providers:', error);
    }
  };

  const fetchAgents = async () => {
    try {
      const res = await fetch('/api/admin/agents');
      const data = await res.json();
      if (res.ok) {
        setAgents(data.agents || []);
        setLoading(false);
      }
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    }
  };

  const fetchIntegrations = async () => {
    try {
      const res = await fetch('/api/admin/integrations');
      const data = await res.json();
      if (res.ok) setIntegrations(data.integrations || []);
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
    }
  };

  const fetchMcpServers = async () => {
    try {
      const res = await fetch('/api/admin/mcp-servers');
      const data = await res.json();
      if (res.ok) setMcpServers(data.servers || []);
    } catch (error) {
      console.error('Failed to fetch MCP servers:', error);
    }
  };

  const fetchChatbotSettings = async () => {
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
    } finally {
      setChatbotLoading(false);
    }
  };

  // --- Provider Handlers ---
  const handleAddProvider = () => {
    setEditingProvider({ id: 'new', ...newProvider, apiKey: '' });
  };

  const handleEditProvider = (provider) => {
    setEditingProvider({ ...provider, apiKey: '' }); // keep empty so they don't overwrite if they just want to change URL
  };

  const handleSaveProvider = async () => {
    if (!editingProvider.name || !editingProvider.baseUrl) return;

    setSavingProvider(true);
    try {
      const isNew = editingProvider.id === 'new';
      const url = isNew
        ? '/api/admin/providers'
        : `/api/admin/providers/${editingProvider.providerId}`;
      const method = isNew ? 'POST' : 'PUT';

      const payload = { ...editingProvider };
      // If editing and key is left empty, don't send it
      if (!isNew && !payload.apiKey) {
        delete payload.apiKey;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setEditingProvider(null);
        fetchProviders();
      } else {
        alert('Failed to save provider.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSavingProvider(false);
    }
  };

  const handleDeleteProvider = async (providerId) => {
    if (!confirm('Are you sure you want to delete this AI Provider?')) return;
    try {
      const res = await fetch(`/api/admin/providers/${providerId}`, { method: 'DELETE' });
      if (res.ok) fetchProviders();
    } catch (error) {
      console.error(error);
    }
  };

  // --- Integration Handlers ---
  const handleAddIntegration = () => {
    setEditingIntegration({ id: 'new', ...newIntegration });
  };

  const handleEditIntegration = (integration) => {
    // Make a copy and clear credentials temporarily so they don't overwrite if they just want to change name
    const copy = { ...integration };
    if (copy.credentials) {
      const creds = { ...copy.credentials };
      // Clear sensitive fields if they exist
      if (creds.botToken) creds.botToken = '';
      if (creds.accessToken) creds.accessToken = '';
      copy.credentials = creds;
    }
    setEditingIntegration(copy);
  };

  const handleSaveIntegration = async () => {
    if (!editingIntegration.name || !editingIntegration.platform || !editingIntegration.agentId)
      return;

    setSavingIntegration(true);
    try {
      const isNew = editingIntegration.id === 'new';
      const url = isNew
        ? '/api/admin/integrations'
        : `/api/admin/integrations/${editingIntegration.integrationId}`;
      const method = isNew ? 'POST' : 'PUT';

      const payload = { ...editingIntegration };

      // Prevent sending empty credentials if not new
      if (!isNew && payload.credentials) {
        const sensitiveFields = [
          'botToken',
          'accessToken',
          'phoneNumberId',
          'verifyToken',
          'accountSid',
          'authToken',
        ];
        sensitiveFields.forEach((f) => {
          if (!payload.credentials[f]) {
            delete payload.credentials[f];
          }
        });
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setEditingIntegration(null);
        fetchIntegrations();
      } else {
        alert('Failed to save integration.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSavingIntegration(false);
    }
  };

  const handleDeleteIntegration = async (integrationId) => {
    if (!confirm('Are you sure you want to delete this Channel Integration?')) return;
    try {
      // Assuming a DELETE route exists or will be created
      const res = await fetch(`/api/admin/integrations/${integrationId}`, { method: 'DELETE' });
      if (res.ok) fetchIntegrations();
    } catch (error) {
      console.error(error);
    }
  };

  // --- MCP Handlers ---
  const handleAddMcp = () => {
    setEditingMcp({ id: 'new', ...newMcp });
  };

  const handleEditMcp = (server) => {
    setEditingMcp({ ...server, id: server._id });
  };

  const handleSaveMcp = async () => {
    if (!editingMcp.name || !editingMcp.url) return;

    setSavingMcp(true);
    try {
      const isNew = editingMcp.id === 'new';
      const url = isNew ? '/api/admin/mcp-servers' : `/api/admin/mcp-servers/${editingMcp.id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingMcp),
      });

      if (res.ok) {
        setEditingMcp(null);
        fetchMcpServers();
      } else {
        alert('Failed to save MCP server.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSavingMcp(false);
    }
  };

  const handleDeleteMcp = async (serverId) => {
    if (!confirm('Are you sure you want to delete this MCP Server?')) return;
    try {
      const res = await fetch(`/api/admin/mcp-servers/${serverId}`, { method: 'DELETE' });
      if (res.ok) fetchMcpServers();
    } catch (error) {
      console.error(error);
    }
  };

  // --- Assistant Handlers ---
  const handleSaveChatbot = async () => {
    setSavingChatbot(true);
    try {
      const res = await fetch('/api/admin/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chatbotSettings),
      });

      if (res.ok) {
        // Success notification or just refresh
        fetchChatbotSettings();
      } else {
        alert('Failed to save chatbot settings.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSavingChatbot(false);
    }
  };

  const handleChatbotInputChange = (field, value) => {
    setChatbotSettings((prev) => ({ ...prev, [field]: value }));
  };

  // --- UI Render ---
  if (loading)
    return (
      <AdminPageWrapper>
        <div className="p-8 text-center text-neutral-500">Loading AI Hub...</div>
      </AdminPageWrapper>
    );

  const filteredProviders = providers.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.baseUrl?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAgents = agents.filter(
    (a) =>
      a.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.model?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredIntegrations = integrations.filter(
    (i) =>
      i.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.platform?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredMcpServers = mcpServers.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.url?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-24">
      {/* Page Header */}
      <div className="border-b border-neutral-200 pb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-4xl font-bold text-black font-['Playfair_Display']">
            AI Command Hub
          </h1>

          {/* Search */}
          <div className="w-full md:w-80 lg:w-96">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i className="fas fa-search text-neutral-400 group-focus-within:text-black transition-colors duration-200 text-sm"></i>
              </div>
              <input
                type="text"
                placeholder={
                  activeTab === 'agents'
                    ? 'Search agents by name, model...'
                    : 'Search providers by name, URL...'
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    setSearchQuery('');
                  }
                }}
                className="pl-12 pr-12 py-3.5 w-full bg-white border-2 border-black rounded-xl focus:ring-0 focus:outline-none transition-all duration-200 text-neutral-700 placeholder-neutral-400 font-medium shadow-sm text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute inset-y-0 right-10 pr-4 flex items-center text-neutral-400 hover:text-red-500 transition-colors duration-200 group"
                  title="Clear search"
                >
                  <X className="w-5 h-5 transition-transform duration-200" />
                </button>
              )}
              {!searchQuery && (
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                  <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-xs font-semibold text-neutral-400 bg-neutral-50 border border-neutral-200 rounded-md shadow-sm">
                    ⌘K
                  </kbd>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-12 pb-24">
        {/* Tabs Navigation */}
        <div className="flex border-b border-neutral-200">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('providers')}
              className={`flex items-center gap-2 py-4 text-sm font-semibold transition-colors cursor-pointer relative px-2 ${
                activeTab === 'providers' ? 'text-black' : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Server className="w-4 h-4" />
              <span>API Providers</span>
              {activeTab === 'providers' && (
                <span className="absolute bottom-0 left-0 w-full h-[3px] bg-black"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('agents')}
              className={`flex items-center gap-2 py-4 text-sm font-semibold transition-colors cursor-pointer relative px-2 ${
                activeTab === 'agents' ? 'text-black' : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Network className="w-4 h-4" />
              <span>Active Agents</span>
              {activeTab === 'agents' && (
                <span className="absolute bottom-0 left-0 w-full h-[3px] bg-black"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('channels')}
              className={`flex items-center gap-2 py-4 text-sm font-semibold transition-colors cursor-pointer relative px-2 ${
                activeTab === 'channels' ? 'text-black' : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              <span>Channels</span>
              {activeTab === 'channels' && (
                <span className="absolute bottom-0 left-0 w-full h-[3px] bg-black"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('mcp')}
              className={`flex items-center gap-2 py-4 text-sm font-semibold transition-colors cursor-pointer relative px-2 ${
                activeTab === 'mcp' ? 'text-black' : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>MCP Servers</span>
              {activeTab === 'mcp' && (
                <span className="absolute bottom-0 left-0 w-full h-[3px] bg-black"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('assistant')}
              className={`flex items-center gap-2 py-4 text-sm font-semibold transition-colors cursor-pointer relative px-2 ${
                activeTab === 'assistant' ? 'text-black' : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>Assistant</span>
              {activeTab === 'assistant' && (
                <span className="absolute bottom-0 left-0 w-full h-[3px] bg-black"></span>
              )}
            </button>
          </div>
        </div>

        {/* Providers Tab */}
        {activeTab === 'providers' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold font-['Playfair_Display']">API Configuration</h2>
                <p className="text-sm text-neutral-500 mt-1">
                  Manage connection keys for external LLM services.
                </p>
              </div>
              <button
                onClick={handleAddProvider}
                className="px-5 py-2.5 bg-black hover:bg-neutral-800 transition-colors text-white rounded-xl text-sm font-medium flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add New Provider
              </button>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProviders.map((p) => (
                <Card
                  key={p.providerId}
                  interactive
                  className="p-6 border-2 border-neutral-100 hover:border-black transition-all bg-white rounded-xl flex flex-col h-full cursor-pointer overflow-hidden relative"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0 border border-neutral-200/60">
                        <Globe2 className="w-5 h-5 text-neutral-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base text-neutral-900 leading-tight">
                          {p.name}
                        </h3>
                        <p
                          className="text-xs text-neutral-500 font-mono mt-1 truncate max-w-[150px]"
                          title={p.baseUrl}
                        >
                          {p.baseUrl}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleEditProvider(p)}
                        className="p-1.5 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                        aria-label="Edit Provider"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProvider(p.providerId)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        aria-label="Delete Provider"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-auto pt-4 border-t border-neutral-100">
                    <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold mb-1.5">
                      API Key
                    </p>
                    <div className="text-xs bg-neutral-50 text-neutral-600 px-3 py-2 rounded-lg font-mono tracking-wider border border-neutral-100 truncate">
                      {p.apiKey}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {providers.length === 0 ? (
              <div className="text-center p-16 border-2 border-dashed border-neutral-200 rounded-3xl bg-neutral-50/50 flex flex-col items-center justify-center">
                <Server className="w-12 h-12 text-neutral-300 mb-4" />
                <h3 className="text-lg font-semibold text-neutral-700">No Providers Found</h3>
                <p className="text-sm text-neutral-500 mt-2 max-w-md">
                  Connect an API provider like OpenAI or Anthropic to start powering your
                  intelligent agents.
                </p>
                <button
                  onClick={handleAddProvider}
                  className="mt-6 px-6 py-2.5 bg-white border border-neutral-300 hover:border-black transition-colors rounded-xl text-sm font-medium text-black cursor-pointer"
                >
                  Configure Provider
                </button>
              </div>
            ) : filteredProviders.length === 0 && searchQuery ? (
              <div className="text-center p-12 border border-dashed rounded-2xl bg-neutral-50 text-neutral-500">
                No providers match your search for "{searchQuery}".
              </div>
            ) : null}

            {/* Provider Edit Modal inline for simplicity */}
            {editingProvider && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4">
                  <h3 className="text-lg font-bold">
                    {editingProvider.id === 'new' ? 'New Provider' : 'Edit Provider'}
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-neutral-600">
                        Company / Model Name
                      </label>
                      <input
                        className="w-full p-2 border rounded-lg mt-1"
                        value={editingProvider.name}
                        onChange={(e) =>
                          setEditingProvider({ ...editingProvider, name: e.target.value })
                        }
                        placeholder="OpenAI"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-neutral-600">Base URL</label>
                      <input
                        className="w-full p-2 border rounded-lg mt-1"
                        value={editingProvider.baseUrl}
                        onChange={(e) =>
                          setEditingProvider({ ...editingProvider, baseUrl: e.target.value })
                        }
                        placeholder="https://api.openai.com/v1"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-neutral-600">API Key</label>
                      <input
                        className="w-full p-2 border rounded-lg mt-1"
                        type="password"
                        value={editingProvider.apiKey}
                        onChange={(e) =>
                          setEditingProvider({ ...editingProvider, apiKey: e.target.value })
                        }
                        placeholder="sk-..."
                      />
                      {editingProvider.id !== 'new' && (
                        <p className="text-[10px] text-neutral-400 mt-1">
                          Leave blank to keep existing key unchanged.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={() => setEditingProvider(null)}
                      className="flex-1 py-2 rounded-lg border text-sm font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProvider}
                      disabled={savingProvider}
                      className="flex-1 py-2 rounded-lg bg-black text-white text-sm font-medium cursor-pointer disabled:cursor-not-allowed"
                    >
                      {savingProvider ? 'Saving...' : 'Save Provider'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Agents Tab */}
        {activeTab === 'agents' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold font-['Playfair_Display']">Intelligent Agents</h2>
                <p className="text-sm text-neutral-500 mt-1">
                  Configure models, tools, and capabilities for your system agents.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredAgents.map((agent) => (
                <Card
                  key={agent.agentId}
                  interactive
                  className="group flex flex-col h-full bg-white border-2 border-neutral-100 rounded-xl overflow-hidden cursor-pointer hover:border-black transition-all duration-300 relative"
                  onClick={() => {
                    setSelectedAgent(agent);
                    setIsAgentModalOpen(true);
                  }}
                >
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${agent.isActive ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-400'}`}
                        >
                          <Bot className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-lg text-neutral-900 group-hover:text-black transition-colors">
                            {agent.name}
                          </h3>
                          <p className="text-xs text-neutral-500 font-medium capitalize mt-0.5">
                            {agent.category} Engine
                          </p>
                        </div>
                      </div>
                      <div title={agent.isActive ? 'Online' : 'Offline'}>
                        {agent.isActive ? (
                          <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                          </span>
                        ) : (
                          <Power className="w-4 h-4 text-neutral-300" />
                        )}
                      </div>
                    </div>

                    {agent.description && (
                      <p className="text-sm text-neutral-600 line-clamp-2 mt-2 mb-4 flex-1">
                        {agent.description}
                      </p>
                    )}

                    <div className="flex flex-col gap-1.5 mb-6">
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <Activity className="w-3.5 h-3.5 text-neutral-400" />
                        <span className="font-medium text-neutral-700">
                          {agent.executionCount || 0}
                        </span>{' '}
                        Executions
                      </div>
                      {agent.lastExecutedAt && (
                        <div className="text-[10px] text-neutral-400 ml-5.5">
                          Last run{' '}
                          {formatDistanceToNow(new Date(agent.lastExecutedAt), { addSuffix: true })}
                        </div>
                      )}
                    </div>

                    <div className="mt-auto flex flex-wrap gap-2 pt-4 border-t border-neutral-100">
                      {agent.model ? (
                        <span
                          className="px-2.5 py-1 bg-neutral-100 text-neutral-700 text-[10px] font-mono rounded-md border border-neutral-200/60 truncate max-w-[140px]"
                          title={agent.model}
                        >
                          {agent.model}
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200/50 text-[10px] font-medium rounded-md">
                          No Model Set
                        </span>
                      )}

                      {agent.tools && agent.tools.length > 0 && (
                        <span className="px-2.5 py-1 bg-neutral-50 text-neutral-600 text-[10px] font-medium rounded-md border border-neutral-200/60 flex items-center gap-1">
                          <Network className="w-3 h-3" />
                          {agent.tools.length} {agent.tools.length === 1 ? 'Tool' : 'Tools'}
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {agents.length > 0 && filteredAgents.length === 0 && searchQuery && (
              <div className="text-center p-12 border border-dashed rounded-2xl bg-neutral-50 text-neutral-500">
                No agents match your search for "{searchQuery}".
              </div>
            )}
          </div>
        )}

        {/* Channels Tab */}
        {activeTab === 'channels' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold font-['Playfair_Display']">External Channels</h2>
                <p className="text-sm text-neutral-500 mt-1">
                  Connect your AI agents to external platforms like Telegram or WhatsApp.
                </p>
              </div>
              <button
                onClick={handleAddIntegration}
                className="px-5 py-2.5 bg-black hover:bg-neutral-800 transition-colors text-white rounded-xl text-sm font-medium flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Add Channel
              </button>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredIntegrations.map((integration) => (
                <Card
                  key={integration.integrationId}
                  interactive
                  className="p-6 border-2 border-neutral-100 hover:border-black transition-all bg-white rounded-xl flex flex-col h-full cursor-pointer relative"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0 border border-neutral-200/60">
                        <MessageCircle className="w-5 h-5 text-neutral-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base text-neutral-900 leading-tight">
                          {integration.name}
                        </h3>
                        <p className="text-xs text-neutral-500 font-medium capitalize mt-1">
                          Platform:{' '}
                          <span className="font-semibold text-neutral-800">
                            {integration.platform}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleEditIntegration(integration)}
                        className="p-1.5 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                        aria-label="Edit Channel"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteIntegration(integration.integrationId)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        aria-label="Delete Channel"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 mb-6">
                    <p className="text-xs text-neutral-500">
                      Routing to Agent:{' '}
                      <span className="font-semibold px-2 py-0.5 bg-neutral-100 rounded text-neutral-700">
                        {integration.agentId}
                      </span>
                    </p>
                  </div>

                  <div className="mt-auto pt-4 border-t border-neutral-100">
                    <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold mb-1.5 flex justify-between">
                      <span>Webhook URL</span>
                      {integration.isActive ? (
                        <span className="text-green-500 font-bold">Active</span>
                      ) : (
                        <span className="text-neutral-400">Inactive</span>
                      )}
                    </p>
                    <div className="text-xs bg-neutral-50 text-neutral-600 px-3 py-2 rounded-lg font-mono tracking-wider border border-neutral-100 truncate flex items-center gap-2">
                      <Webhook className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="truncate">/api/webhooks/{integration.platform}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {integrations.length === 0 ? (
              <div className="text-center p-16 border-2 border-dashed border-neutral-200 rounded-3xl bg-neutral-50/50 flex flex-col items-center justify-center">
                <MessageCircle className="w-12 h-12 text-neutral-300 mb-4" />
                <h3 className="text-lg font-semibold text-neutral-700">No Channels Found</h3>
                <p className="text-sm text-neutral-500 mt-2 max-w-md">
                  Connect your AI Agents to external platforms like Telegram bots to interact with
                  users directly.
                </p>
                <button
                  onClick={handleAddIntegration}
                  className="mt-6 px-6 py-2.5 bg-white border border-neutral-300 hover:border-black transition-colors rounded-xl text-sm font-medium text-black cursor-pointer"
                >
                  Add a Channel
                </button>
              </div>
            ) : filteredIntegrations.length === 0 && searchQuery ? (
              <div className="text-center p-12 border border-dashed rounded-2xl bg-neutral-50 text-neutral-500">
                No channels match your search for "{searchQuery}".
              </div>
            ) : null}

            {/* Integration Edit Modal */}
            {editingIntegration && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 sm:p-6">
                <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 space-y-6 border-2 border-neutral-100">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold">
                      {editingIntegration.id === 'new' ? 'New Channel Integration' : 'Edit Channel'}
                    </h3>
                    <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider cursor-pointer">
                      <span
                        className={
                          editingIntegration.isActive ? 'text-green-600' : 'text-neutral-400'
                        }
                      >
                        {editingIntegration.isActive ? 'Active' : 'Offline'}
                      </span>
                      <input
                        type="checkbox"
                        checked={editingIntegration.isActive ?? true}
                        onChange={(e) =>
                          setEditingIntegration({
                            ...editingIntegration,
                            isActive: e.target.checked,
                          })
                        }
                        className="rounded border-neutral-300 text-black focus:ring-black"
                      />
                    </label>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-neutral-600">Platform</label>
                      <select
                        className="w-full p-2 border rounded-lg mt-1 bg-white"
                        value={editingIntegration.platform}
                        onChange={(e) =>
                          setEditingIntegration({ ...editingIntegration, platform: e.target.value })
                        }
                        disabled={editingIntegration.id !== 'new'}
                      >
                        <option value="telegram">Telegram Bot API</option>
                        <option value="whatsapp">WhatsApp Cloud API (Meta)</option>
                        <option value="twilio">WhatsApp (Twilio)</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-medium text-neutral-600">Name</label>
                      <input
                        className="w-full p-2 border rounded-lg mt-1"
                        value={editingIntegration.name}
                        onChange={(e) =>
                          setEditingIntegration({ ...editingIntegration, name: e.target.value })
                        }
                        placeholder="My Support Bot"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-medium text-neutral-600">
                        Target AI Agent
                      </label>
                      <select
                        className="w-full p-2.5 border-2 border-neutral-200 focus:border-black rounded-xl mt-1.5 bg-white text-sm font-medium transition-colors outline-none"
                        value={editingIntegration.agentId}
                        onChange={(e) =>
                          setEditingIntegration({ ...editingIntegration, agentId: e.target.value })
                        }
                      >
                        <option value="">Select an Agent...</option>
                        {agents.map((a) => (
                          <option key={a.agentId} value={a.agentId}>
                            {a.name} ({a.agentId})
                          </option>
                        ))}
                      </select>
                    </div>

                    {agents.length === 0 && (
                      <div className="text-xs text-red-500 mt-1.5">
                        No active agents found. Please create one first.
                      </div>
                    )}
                  </div>

                  {editingIntegration.platform === 'telegram' && (
                    <div>
                      <label className="text-xs font-medium text-neutral-600">
                        Telegram Bot Token
                      </label>
                      <input
                        className="w-full p-2 border rounded-lg mt-1"
                        type="password"
                        value={editingIntegration.credentials?.botToken || ''}
                        onChange={(e) =>
                          setEditingIntegration({
                            ...editingIntegration,
                            credentials: {
                              ...editingIntegration.credentials,
                              botToken: e.target.value,
                            },
                          })
                        }
                        placeholder="123456789:ABCDEF..."
                      />
                      {editingIntegration.id !== 'new' && (
                        <p className="text-[10px] text-neutral-400 mt-1">
                          Leave blank to keep existing token unchanged.
                        </p>
                      )}
                    </div>
                  )}
                  {editingIntegration.platform === 'whatsapp' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-neutral-600">Access Token</label>
                        <input
                          className="w-full p-2 border rounded-lg mt-1"
                          type="password"
                          value={editingIntegration.credentials?.accessToken || ''}
                          onChange={(e) =>
                            setEditingIntegration({
                              ...editingIntegration,
                              credentials: {
                                ...editingIntegration.credentials,
                                accessToken: e.target.value,
                              },
                            })
                          }
                          placeholder="EAAB..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-neutral-600">
                            Phone Number ID
                          </label>
                          <input
                            className="w-full p-2 border rounded-lg mt-1"
                            value={editingIntegration.credentials?.phoneNumberId || ''}
                            onChange={(e) =>
                              setEditingIntegration({
                                ...editingIntegration,
                                credentials: {
                                  ...editingIntegration.credentials,
                                  phoneNumberId: e.target.value,
                                },
                              })
                            }
                            placeholder="1234..."
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-neutral-600">
                            Verify Token
                          </label>
                          <input
                            className="w-full p-2 border rounded-lg mt-1"
                            value={editingIntegration.credentials?.verifyToken || ''}
                            onChange={(e) =>
                              setEditingIntegration({
                                ...editingIntegration,
                                credentials: {
                                  ...editingIntegration.credentials,
                                  verifyToken: e.target.value,
                                },
                              })
                            }
                            placeholder="my_secret..."
                          />
                        </div>
                      </div>

                      <div className="pt-4 border-t border-neutral-100">
                        <label className="text-sm font-bold block mb-2">Selective Response</label>
                        <select
                          className="w-full p-2 border rounded-lg bg-white text-sm"
                          value={editingIntegration.credentials?.responseMode || 'all'}
                          onChange={(e) =>
                            setEditingIntegration({
                              ...editingIntegration,
                              credentials: {
                                ...editingIntegration.credentials,
                                responseMode: e.target.value,
                              },
                            })
                          }
                        >
                          <option value="all">Respond to Everyone</option>
                          <option value="whitelisted">Only Allowed Numbers</option>
                        </select>

                        {editingIntegration.credentials?.responseMode === 'whitelisted' && (
                          <div className="mt-3">
                            <label className="text-xs font-medium text-neutral-600">
                              Whitelisted Numbers (comma separated)
                            </label>
                            <textarea
                              className="w-full p-2 border rounded-lg mt-1 text-sm h-20"
                              value={editingIntegration.credentials?.allowedNumbers || ''}
                              onChange={(e) =>
                                setEditingIntegration({
                                  ...editingIntegration,
                                  credentials: {
                                    ...editingIntegration.credentials,
                                    allowedNumbers: e.target.value,
                                  },
                                })
                              }
                              placeholder="919876543210, 911234567890"
                            />
                            <p className="text-[10px] text-neutral-400 mt-1">
                              Include country code without + (e.g., 91 for India).
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {editingIntegration.platform === 'twilio' && (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-medium text-neutral-600">Account SID</label>
                        <input
                          className="w-full p-2 border rounded-lg mt-1"
                          value={editingIntegration.credentials?.accountSid || ''}
                          onChange={(e) =>
                            setEditingIntegration({
                              ...editingIntegration,
                              credentials: {
                                ...editingIntegration.credentials,
                                accountSid: e.target.value,
                              },
                            })
                          }
                          placeholder="AC..."
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-neutral-600">Auth Token</label>
                        <input
                          className="w-full p-2 border rounded-lg mt-1"
                          type="password"
                          value={editingIntegration.credentials?.authToken || ''}
                          onChange={(e) =>
                            setEditingIntegration({
                              ...editingIntegration,
                              credentials: {
                                ...editingIntegration.credentials,
                                authToken: e.target.value,
                              },
                            })
                          }
                          placeholder="xxxxxxxx..."
                        />
                      </div>
                      <div>
                        <label className="text-xs font-medium text-neutral-600">
                          Twilio WhatsApp Number
                        </label>
                        <input
                          className="w-full p-2 border rounded-lg mt-1"
                          value={editingIntegration.credentials?.fromNumber || ''}
                          onChange={(e) =>
                            setEditingIntegration({
                              ...editingIntegration,
                              credentials: {
                                ...editingIntegration.credentials,
                                fromNumber: e.target.value,
                              },
                            })
                          }
                          placeholder="whatsapp:+14155238886"
                        />
                      </div>

                      <div className="pt-4 border-t border-neutral-100">
                        <label className="text-sm font-bold block mb-2">Selective Response</label>
                        <select
                          className="w-full p-2 border rounded-lg bg-white text-sm"
                          value={editingIntegration.credentials?.responseMode || 'all'}
                          onChange={(e) =>
                            setEditingIntegration({
                              ...editingIntegration,
                              credentials: {
                                ...editingIntegration.credentials,
                                responseMode: e.target.value,
                              },
                            })
                          }
                        >
                          <option value="all">Respond to Everyone</option>
                          <option value="whitelisted">Only Allowed Numbers</option>
                        </select>

                        {editingIntegration.credentials?.responseMode === 'whitelisted' && (
                          <div className="mt-3">
                            <label className="text-xs font-medium text-neutral-600">
                              Whitelisted Numbers (comma separated)
                            </label>
                            <textarea
                              className="w-full p-2 border rounded-lg mt-1 text-sm h-20"
                              value={editingIntegration.credentials?.allowedNumbers || ''}
                              onChange={(e) =>
                                setEditingIntegration({
                                  ...editingIntegration,
                                  credentials: {
                                    ...editingIntegration.credentials,
                                    allowedNumbers: e.target.value,
                                  },
                                })
                              }
                              placeholder="+919876543210, 911234567890"
                            />
                            <p className="text-[10px] text-neutral-400 mt-1">
                              Include country code (e.g., +91 or 91).
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4 border-t border-neutral-100 mt-6">
                    <button
                      onClick={() => setEditingIntegration(null)}
                      className="flex-1 py-2 rounded-xl border-2 border-neutral-100 hover:bg-neutral-50 text-sm font-bold uppercase tracking-widest text-neutral-600 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveIntegration}
                      disabled={savingIntegration}
                      className="flex-1 py-2 rounded-xl bg-black hover:bg-neutral-800 text-white text-sm font-bold uppercase tracking-widest transition-colors cursor-pointer disabled:cursor-not-allowed"
                    >
                      {savingIntegration ? 'Saving...' : 'Save Channel'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MCP Tab */}
        {activeTab === 'mcp' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-2xl font-bold font-['Playfair_Display']">MCP Infrastructure</h2>
                <p className="text-sm text-neutral-500 mt-1">
                  Connect Model Context Protocol (MCP) servers to give agents tool-use capabilities.
                </p>
              </div>
              <button
                onClick={handleAddMcp}
                className="px-5 py-2.5 bg-black hover:bg-neutral-800 transition-colors text-white rounded-xl text-sm font-medium flex items-center gap-2 cursor-pointer transition-all active:scale-95 border-2 border-black"
              >
                <Plus className="w-4 h-4" /> Add MCP Server
              </button>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredMcpServers.map((server) => (
                <Card
                  key={server._id}
                  interactive
                  className="p-6 border-2 border-neutral-100 hover:border-black transition-all bg-white rounded-xl flex flex-col h-full cursor-pointer relative group"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-neutral-100 flex items-center justify-center flex-shrink-0 border border-neutral-200/60 group-hover:bg-neutral-200/50 transition-colors">
                        <Server className={`w-5 h-5 text-${server.color || 'blue-500'}`} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base text-neutral-900 leading-tight">
                          {server.name}
                        </h3>
                        <p className="text-[10px] text-neutral-400 font-mono mt-1 uppercase tracking-widest">
                          Type: {server.type}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditMcp(server);
                        }}
                        className="p-1.5 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                        aria-label="Edit MCP"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMcp(server._id);
                        }}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        aria-label="Delete MCP"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {server.description && (
                    <p className="text-sm text-neutral-600 mb-4 line-clamp-2 leading-relaxed">
                      {server.description}
                    </p>
                  )}

                  <div className="mt-auto pt-4 border-t border-neutral-100">
                    <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold mb-1.5 flex justify-between items-center">
                      <span>Endpoint URL</span>
                      <span
                        className={`inline-flex items-center gap-1.5 ${server.isActive ? 'text-green-600' : 'text-neutral-400'}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${server.isActive ? 'bg-green-500' : 'bg-neutral-300'}`}
                        ></span>
                        {server.isActive ? 'Active' : 'Offline'}
                      </span>
                    </p>
                    <div
                      className="text-xs bg-neutral-50 text-neutral-600 px-3 py-2 rounded-lg font-mono tracking-wider border border-neutral-100 truncate flex items-center gap-2 group-hover:bg-neutral-100/50 transition-colors"
                      title={server.url}
                    >
                      <Globe2 className="w-3.5 h-3.5 text-neutral-400" />
                      <span className="truncate">{server.url}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {mcpServers.length === 0 ? (
              <div className="text-center p-16 border-2 border-dashed border-neutral-200 rounded-3xl bg-neutral-50/50 flex flex-col items-center justify-center">
                <Activity className="w-12 h-12 text-neutral-300 mb-4" />
                <h3 className="text-lg font-semibold text-neutral-700">
                  No MCP Servers Configured
                </h3>
                <p className="text-sm text-neutral-500 mt-2 max-w-md">
                  MCP servers allow agents to interact with search engines, file systems, and other
                  external tools.
                </p>
                <button
                  onClick={handleAddMcp}
                  className="mt-6 px-6 py-2.5 bg-white border border-neutral-300 hover:border-black transition-colors rounded-xl text-sm font-medium text-black cursor-pointer transition-all active:scale-95"
                >
                  Configure Local SSE Server
                </button>
              </div>
            ) : filteredMcpServers.length === 0 && searchQuery ? (
              <div className="text-center p-12 border border-dashed rounded-2xl bg-neutral-50 text-neutral-500">
                No MCP servers match your search for "{searchQuery}".
              </div>
            ) : null}

            {/* MCP Edit Modal */}
            {editingMcp && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-3xl max-w-lg w-full p-8 space-y-6 relative overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="absolute top-0 left-0 w-full h-1 bg-black" />

                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold font-['Playfair_Display']">
                      {editingMcp.id === 'new'
                        ? 'Register Private MCP Server'
                        : 'Configure Server Settings'}
                    </h3>
                    <button
                      onClick={() => setEditingMcp(null)}
                      className="p-1.5 hover:bg-neutral-100 rounded-full transition-colors text-neutral-400 hover:text-black cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-5">
                    <div className="grid grid-cols-2 gap-5">
                      <div className="col-span-2 sm:col-span-1">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">
                          Friendly Name
                        </label>
                        <input
                          className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 focus:border-black rounded-xl transition-all outline-none text-sm placeholder:text-neutral-400"
                          value={editingMcp.name}
                          onChange={(e) => setEditingMcp({ ...editingMcp, name: e.target.value })}
                          placeholder="Search Tools"
                        />
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">
                          Connection Type
                        </label>
                        <select
                          className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 focus:border-black rounded-xl transition-all outline-none text-sm appearance-none cursor-pointer"
                          value={editingMcp.type}
                          onChange={(e) => setEditingMcp({ ...editingMcp, type: e.target.value })}
                        >
                          <option value="sse">SSE (HTTP/Events)</option>
                          <option value="stdio" disabled>
                            stdio (Local Process)
                          </option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">
                        Endpoint URL
                      </label>
                      <input
                        className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 focus:border-black rounded-xl transition-all outline-none text-sm font-mono placeholder:text-neutral-400"
                        value={editingMcp.url}
                        onChange={(e) => setEditingMcp({ ...editingMcp, url: e.target.value })}
                        placeholder="http://localhost:3001/sse"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">
                        Short Description
                      </label>
                      <textarea
                        className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 focus:border-black rounded-xl transition-all outline-none text-sm min-h-[100px] resize-none placeholder:text-neutral-400 leading-relaxed"
                        value={editingMcp.description}
                        onChange={(e) =>
                          setEditingMcp({ ...editingMcp, description: e.target.value })
                        }
                        placeholder="Describe what capabilities this server adds to your agents..."
                      />
                    </div>

                    <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                      <div>
                        <p className="text-sm font-bold text-neutral-900">Active Status</p>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-0.5">
                          Toggle availability to agents
                        </p>
                      </div>
                      <Switch
                        checked={editingMcp.isActive}
                        onCheckedChange={(val) => setEditingMcp({ ...editingMcp, isActive: val })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-6">
                    <button
                      onClick={() => setEditingMcp(null)}
                      className="flex-1 py-3.5 rounded-xl border-2 border-neutral-100 hover:bg-neutral-50 text-xs font-black uppercase tracking-widest text-neutral-600 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveMcp}
                      disabled={savingMcp}
                      className="flex-1 py-3.5 rounded-xl bg-black hover:bg-neutral-800 text-white text-xs font-black uppercase tracking-widest transition-all cursor-pointer disabled:bg-neutral-300 disabled:cursor-not-allowed"
                    >
                      {savingMcp
                        ? 'Synchronizing...'
                        : editingMcp.id === 'new'
                          ? 'Register Server'
                          : 'Update Server'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Assistant Tab */}
        {activeTab === 'assistant' && (
          <div className="space-y-8 animate-in fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-neutral-100 pb-8">
              <div>
                <h2 className="text-3xl font-bold font-['Playfair_Display'] text-neutral-900">
                  AI Assistant Hub
                </h2>
                <p className="text-sm text-neutral-500 mt-1">
                  Refine your website's conversational brain and persona.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => fetchChatbotSettings()}
                  className="px-5 py-2.5 border-2 border-neutral-100 hover:border-black rounded-xl text-xs font-black uppercase tracking-widest text-neutral-600 hover:text-black transition-all flex items-center gap-2 cursor-pointer bg-white"
                >
                  <RotateCcw className="w-4 h-4" /> Reset
                </button>
                <button
                  onClick={handleSaveChatbot}
                  disabled={savingChatbot}
                  className="px-8 py-2.5 bg-black hover:bg-neutral-800 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 cursor-pointer disabled:bg-neutral-300 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" /> {savingChatbot ? 'Saving...' : 'Publish Changes'}
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
              {/* Left Column: Profile Card */}
              <div className="lg:col-span-4 space-y-8">
                <Card className="p-8 border-2 border-neutral-100 bg-white rounded-xl flex flex-col h-fit">
                  <div className="flex flex-col items-center text-center mb-10">
                    <div className="w-24 h-24 rounded-3xl bg-neutral-900 flex items-center justify-center mb-4 transition-all hover:scale-105 border-4 border-white ring-1 ring-neutral-100">
                      <Sparkles className="w-10 h-10 text-white animate-pulse" />
                    </div>
                    <h3 className="text-xl font-bold text-neutral-900">
                      {chatbotSettings.aiName || 'Assistant'}
                    </h3>
                    <p className="text-xs text-neutral-400 font-medium uppercase tracking-widest mt-1">
                      Primary Website Node
                    </p>
                  </div>

                  <div className="space-y-8 pt-6 border-t border-neutral-100">
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-3">
                        Assistant Name
                      </label>
                      <input
                        className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 focus:border-black rounded-xl outline-none text-sm transition-all focus:bg-white"
                        value={chatbotSettings.aiName}
                        onChange={(e) => handleChatbotInputChange('aiName', e.target.value)}
                        placeholder="e.g. Kiro"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-3">
                        Model Architecture
                      </label>
                      <select
                        className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 focus:border-black rounded-xl outline-none text-sm appearance-none cursor-pointer transition-all focus:bg-white"
                        value={chatbotSettings.defaultEngine || 'fast'}
                        onChange={(e) => handleChatbotInputChange('defaultEngine', e.target.value)}
                      >
                        <option value="fast">Fast (GPT-4o Mini)</option>
                        <option value="pro">Pro (GPT-4o)</option>
                        <option value="thinking">Critical Thinker (o1-mini/o3)</option>
                      </select>
                      <p className="text-[10px] text-neutral-400 mt-2 leading-relaxed">
                        Determines the logic weight and speed of responses.
                      </p>
                    </div>

                    <div className="pt-6 border-t border-neutral-100">
                      <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                        <div>
                          <p className="text-sm font-bold text-neutral-900">Online Status</p>
                          <p className="text-[10px] text-neutral-500 uppercase tracking-widest mt-0.5">
                            Visible to visitors
                          </p>
                        </div>
                        <Switch
                          checked={chatbotSettings.isActive}
                          onCheckedChange={(val) => handleChatbotInputChange('isActive', val)}
                        />
                      </div>
                    </div>

                    <div className="pt-6 border-t border-neutral-100">
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-3">
                        CTA Prompt
                      </label>
                      <textarea
                        className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 focus:border-black rounded-xl outline-none text-sm transition-all min-h-[100px] resize-none focus:bg-white leading-relaxed"
                        value={chatbotSettings.callToAction}
                        onChange={(e) => handleChatbotInputChange('callToAction', e.target.value)}
                        placeholder="e.g. Let's build something extraordinary together."
                      />
                      <p className="text-[10px] text-neutral-400 mt-2 leading-relaxed">
                        Directs users toward your contact funnel.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Column: Intelligence & Strategy */}
              <div className="lg:col-span-8 space-y-8">
                <Card className="border-2 border-neutral-100 bg-white rounded-xl overflow-hidden flex flex-col">
                  <div className="p-8 border-b border-neutral-100 bg-neutral-50/40">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center border border-black">
                        <UserCircle className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-neutral-900">
                          AI Intelligence Configuration
                        </h3>
                        <p className="text-xs text-neutral-500">
                          Fine-tune the neural pathways and guardrails.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 space-y-12">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                          System Persona & Vocal Tone
                        </label>
                      </div>
                      <textarea
                        className="w-full px-6 py-5 bg-neutral-50 border-2 border-neutral-100 focus:border-black rounded-2xl outline-none text-[15px] leading-relaxed transition-all min-h-[220px] focus:bg-white"
                        value={chatbotSettings.persona}
                        onChange={(e) => handleChatbotInputChange('persona', e.target.value)}
                        placeholder="Define background, humor style, and professional boundary..."
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-8 pt-8 border-t border-neutral-100">
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                            Operational Rules
                          </label>
                          <button
                            onClick={() =>
                              handleChatbotInputChange('rules', [...chatbotSettings.rules, ''])
                            }
                            className="text-[10px] font-black uppercase tracking-widest text-black flex items-center gap-1.5 hover:opacity-60 transition-all cursor-pointer"
                          >
                            <PlusCircle className="w-3.5 h-3.5" /> Add Rule
                          </button>
                        </div>
                        <div className="space-y-3">
                          {chatbotSettings.rules.map((rule, idx) => (
                            <div key={idx} className="flex gap-2 group items-center">
                              <input
                                className="flex-1 px-4 py-2.5 bg-neutral-50 border-2 border-neutral-100 rounded-xl text-xs font-medium outline-none focus:border-black transition-all focus:bg-white"
                                value={rule}
                                onChange={(e) => {
                                  const newRules = [...chatbotSettings.rules];
                                  newRules[idx] = e.target.value;
                                  handleChatbotInputChange('rules', newRules);
                                }}
                                placeholder={`Constraint #${idx + 1}`}
                              />
                              <button
                                onClick={() => {
                                  const newRules = chatbotSettings.rules.filter(
                                    (_, i) => i !== idx
                                  );
                                  handleChatbotInputChange('rules', newRules);
                                }}
                                className="p-2 text-neutral-300 hover:text-red-500 transition-colors cursor-pointer group-hover:scale-110"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400">
                            Strategic Prompts
                          </label>
                          <button
                            onClick={() =>
                              handleChatbotInputChange('suggestedPrompts', [
                                ...chatbotSettings.suggestedPrompts,
                                '',
                              ])
                            }
                            className="text-[10px] font-black uppercase tracking-widest text-black flex items-center gap-1.5 hover:opacity-60 transition-all cursor-pointer"
                          >
                            <PlusCircle className="w-3.5 h-3.5" /> Add Prompt
                          </button>
                        </div>
                        <div className="space-y-3">
                          {chatbotSettings.suggestedPrompts.map((prompt, idx) => (
                            <div key={idx} className="flex gap-2 group items-center">
                              <input
                                className="flex-1 px-4 py-2.5 bg-neutral-50 border-2 border-neutral-100 rounded-xl text-xs font-medium outline-none focus:border-black transition-all focus:bg-white"
                                value={prompt}
                                onChange={(e) => {
                                  const newPrompts = [...chatbotSettings.suggestedPrompts];
                                  newPrompts[idx] = e.target.value;
                                  handleChatbotInputChange('suggestedPrompts', newPrompts);
                                }}
                                placeholder={`Starter #${idx + 1}`}
                              />
                              <button
                                onClick={() => {
                                  const newPrompts = chatbotSettings.suggestedPrompts.filter(
                                    (_, i) => i !== idx
                                  );
                                  handleChatbotInputChange('suggestedPrompts', newPrompts);
                                }}
                                className="p-2 text-neutral-300 hover:text-red-500 transition-colors cursor-pointer group-hover:scale-110"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="border-2 border-neutral-100 bg-white rounded-xl overflow-hidden flex flex-col">
                  <div className="p-8 border-b border-neutral-100 bg-neutral-50/40">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center border-2 border-neutral-100 transition-colors">
                        <BookOpen className="w-5 h-5 text-black" />
                      </div>
                      <div>
                        <h3 className="font-bold text-xl text-neutral-900">
                          Knowledge Architecture
                        </h3>
                        <p className="text-xs text-neutral-500">
                          Static facts and services injected into queries.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-8 space-y-12">
                    <div className="grid sm:grid-cols-2 gap-10">
                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-4">
                          Legacy Bio & Context Injection
                        </label>
                        <textarea
                          className="w-full px-5 py-4 bg-neutral-50 border-2 border-neutral-100 focus:border-black rounded-2xl outline-none text-sm leading-relaxed transition-all min-h-[180px] focus:bg-white"
                          value={chatbotSettings.baseKnowledge}
                          onChange={(e) =>
                            handleChatbotInputChange('baseKnowledge', e.target.value)
                          }
                          placeholder="Inject project history, skills, and personal data..."
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-4">
                          Services Taxonomy
                        </label>
                        <textarea
                          className="w-full px-5 py-4 bg-neutral-50 border-2 border-neutral-100 focus:border-black rounded-2xl outline-none text-[13px] font-mono leading-relaxed transition-all min-h-[180px] focus:bg-white"
                          value={chatbotSettings.servicesOffered}
                          onChange={(e) =>
                            handleChatbotInputChange('servicesOffered', e.target.value)
                          }
                          placeholder="JSON or List of primary business offerings..."
                        />
                      </div>
                    </div>

                    <div className="pt-8 border-t border-neutral-100">
                      <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-4">
                        Initial Salutation
                      </label>
                      <textarea
                        className="w-full px-6 py-5 bg-neutral-50 border-2 border-neutral-100 focus:border-black rounded-2xl outline-none text-[15px] font-medium leading-relaxed transition-all min-h-[120px] focus:bg-white"
                        value={chatbotSettings.welcomeMessage}
                        onChange={(e) => handleChatbotInputChange('welcomeMessage', e.target.value)}
                        placeholder="The first sentence the AI speaks when chat opens..."
                      />
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        <AgentConfigurationModal
          isOpen={isAgentModalOpen}
          onClose={() => {
            setIsAgentModalOpen(false);
            fetchAgents(); // Sync execution counts on close
          }}
          agentData={selectedAgent}
          providers={providers}
          onSave={() => {
            fetchAgents();
          }}
        />
      </div>
    </div>
  );
}
