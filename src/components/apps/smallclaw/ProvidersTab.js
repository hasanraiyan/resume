'use client';

import { useState } from 'react';
import { Server, Plus, Globe2, Edit2, Trash2, X } from 'lucide-react';
import { Card } from '@/components/custom-ui';
import { useSmallClaw } from '@/context/SmallClawContext';

export default function ProvidersTab() {
  const { providers, refreshProviders, searchQuery } = useSmallClaw();

  const [savingProvider, setSavingProvider] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [appendMode, setAppendMode] = useState(false);

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
      defaultRPM: 4,
      defaultTPM: 250000,
      defaultRPD: 2000,
      enableLimits: false,
    });
  };

  const handleEditProvider = (provider) => {
    setEditingProvider({
      ...provider,
      id: provider.providerId,
      apiKey: '',
      defaultRPM: provider.defaultRPM || 4,
      defaultTPM: provider.defaultTPM || 250000,
      defaultRPD: provider.defaultRPD || 2000,
      enableLimits: provider.enableLimits ?? false,
    });
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

      const payload = { ...editingProvider, appendKeys: appendMode };

      // Support multiple keys: split by comma or newline
      if (payload.apiKey && typeof payload.apiKey === 'string') {
        const keys = payload.apiKey
          .split(/[\n,]/)
          .map((k) => k.trim())
          .filter((k) => k.length > 0);

        if (keys.length > 1) {
          payload.apiKey = keys;
        } else if (keys.length === 1) {
          payload.apiKey = keys[0];
        }
      }

      if (!isNew && (!payload.apiKey || payload.apiKey === '***************')) {
        delete payload.apiKey;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setEditingProvider(null);
        setAppendMode(false);
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
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base text-neutral-900 leading-tight">
                      {p.name}
                    </h3>
                    <div
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tighter border ${
                        p.enableLimits
                          ? 'bg-emerald-50 text-[#1f644e] border-emerald-100'
                          : 'bg-neutral-50 text-neutral-400 border-neutral-100'
                      }`}
                    >
                      {p.enableLimits ? 'Limits ON' : 'Limits OFF'}
                    </div>
                  </div>
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

            <div className="mt-auto pt-4 border-t border-neutral-100 flex flex-col gap-3">
              {p.enableLimits && (
                <div className="space-y-3">
                  {/* Per-Key Limits */}
                  <div className="flex justify-between items-center gap-2">
                    <div className="flex flex-col">
                      <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                        RPM / Key
                      </p>
                      <p className="text-xs font-bold text-neutral-700">{p.defaultRPM || 4}</p>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                        TPM / Key
                      </p>
                      <p className="text-xs font-bold text-neutral-700">
                        {(p.defaultTPM / 1000).toFixed(0)}k
                      </p>
                    </div>
                    <div className="flex flex-col">
                      <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
                        RPD / Key
                      </p>
                      <p className="text-xs font-bold text-neutral-700">{p.defaultRPD || 2000}</p>
                    </div>
                  </div>

                  {/* Total Pool Capacity (Visible only if multiple keys) */}
                  {typeof p.apiKey === 'string' && p.apiKey.includes('Keys (Pooled)') && (
                    <div className="p-2.5 bg-[#1f644e]/5 rounded-xl border border-[#1f644e]/10">
                      <p className="text-[9px] text-[#1f644e] uppercase tracking-widest font-bold mb-1.5 opacity-80">
                        Total Pool Capacity ({parseInt(p.apiKey.split(' ')[0])} Keys)
                      </p>
                      <div className="flex justify-between items-center">
                        <div className="text-center flex-1">
                          <p className="text-[10px] text-neutral-500 font-medium">RPM</p>
                          <p className="text-xs font-bold text-[#1f644e]">
                            {(p.defaultRPM || 4) * parseInt(p.apiKey.split(' ')[0])}
                          </p>
                        </div>
                        <div className="w-px h-4 bg-[#1f644e]/10" />
                        <div className="text-center flex-1">
                          <p className="text-[10px] text-neutral-500 font-medium">TPM</p>
                          <p className="text-xs font-bold text-[#1f644e]">
                            {(
                              ((p.defaultTPM || 250000) * parseInt(p.apiKey.split(' ')[0])) /
                              1000000
                            ).toFixed(1)}
                            M
                          </p>
                        </div>
                        <div className="w-px h-4 bg-[#1f644e]/10" />
                        <div className="text-center flex-1">
                          <p className="text-[10px] text-neutral-500 font-medium">RPD</p>
                          <p className="text-xs font-bold text-[#1f644e]">
                            {(p.defaultRPD || 2000) * parseInt(p.apiKey.split(' ')[0])}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold mb-1.5">
                  API Key
                </p>
                <div className="text-xs bg-neutral-50 text-neutral-600 px-3 py-2 rounded-lg font-mono tracking-wider border border-neutral-100 truncate">
                  {p.apiKey}
                </div>
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
                  API Key(s)
                </label>
                <textarea
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 focus:border-[#1f644e] rounded-xl transition-all outline-none text-sm font-mono min-h-[100px] resize-none"
                  value={editingProvider.apiKey}
                  onChange={(e) =>
                    setEditingProvider({ ...editingProvider, apiKey: e.target.value })
                  }
                  placeholder="Paste one or more keys (newline or comma separated)"
                />
                <p className="text-[10px] text-neutral-400 mt-2 italic">
                  {editingProvider.id !== 'new' ? 'Leave blank to keep existing keys. ' : ''}
                  Separate multiple keys with a comma or new line for automatic pooling.
                </p>
              </div>

              <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                <input
                  id="enableLimits"
                  type="checkbox"
                  className="w-4 h-4 text-[#1f644e] rounded border-neutral-300 focus:ring-[#1f644e] cursor-pointer"
                  checked={editingProvider.enableLimits}
                  onChange={(e) =>
                    setEditingProvider({ ...editingProvider, enableLimits: e.target.checked })
                  }
                />
                <label
                  htmlFor="enableLimits"
                  className="text-xs font-medium text-neutral-700 cursor-pointer select-none"
                >
                  Enable Capacity Limits (RPM/TPM/RPD)
                </label>
              </div>

              {editingProvider.enableLimits && (
                <div className="grid grid-cols-3 gap-3 animate-in slide-in-from-top-1 duration-200">
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">
                      RPM
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 focus:border-[#1f644e] rounded-lg outline-none text-xs"
                      value={editingProvider.defaultRPM}
                      onChange={(e) =>
                        setEditingProvider({
                          ...editingProvider,
                          defaultRPM: parseInt(e.target.value),
                        })
                      }
                      placeholder="4"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">
                      TPM
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 focus:border-[#1f644e] rounded-lg outline-none text-xs"
                      value={editingProvider.defaultTPM}
                      onChange={(e) =>
                        setEditingProvider({
                          ...editingProvider,
                          defaultTPM: parseInt(e.target.value),
                        })
                      }
                      placeholder="250k"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest block mb-1">
                      RPD
                    </label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 focus:border-[#1f644e] rounded-lg outline-none text-xs"
                      value={editingProvider.defaultRPD}
                      onChange={(e) =>
                        setEditingProvider({
                          ...editingProvider,
                          defaultRPD: parseInt(e.target.value),
                        })
                      }
                      placeholder="2000"
                    />
                  </div>
                </div>
              )}

              {editingProvider.id !== 'new' && (
                <div className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                  <input
                    id="appendKeys"
                    type="checkbox"
                    className="w-4 h-4 text-[#1f644e] rounded border-neutral-300 focus:ring-[#1f644e] cursor-pointer"
                    checked={appendMode}
                    onChange={(e) => setAppendMode(e.target.checked)}
                  />
                  <label
                    htmlFor="appendKeys"
                    className="text-xs font-medium text-neutral-700 cursor-pointer select-none"
                  >
                    Append to existing keys
                  </label>
                </div>
              )}
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
