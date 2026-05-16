'use client';

import { useState, useEffect } from 'react';
import { Bot, Save, PlusCircle, X, Sparkles, ShieldCheck, MessageSquare } from 'lucide-react';
import { Card } from '@/components/custom-ui';
import { useSmallClaw } from '@/context/SmallClawContext';

export default function AssistantTab() {
  const { chatbotSettings, refreshChatbotSettings } = useSmallClaw();

  const [localSettings, setLocalSettings] = useState(chatbotSettings);
  const [saving, setSaving] = useState(false);

  // Synchronize local state with context when data is loaded
  useEffect(() => {
    setLocalSettings(chatbotSettings);
  }, [chatbotSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localSettings),
      });

      if (res.ok) {
        refreshChatbotSettings();
        alert('Assistant settings saved successfully!');
      } else {
        alert('Failed to save settings.');
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setLocalSettings((prev) => ({ ...prev, [field]: value }));
  };

  const updateArrayField = (field, index, value) => {
    const newArray = [...localSettings[field]];
    newArray[index] = value;
    updateField(field, newArray);
  };

  const addArrayItem = (field) => {
    updateField(field, [...localSettings[field], '']);
  };

  const removeArrayItem = (field, index) => {
    const newArray = localSettings[field].filter((_, i) => i !== index);
    updateField(field, newArray);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold font-[family-name:var(--font-playfair)] text-[#1e3a34]">
            Assistant Configuration
          </h2>
          <p className="text-sm text-neutral-500 mt-1">
            Configure Kiro, your system's default AI assistant.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-[#1f644e] hover:bg-[#164d3c] text-white rounded-xl text-sm font-bold uppercase tracking-widest flex items-center gap-2 transition-all disabled:bg-neutral-300 shadow-lg"
        >
          <Save size={18} />
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="grid gap-6">
        <Card className="p-8 border-2 border-neutral-100 bg-white rounded-3xl space-y-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#1e3a34] mb-2">
                <Bot size={20} />
                <h3 className="font-bold uppercase tracking-widest text-xs">Identity</h3>
              </div>
              <div>
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">
                  Assistant Name
                </label>
                <input
                  className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 focus:border-[#1f644e] rounded-xl text-sm outline-none transition-all"
                  value={localSettings.aiName}
                  onChange={(e) => updateField('aiName', e.target.value)}
                  placeholder="Kiro"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">
                  Default Engine
                </label>
                <select
                  className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 focus:border-[#1f644e] rounded-xl text-sm outline-none cursor-pointer"
                  value={localSettings.defaultEngine}
                  onChange={(e) => updateField('defaultEngine', e.target.value)}
                >
                  <option value="fast">Fast (GPT-4o mini)</option>
                  <option value="powerful">Powerful (GPT-4o)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#1e3a34] mb-2">
                <Sparkles size={20} />
                <h3 className="font-bold uppercase tracking-widest text-xs">Persona</h3>
              </div>
              <div>
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">
                  Tone & Style
                </label>
                <textarea
                  className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 focus:border-[#1f644e] rounded-xl text-sm outline-none resize-none h-[124px]"
                  value={localSettings.persona}
                  onChange={(e) => updateField('persona', e.target.value)}
                  placeholder="Helpful, professional, and concise..."
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[#1e3a34] mb-2">
              <ShieldCheck size={20} />
              <h3 className="font-bold uppercase tracking-widest text-xs">Knowledge Base</h3>
            </div>
            <textarea
              className="w-full px-4 py-3 bg-neutral-50 border-2 border-neutral-100 focus:border-[#1f644e] rounded-xl text-sm outline-none resize-none h-40 font-mono"
              value={localSettings.baseKnowledge}
              onChange={(e) => updateField('baseKnowledge', e.target.value)}
              placeholder="Core information the assistant should always know..."
            />
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#1e3a34]">
                <MessageSquare size={20} />
                <h3 className="font-bold uppercase tracking-widest text-xs">Suggested Prompts</h3>
              </div>
              <button
                onClick={() => addArrayItem('suggestedPrompts')}
                className="text-[#1e3a34] hover:scale-110 transition-transform cursor-pointer"
              >
                <PlusCircle size={20} />
              </button>
            </div>
            <div className="grid gap-3">
              {localSettings.suggestedPrompts.map((prompt, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    className="flex-1 px-4 py-2 bg-neutral-50 border border-neutral-200 focus:border-[#1f644e] rounded-xl text-sm outline-none"
                    value={prompt}
                    onChange={(e) => updateArrayField('suggestedPrompts', index, e.target.value)}
                    placeholder="Ask about..."
                  />
                  <button
                    onClick={() => removeArrayItem('suggestedPrompts', index)}
                    className="p-2 text-neutral-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
