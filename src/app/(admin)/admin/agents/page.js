'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { Sparkles, Bot, Plus, Trash2, Edit2, Server, Globe2 } from 'lucide-react';
import AgentConfigurationModal from '@/components/admin/AgentConfigurationModal';

export default function AgentsDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState('providers'); // 'providers' or 'agents'
  const [loading, setLoading] = useState(true);

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

  return (
    <AdminPageWrapper title="AI Command Hub">
      <div className="max-w-6xl mx-auto space-y-8 pb-24">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold font-['Playfair_Display'] flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-blue-500" />
            AI Command Hub
          </h1>
          <p className="text-neutral-500 mt-2">
            Centralized management for AI API Providers and intelligent Agents.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 bg-neutral-100/70 p-1.5 rounded-2xl border border-neutral-200/50">
          <button
            onClick={() => setActiveTab('providers')}
            className={`flex-1 py-3 text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'providers'
                ? 'bg-white shadow-sm ring-1 ring-neutral-200 text-black'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Server className="w-4 h-4" /> Providers
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`flex-1 py-3 text-sm font-medium rounded-xl flex items-center justify-center gap-2 transition-all ${
              activeTab === 'agents'
                ? 'bg-white shadow-sm ring-1 ring-neutral-200 text-black'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Bot className="w-4 h-4" /> Agents
          </button>
        </div>

        {/* Providers Tab */}
        {activeTab === 'providers' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">API Providers</h2>
              <button
                onClick={handleAddProvider}
                className="px-4 py-2 bg-black text-white rounded-xl text-sm font-medium flex items-center gap-2"
              >
                <Plus className="w-4 h-4" /> Add Provider
              </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {providers.map((p) => (
                <div key={p.providerId} className="bg-white border rounded-2xl p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-bold flex items-center gap-2">
                        <Globe2 className="w-4 h-4 text-neutral-400" />
                        {p.name}
                      </h3>
                      <p className="text-xs text-neutral-500 font-mono mt-1">{p.baseUrl}</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditProvider(p)}
                        className="p-2 text-neutral-400 hover:text-blue-500 bg-neutral-50 rounded-lg"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProvider(p.providerId)}
                        className="p-2 text-neutral-400 hover:text-red-500 bg-neutral-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs bg-neutral-100 text-neutral-500 p-2 rounded max-w-fit font-mono tracking-wider">
                    {p.apiKey}
                  </div>
                </div>
              ))}
            </div>

            {providers.length === 0 && (
              <div className="text-center p-12 border border-dashed rounded-2xl bg-neutral-50 text-neutral-500">
                No API Providers configured. Add an OpenAI or Google API key to begin.
              </div>
            )}

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
          <div className="space-y-6 animate-in fade-in">
            <h2 className="text-xl font-semibold">Registered Agents</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agents.map((agent) => (
                <div
                  key={agent.agentId}
                  className="bg-white border hover:border-blue-500 rounded-2xl p-5 shadow-sm transition-all cursor-pointer group"
                  onClick={() => {
                    setSelectedAgent(agent);
                    setIsAgentModalOpen(true);
                  }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm">{agent.name}</h3>
                      <p className="text-xs text-neutral-500 capitalize">{agent.category}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 text-[10px] mt-4 uppercase font-bold text-neutral-400">
                    <span
                      className={`px-2 py-1 rounded-full ${agent.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                    >
                      {agent.isActive ? 'Active' : 'Offline'}
                    </span>
                    {agent.model && (
                      <span className="px-2 py-1 bg-neutral-100 rounded-full">{agent.model}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
    </AdminPageWrapper>
  );
}
