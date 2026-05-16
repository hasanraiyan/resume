'use client';

import { useState, useEffect } from 'react';
import { Settings, Save, Plus, Shield, ShieldAlert, X } from 'lucide-react';
import { Card } from '@/components/custom-ui';
import { toast } from 'sonner';

export default function SettingsTab() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState({
    key: '',
    value: '',
    description: '',
    isEncrypted: true,
  });

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings');
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!editingSetting.key || !editingSetting.value) return;

    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingSetting),
      });

      if (res.ok) {
        toast.success('Setting saved successfully');
        setIsModalOpen(false);
        fetchSettings();
        setEditingSetting({ key: '', value: '', description: '', isEncrypted: true });
      } else {
        toast.error('Failed to save setting');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred while saving');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-playfair)] text-[#1e3a34]">
            System Settings
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Manage global application configurations and secure credentials.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 bg-[#1f644e] hover:bg-[#164d3c] transition-colors text-white rounded-xl text-sm font-medium flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Setting
        </button>
      </div>

      <div className="grid gap-4">
        {settings.map((s) => (
          <Card
            key={s.key}
            className="p-5 flex items-center justify-between group hover:border-[#1f644e] transition-all"
          >
            <div className="flex items-center gap-4">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                  s.isEncrypted
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                    : 'bg-blue-50 text-blue-600 border-blue-100'
                }`}
              >
                {s.isEncrypted ? <Shield size={18} /> : <Settings size={18} />}
              </div>
              <div>
                <h4 className="font-bold text-sm text-neutral-900 font-mono tracking-tight uppercase">
                  {s.key}
                </h4>
                <p className="text-xs text-neutral-500 mt-0.5">
                  {s.description || 'No description provided'}
                </p>
                <div className="mt-2 text-[10px] font-mono text-neutral-400 bg-neutral-50 px-2 py-1 rounded inline-block">
                  {s.value}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingSetting({ ...s, value: '' });
                setIsModalOpen(true);
              }}
              className="px-3 py-1.5 text-xs font-bold text-neutral-400 hover:text-[#1f644e] transition-colors opacity-0 group-hover:opacity-100"
            >
              Update
            </button>
          </Card>
        ))}

        {!loading && settings.length === 0 && (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-neutral-100">
            <Settings className="w-12 h-12 text-neutral-200 mx-auto mb-4" />
            <p className="text-neutral-400 text-sm">No settings configured yet.</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 space-y-6 shadow-2xl">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold font-[family-name:var(--font-playfair)]">
                Manage Setting
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-400 hover:text-[#1e3a34]"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                  Key Name (CAPITAL_LETTERS)
                </label>
                <input
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 focus:border-[#1f644e] rounded-xl outline-none text-sm font-mono"
                  value={editingSetting.key}
                  onChange={(e) =>
                    setEditingSetting({
                      ...editingSetting,
                      key: e.target.value.toUpperCase().replace(/\s/g, '_'),
                    })
                  }
                  placeholder="REDIS_URL"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                  Value
                </label>
                <textarea
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 focus:border-[#1f644e] rounded-xl outline-none text-sm font-mono min-h-[80px]"
                  value={editingSetting.value}
                  onChange={(e) => setEditingSetting({ ...editingSetting, value: e.target.value })}
                  placeholder="Paste secure value here..."
                />
              </div>
              <div>
                <label className="text-xs font-bold text-neutral-500 uppercase tracking-widest block mb-1.5">
                  Description
                </label>
                <input
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 focus:border-[#1f644e] rounded-xl outline-none text-sm"
                  value={editingSetting.description}
                  onChange={(e) =>
                    setEditingSetting({ ...editingSetting, description: e.target.value })
                  }
                  placeholder="e.g. Upstash Redis URL"
                />
              </div>

              <div className="flex items-center gap-3 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <input
                  id="isEncrypted"
                  type="checkbox"
                  className="w-4 h-4 text-[#1f644e] rounded border-neutral-300"
                  checked={editingSetting.isEncrypted}
                  onChange={(e) =>
                    setEditingSetting({ ...editingSetting, isEncrypted: e.target.checked })
                  }
                />
                <label
                  htmlFor="isEncrypted"
                  className="text-xs font-medium text-emerald-800 cursor-pointer"
                >
                  Encrypt this value in database
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 py-3 rounded-xl border border-neutral-200 text-sm font-bold uppercase tracking-widest text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 py-3 rounded-xl bg-[#1f644e] text-white text-sm font-bold uppercase tracking-widest hover:bg-[#164d3c] transition-all shadow-md"
              >
                Save Setting
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
