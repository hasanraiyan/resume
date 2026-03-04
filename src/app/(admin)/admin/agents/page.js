'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { Search, X, Sparkles, Bot, Plus, Trash2, Edit2, Server, Globe2, Network, Power } from 'lucide-react';
import AgentConfigurationModal from '@/components/admin/AgentConfigurationModal';
import { Card } from '@/components/ui';

export default function AgentsDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('providers'); // 'providers' or 'agents'
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

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'admin') {
      router.push('/admin/login');
      return;
    }
    fetchProviders();
    fetchAgents();
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

  return (
    <div className="space-y-8 pb-24">
      {/* Page Header */}
      <div className="border-b border-neutral-200 pb-8">
        <h1 className="text-4xl font-bold text-black font-['Playfair_Display'] mb-8">
          AI Command Hub
        </h1>

        {/* Search */}
        <div className="max-w-xl">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="w-4 h-4 text-neutral-400 group-focus-within:text-black transition-colors duration-200" />
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
                <i className="fas fa-times-circle text-base group-hover:scale-110 transition-transform duration-200"></i>
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

      <div className="max-w-6xl mx-auto space-y-12 pb-24">
        {/* Tabs Navigation */}
        <div className="flex border-b border-neutral-200">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab('providers')}
              className={`flex items-center gap-2 py-4 text-sm font-semibold transition-colors relative px-2 ${
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
              className={`flex items-center gap-2 py-4 text-sm font-semibold transition-colors relative px-2 ${
                activeTab === 'agents' ? 'text-black' : 'text-neutral-500 hover:text-neutral-800'
              }`}
            >
              <Network className="w-4 h-4" />
              <span>Active Agents</span>
              {activeTab === 'agents' && (
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
                className="px-5 py-2.5 bg-black hover:bg-neutral-800 transition-colors text-white rounded-xl text-sm font-medium flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Add New Provider
              </button>
            </div>

            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProviders.map((p) => (
                <Card
                  key={p.providerId}
                  className="p-6 border border-neutral-200 shadow-sm hover:shadow-md transition-shadow bg-white rounded-2xl flex flex-col h-full"
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
                        className="p-1.5 text-neutral-400 hover:text-black hover:bg-neutral-100 rounded-lg transition-colors"
                        aria-label="Edit Provider"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProvider(p.providerId)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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
                  className="mt-6 px-6 py-2.5 bg-white border border-neutral-300 hover:border-black transition-colors rounded-xl text-sm font-medium text-black shadow-sm"
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
                      className="flex-1 py-2 rounded-lg border text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveProvider}
                      disabled={savingProvider}
                      className="flex-1 py-2 rounded-lg bg-black text-white text-sm font-medium"
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
                  className="group flex flex-col h-full bg-white border border-neutral-200 rounded-2xl overflow-hidden cursor-pointer hover:border-black transition-all duration-300"
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
                      <p className="text-sm text-neutral-600 line-clamp-2 mt-2 mb-6 flex-1">
                        {agent.description}
                      </p>
                    )}

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

        <AgentConfigurationModal
          isOpen={isAgentModalOpen}
          onClose={() => setIsAgentModalOpen(false)}
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
