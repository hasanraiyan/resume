'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import Button from '@/components/ui/Button';
import CustomDropdown from '@/components/CustomDropdown';
import { Sparkles, Save, X, Bot, ShieldAlert, Cpu, Settings2, Webhook } from 'lucide-react';

export default function AgentConfigurationModal({ isOpen, onClose, agentData, providers, onSave }) {
  const [settings, setSettings] = useState({
    providerId: '',
    model: '',
    persona: '',
    isActive: true,
    tools: [],
  });

  const [models, setModels] = useState([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen && agentData) {
      setSettings({
        providerId: agentData.providerId || '',
        model: agentData.model || '',
        persona: agentData.persona || '',
        isActive: agentData.isActive ?? true,
        tools: agentData.tools || [],
      });
      if (agentData.providerId) {
        fetchModels(agentData.providerId);
      } else {
        setModels([]);
      }
    }
  }, [isOpen, agentData]);

  const fetchModels = async (providerId) => {
    if (!providerId) return;
    setFetchingModels(true);
    try {
      const response = await fetch(
        `/api/media/models?providerId=${encodeURIComponent(providerId)}`
      );
      if (response.ok) {
        const data = await response.json();
        setModels(Array.isArray(data.models) ? data.models : []);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      setModels([]);
    } finally {
      setFetchingModels(false);
    }
  };

  const handleProviderChange = (e) => {
    const providerId = e.target.value;
    setSettings((prev) => ({ ...prev, providerId, model: '' }));
    setModels([]);
    fetchModels(providerId);
  };

  const handleSave = async () => {
    if (!agentData) return;

    setSaving(true);
    try {
      const response = await fetch(`/api/admin/agents/${agentData.agentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        onSave();
        onClose();
      } else {
        alert('Failed to save settings.');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const toggleTool = (toolName) => {
    setSettings((prev) => {
      const currentTools = prev.tools || [];
      if (currentTools.includes(toolName)) {
        return { ...prev, tools: currentTools.filter((t) => t !== toolName) };
      }
      return { ...prev, tools: [...currentTools, toolName] };
    });
  };

  if (!agentData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold font-['Playfair_Display']">
                {agentData.name}
              </DialogTitle>
              <p className="text-xs text-neutral-500 mt-1">{agentData.description}</p>
            </div>
          </div>
        </DialogHeader>

        <div className="py-2 space-y-6">
          <div className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border">
            <div>
              <h4 className="text-sm font-semibold">Agent Status</h4>
              <p className="text-xs text-neutral-500 mt-0.5">
                Toggle whether this agent can execute commands.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.isActive}
                onChange={(e) => setSettings({ ...settings, isActive: e.target.checked })}
              />
              <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
              <Bot className="w-3 h-3" />
              Engine Configuration
            </h4>
            <CustomDropdown
              label="API Provider"
              value={settings.providerId}
              onChange={handleProviderChange}
              options={[
                { value: '', label: 'Inherit Default' },
                ...providers.map((p) => ({ value: p.providerId, label: p.name })),
              ]}
            />

            <div className="space-y-1">
              <CustomDropdown
                label="Execution Model"
                value={settings.model}
                onChange={(e) => setSettings((prev) => ({ ...prev, model: e.target.value }))}
                isLoading={fetchingModels}
                disabled={!settings.providerId}
                options={[
                  {
                    value: '',
                    label: settings.providerId ? 'Select Model' : 'Select provider first',
                  },
                  ...models.map((m) => ({ value: m, label: m })),
                ]}
              />
              {settings.providerId && models.length === 0 && !fetchingModels && (
                <p className="text-[10px] text-amber-600">
                  No models loaded. Is the API Key correct?
                </p>
              )}
            </div>
          </div>

          {agentData.tools && agentData.tools.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-neutral-100">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
                <Webhook className="w-3 h-3" />
                Tool Permissions
              </h4>
              <div className="flex flex-wrap gap-2">
                {agentData.tools.map((tool) => {
                  const isEnabled = settings.tools.includes(tool);
                  return (
                    <button
                      key={tool}
                      onClick={() => toggleTool(tool)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        isEnabled
                          ? 'bg-blue-50 border-blue-200 text-blue-700'
                          : 'bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50'
                      }`}
                    >
                      {tool}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="space-y-2 pt-4 border-t border-neutral-100">
            <label className="text-sm font-medium text-neutral-800 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-neutral-400" />
              System Persona Instructions
            </label>
            <textarea
              value={settings.persona}
              onChange={(e) => setSettings((prev) => ({ ...prev, persona: e.target.value }))}
              rows={4}
              className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm leading-relaxed"
              placeholder="Optional system string injected into the agent's context..."
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2 mt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl flex-1"
          >
            <X className="w-4 h-4 mr-2" /> Cancel
          </Button>
          <Button
            onClick={handleSave}
            isLoading={saving}
            className="rounded-xl bg-black hover:bg-neutral-800 text-white flex-1"
          >
            <Save className="w-4 h-4 mr-2" /> Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
