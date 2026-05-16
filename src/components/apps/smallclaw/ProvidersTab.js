'use client';

import { useState } from 'react';
import { Server, Plus, Globe2, Edit2, Trash2, X } from 'lucide-react';
import { Card } from '@/components/custom-ui';
import { useSmallClaw } from '@/context/SmallClawContext';

export default function ProvidersTab() {
  const { providers, refreshProviders, searchQuery } = useSmallClaw();

  const [savingProvider, setSavingProvider] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);

  const filteredProviders = providers.filter(
    (p) =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.baseUrl?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddProvider = () => {
    setEditingProvider({
      id: 'new',
      name: '',
      baseUrl: '',
      apiKey: '',
    });
  };

  const handleEditProvider = (provider) => {
    setEditingProvider({ ...provider, id: provider.providerId, apiKey: '' });
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
        refreshProviders();
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
      if (res.ok) refreshProviders();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-playfair)] text-[#1e3a34]">
            API Configuration
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Manage connection keys for external LLM services.
          </p>
        </div>
        <button
          onClick={handleAddProvider}
          className="px-5 py-2.5 bg-[#1f644e] hover:bg-[#164d3c] transition-colors text-white rounded-xl text-sm font-medium flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add New Provider
        </button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredProviders.map((p) => (
          <Card
            key={p.providerId}
            interactive
            className="p-6 border-2 border-neutral-100 hover:border-[#1f644e] transition-all bg-white rounded-xl flex flex-col h-full cursor-pointer overflow-hidden relative"
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
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditProvider(p);
                  }}
                  className="p-1.5 text-neutral-400 hover:text-[#1e3a34] hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                  aria-label="Edit Provider"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProvider(p.providerId);
                  }}
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
            Connect an API provider like OpenAI or Anthropic to start powering your intelligent
            agents.
          </p>
          <button
            onClick={handleAddProvider}
            className="mt-6 px-6 py-2.5 bg-white border border-neutral-300 hover:border-[#1f644e] transition-colors rounded-xl text-sm font-medium text-[#1e3a34] cursor-pointer"
          >
            Configure Provider
          </button>
        </div>
      ) : filteredProviders.length === 0 && searchQuery ? (
        <div className="text-center p-12 border border-dashed rounded-2xl bg-neutral-50 text-neutral-500">
          No providers match your search for "{searchQuery}".
        </div>
      ) : null}

      {/* Provider Edit Modal */}
      {editingProvider && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold font-[family-name:var(--font-playfair)]">
                {editingProvider.id === 'new' ? 'New Provider' : 'Edit Provider'}
              </h3>
              <button
                onClick={() => setEditingProvider(null)}
                className="text-neutral-400 hover:text-[#1e3a34] transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                  Company / Model Name
                </label>
                <input
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 focus:border-[#1f644e] rounded-xl transition-all outline-none text-sm"
                  value={editingProvider.name}
                  onChange={(e) => setEditingProvider({ ...editingProvider, name: e.target.value })}
                  placeholder="OpenAI"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                  Base URL
                </label>
                <input
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 focus:border-[#1f644e] rounded-xl transition-all outline-none text-sm font-mono"
                  value={editingProvider.baseUrl}
                  onChange={(e) =>
                    setEditingProvider({ ...editingProvider, baseUrl: e.target.value })
                  }
                  placeholder="https://api.openai.com/v1"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                  API Key
                </label>
                <input
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 focus:border-[#1f644e] rounded-xl transition-all outline-none text-sm font-mono"
                  type="password"
                  value={editingProvider.apiKey}
                  onChange={(e) =>
                    setEditingProvider({ ...editingProvider, apiKey: e.target.value })
                  }
                  placeholder="sk-..."
                />
                {editingProvider.id !== 'new' && (
                  <p className="text-[10px] text-neutral-400 mt-2 italic">
                    Leave blank to keep existing key unchanged.
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setEditingProvider(null)}
                className="flex-1 py-3 rounded-xl border border-neutral-200 text-sm font-bold uppercase tracking-widest text-neutral-600 hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProvider}
                disabled={savingProvider}
                className="flex-1 py-3 rounded-xl bg-[#1f644e] text-white text-sm font-bold uppercase tracking-widest hover:bg-[#164d3c] transition-all cursor-pointer disabled:bg-neutral-300 disabled:cursor-not-allowed shadow-md"
              >
                {savingProvider ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
