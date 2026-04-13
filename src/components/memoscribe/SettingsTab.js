'use client';

import React, { useState } from 'react';
import { useMemoscribe } from '@/context/MemoscribeContext';
import { Loader2, Save } from 'lucide-react';

export default function SettingsTab() {
  const { settings, saveSettings } = useMemoscribe();
  const [qdrantUrl, setQdrantUrl] = useState(settings?.qdrantUrl || '');
  const [qdrantApiKey, setQdrantApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Update local state when settings context changes
  React.useEffect(() => {
    if (settings?.qdrantUrl) setQdrantUrl(settings.qdrantUrl);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg('');
    const success = await saveSettings(qdrantUrl, qdrantApiKey);
    setSaving(false);
    if (success) {
      setSuccessMsg('Settings saved successfully!');
      setQdrantApiKey(''); // clear input for security
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold">Settings</h2>
        <p className="text-sm text-[#7c8e88] mt-1">
          Configure your Qdrant Vector Database connection for semantic search and AI features.
        </p>
      </div>

      <div className="rounded-xl border border-[#e5e3d8] bg-white p-5 space-y-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#7c8e88] mb-2">
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
            <label className="block text-xs font-bold uppercase tracking-wider text-[#7c8e88]">
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
          <p className="text-[11px] text-[#7c8e88] mt-1.5">
            Your API key is securely encrypted before being stored in the database.
          </p>
        </div>

        <div className="pt-4 border-t border-[#e5e3d8] flex justify-end items-center gap-4">
          {successMsg && <span className="text-sm font-bold text-green-600">{successMsg}</span>}
          <button
            onClick={handleSave}
            disabled={saving || !qdrantUrl}
            className="bg-[#1f644e] text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-[#17503e] transition cursor-pointer disabled:opacity-60 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
