'use client';

import React, { useState } from 'react';
import { useMemoscribe } from '@/context/MemoscribeContext';
import { Loader2, Save, Cpu, Database } from 'lucide-react';

export default function SettingsTab() {
  const { settings, saveSettings, aiConfigs, providers, saveAiConfig } = useMemoscribe();
  const [qdrantUrl, setQdrantUrl] = useState(settings?.qdrantUrl || '');
  const [qdrantApiKey, setQdrantApiKey] = useState('');

  const [chatProviderId, setChatProviderId] = useState(aiConfigs?.chat?.providerId || '');
  const [chatModel, setChatModel] = useState(aiConfigs?.chat?.model || '');
  const [embedProviderId, setEmbedProviderId] = useState(aiConfigs?.embedder?.providerId || '');
  const [embedModel, setEmbedModel] = useState(aiConfigs?.embedder?.model || '');

  const [saving, setSaving] = useState(false);
  const [savingAI, setSavingAI] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Update local state when settings context changes
  React.useEffect(() => {
    if (settings?.qdrantUrl) setQdrantUrl(settings.qdrantUrl);
  }, [settings]);

  React.useEffect(() => {
    if (aiConfigs?.chat?.providerId) setChatProviderId(aiConfigs.chat.providerId);
    if (aiConfigs?.chat?.model) setChatModel(aiConfigs.chat.model);
    if (aiConfigs?.embedder?.providerId) setEmbedProviderId(aiConfigs.embedder.providerId);
    if (aiConfigs?.embedder?.model) setEmbedModel(aiConfigs.embedder.model);
  }, [aiConfigs]);

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg('');
    const success = await saveSettings(qdrantUrl, qdrantApiKey);
    setSaving(false);
    if (success) {
      setSuccessMsg('Qdrant settings saved!');
      setQdrantApiKey(''); // clear input for security
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleSaveAI = async () => {
    setSavingAI(true);
    setSuccessMsg('');
    const success = await saveAiConfig(
      { providerId: chatProviderId, model: chatModel },
      { providerId: embedProviderId, model: embedModel }
    );
    setSavingAI(false);
    if (success) {
      setSuccessMsg('AI Engine updated!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Settings</h2>
          <p className="text-sm text-[#7c8e88] mt-1">
            Configure your AI engine and Vector Database.
          </p>
        </div>
        {successMsg && (
          <span className="text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100 animate-pulse">
            {successMsg}
          </span>
        )}
      </div>

      {/* AI ENGINE SECTION */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-[#1f644e]">
          <Cpu className="w-4 h-4" />
          <h3 className="text-sm font-bold uppercase tracking-wider">AI Reasoning & Embeddings</h3>
        </div>

        <div className="rounded-xl border border-[#e5e3d8] bg-white overflow-hidden">
          <div className="p-5 space-y-6">
            {/* Reasoning Engine */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-tighter text-[#7c8e88]">
                  Reasoning Provider (Chat)
                </label>
                <select
                  value={chatProviderId}
                  onChange={(e) => setChatProviderId(e.target.value)}
                  className="w-full rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] py-2 px-3 text-sm outline-none focus:border-[#1f644e]"
                >
                  <option value="">Select Provider</option>
                  {providers.map((p) => (
                    <option key={p.providerId} value={p.providerId}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-tighter text-[#7c8e88]">
                  Reasoning Model
                </label>
                <input
                  type="text"
                  value={chatModel}
                  onChange={(e) => setChatModel(e.target.value)}
                  placeholder="e.g. gpt-4o or gemini-1.5-pro"
                  className="w-full rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] py-2 px-3 text-sm outline-none focus:border-[#1f644e]"
                />
              </div>
            </div>

            {/* Embedding Engine */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-[#f0f0eb]">
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-tighter text-[#7c8e88]">
                  Embedding Provider
                </label>
                <select
                  value={embedProviderId}
                  onChange={(e) => setEmbedProviderId(e.target.value)}
                  className="w-full rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] py-2 px-3 text-sm outline-none focus:border-[#1f644e]"
                >
                  <option value="">Select Provider</option>
                  {providers.map((p) => (
                    <option key={p.providerId} value={p.providerId}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-bold uppercase tracking-tighter text-[#7c8e88]">
                  Embedding Model
                </label>
                <input
                  type="text"
                  value={embedModel}
                  onChange={(e) => setEmbedModel(e.target.value)}
                  placeholder="e.g. text-embedding-004"
                  className="w-full rounded-xl border border-[#e5e3d8] bg-[#fcfbf5] py-2 px-3 text-sm outline-none focus:border-[#1f644e]"
                />
              </div>
            </div>
          </div>

          <div className="bg-[#fcfbf5] px-5 py-3 border-t border-[#e5e3d8] flex justify-end">
            <button
              onClick={handleSaveAI}
              disabled={savingAI}
              className="bg-[#1f644e] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#17503e] transition flex items-center gap-2 disabled:opacity-50"
            >
              {savingAI ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Save className="w-3 h-3" />
              )}
              Update AI Engine
            </button>
          </div>
        </div>
      </section>

      {/* DATABASE SECTION */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 text-[#1f644e]">
          <Database className="w-4 h-4" />
          <h3 className="text-sm font-bold uppercase tracking-wider">Vector Database (Qdrant)</h3>
        </div>

        <div className="rounded-xl border border-[#e5e3d8] bg-white p-5 space-y-5">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-tighter text-[#7c8e88] mb-2">
              Qdrant Cluster URL
            </label>
            <input
              type="text"
              value={qdrantUrl}
              onChange={(e) => setQdrantUrl(e.target.value)}
              placeholder="https://your-cluster.qdrant.tech:6333"
              className="w-full rounded-xl border border-[#e5e3d8] bg-white py-2.5 px-4 text-sm outline-none transition placeholder:text-[#7c8e88] focus:border-[#1f644e]"
            />
          </div>

          <div>
            <div className="flex justify-between items-end mb-2">
              <label className="block text-[10px] font-bold uppercase tracking-tighter text-[#7c8e88]">
                Qdrant API Key
              </label>
              {settings?.hasApiKey && (
                <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded">
                  Key Saved
                </span>
              )}
            </div>
            <input
              type="password"
              value={qdrantApiKey}
              onChange={(e) => setQdrantApiKey(e.target.value)}
              placeholder={
                settings?.hasApiKey
                  ? '•••••••••••••••• (Leave blank to keep current)'
                  : 'Enter API Key'
              }
              className="w-full rounded-xl border border-[#e5e3d8] bg-white py-2.5 px-4 text-sm outline-none transition placeholder:text-[#7c8e88] focus:border-[#1f644e]"
            />
          </div>

          <div className="pt-4 border-t border-[#e5e3d8] flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving || !qdrantUrl}
              className="bg-[#1f644e] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#17503e] transition cursor-pointer disabled:opacity-60 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save DB Config
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
