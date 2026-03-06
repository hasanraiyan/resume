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
import {
  Save,
  X,
  Bot,
  Cpu,
  Settings2,
  Webhook,
  Plug,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
} from 'lucide-react';

import { AGENT_IDS } from '@/lib/constants/agents';

export default function AgentConfigurationModal({ isOpen, onClose, agentData, providers, onSave }) {
  const [activeTab, setActiveTab] = useState('engine'); // 'engine', 'tools', 'mcp', 'persona'
  const [settings, setSettings] = useState({
    providerId: '',
    model: '',
    persona: '',
    isActive: true,
    tools: [],
    activeMCPs: [],
    metadata: {},
  });

  const [models, setModels] = useState([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mcpServers, setMcpServers] = useState([]);
  const [fetchingMCPs, setFetchingMCPs] = useState(false);

  const fetchMCPs = async () => {
    setFetchingMCPs(true);
    try {
      const res = await fetch('/api/admin/chatbot/mcp');
      if (res.ok) {
        const data = await res.json();
        setMcpServers(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to fetch MCP servers:', error);
    } finally {
      setFetchingMCPs(false);
    }
  };

  useEffect(() => {
    if (isOpen && agentData) {
      setSettings({
        providerId: agentData.providerId || '',
        model: agentData.model || '',
        persona: agentData.persona || '',
        isActive: agentData.isActive ?? true,
        tools: agentData.tools || [],
        activeMCPs: agentData.activeMCPs || [],
        metadata: agentData.metadata || {},
      });
      if (agentData.providerId) {
        fetchModels(agentData.providerId);
      } else {
        setModels([]);
      }
      fetchMCPs();
      setActiveTab('engine'); // Reset tab on open
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

  const toggleMCP = (mcpId) => {
    setSettings((prev) => {
      const current = prev.activeMCPs || [];
      if (current.includes(mcpId)) {
        return { ...prev, activeMCPs: current.filter((id) => id !== mcpId) };
      }
      return { ...prev, activeMCPs: [...current, mcpId] };
    });
  };

  if (!agentData) return null;

  const tabs = [
    { id: 'engine', label: 'Engine', icon: Bot },
    { id: 'tools', label: 'Tools', icon: Webhook },
    { id: 'mcp', label: 'MCP', icon: Plug },
    { id: 'persona', label: 'Persona', icon: Settings2 },
  ];

  if (agentData.agentId === AGENT_IDS.TELEGRAM_BOT) {
    tabs.push({ id: 'integration', label: 'Integration', icon: MessageCircle });
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-white gap-0">
        {/* Header Section */}
        <div className="bg-neutral-50 px-6 py-5 border-b border-neutral-200">
          <DialogHeader className="mb-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border ${settings.isActive ? 'bg-black text-white border-black' : 'bg-white text-neutral-400 border-neutral-200'}`}
                >
                  <Cpu className="w-6 h-6" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold font-['Playfair_Display'] text-neutral-900">
                    {agentData.name}
                  </DialogTitle>
                  <p className="text-sm text-neutral-500 mt-1 line-clamp-1">
                    {agentData.description}
                  </p>
                </div>
              </div>
              <label
                className="relative inline-flex items-center cursor-pointer"
                aria-label="Toggle Agent Status"
              >
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.isActive}
                  onChange={(e) => setSettings({ ...settings, isActive: e.target.checked })}
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black"></div>
                <span className="ml-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  {settings.isActive ? 'Active' : 'Offline'}
                </span>
              </label>
            </div>
          </DialogHeader>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-neutral-200 px-2 bg-neutral-50/50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                  isActive ? 'text-black' : 'text-neutral-500 hover:text-neutral-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-black rounded-t-full"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Areas */}
        <div className="p-6 min-h-[320px] max-h-[60vh] overflow-y-auto">
          {/* Engine Tab */}
          {activeTab === 'engine' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="space-y-4">
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
                    <div className="flex items-center gap-1.5 mt-2 text-amber-600 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                      <AlertCircle className="w-4 h-4" />
                      <p className="text-xs font-medium">
                        No models loaded. Please check the API Key configuration for this provider.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tools Tab */}
          {activeTab === 'tools' && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              {!agentData.tools || agentData.tools.length === 0 ? (
                <div className="text-center p-8 border border-dashed border-neutral-200 rounded-2xl bg-neutral-50 flex flex-col items-center">
                  <Webhook className="w-8 h-8 text-neutral-300 mb-3" />
                  <p className="text-sm text-neutral-500">
                    This agent has no built-in tools configured.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {agentData.tools.map((tool) => {
                    const isEnabled = settings.tools.includes(tool);
                    return (
                      <button
                        key={tool}
                        onClick={() => toggleTool(tool)}
                        className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-left ${
                          isEnabled
                            ? 'bg-neutral-900 border-black text-white shadow-sm'
                            : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-300 hover:bg-neutral-50'
                        }`}
                      >
                        <span className="text-sm font-medium font-mono">{tool}</span>
                        {isEnabled && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MCP Tab */}
          {activeTab === 'mcp' && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              {fetchingMCPs ? (
                <div className="text-center p-8 text-sm text-neutral-500">Loading servers...</div>
              ) : mcpServers.length === 0 ? (
                <div className="text-center p-8 border border-dashed border-neutral-200 rounded-2xl bg-neutral-50 flex flex-col items-center">
                  <Plug className="w-8 h-8 text-neutral-300 mb-3" />
                  <p className="text-sm text-neutral-600 mb-2">No MCP servers available.</p>
                  <a
                    href="/admin/chatbot"
                    className="text-sm font-medium text-black underline underline-offset-4 hover:text-neutral-600"
                  >
                    Configure one in Chatbot settings
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  {mcpServers.map((mcp) => {
                    const isAssigned = settings.activeMCPs.includes(mcp._id);
                    return (
                      <button
                        key={mcp._id}
                        type="button"
                        onClick={() => toggleMCP(mcp._id)}
                        className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-left border transition-all ${
                          isAssigned
                            ? 'bg-neutral-900 border-black text-white shadow-sm'
                            : 'bg-white border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-colors ${
                            isAssigned
                              ? 'bg-white text-black'
                              : 'border-2 border-neutral-300 bg-transparent'
                          }`}
                        >
                          {isAssigned && <CheckCircle2 className="w-5 h-5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p
                              className={`text-sm font-semibold truncate ${isAssigned ? 'text-white' : 'text-neutral-900'}`}
                            >
                              {mcp.name}
                            </p>
                            {!mcp.isActive && (
                              <span className="text-[10px] uppercase font-bold text-red-500 bg-red-50/10 border border-red-500/20 px-1.5 py-0.5 rounded">
                                Offline
                              </span>
                            )}
                          </div>
                          {mcp.description && (
                            <p
                              className={`text-xs truncate mt-0.5 ${isAssigned ? 'text-neutral-300' : 'text-neutral-500'}`}
                            >
                              {mcp.description}
                            </p>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Persona Tab */}
          {activeTab === 'persona' && (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200 h-full flex flex-col">
              <div>
                <p className="text-sm text-neutral-600 mb-3">
                  Define specialized instructions that will be injected into this agent's system
                  prompt context. Use this to guide behavior, tone, or specific operational
                  constraints.
                </p>
              </div>
              <textarea
                value={settings.persona}
                onChange={(e) => setSettings((prev) => ({ ...prev, persona: e.target.value }))}
                className="flex-1 min-h-[150px] w-full p-4 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all text-sm leading-relaxed text-neutral-800 resize-y shadow-sm"
                placeholder="e.g., 'You are a strict code reviewer. Always focus on performance and security. Do not provide code examples unless explicitly requested...'"
              />
            </div>
          )}

          {/* Integration Tab */}
          {activeTab === 'integration' && agentData.agentId === AGENT_IDS.TELEGRAM_BOT && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 mb-1">
                    Telegram Bot Token
                  </label>
                  <input
                    type="password"
                    value={settings.metadata?.telegramBotToken || ''}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        metadata: { ...prev.metadata, telegramBotToken: e.target.value },
                      }))
                    }
                    placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
                    className="w-full p-3 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all text-sm text-neutral-800 shadow-sm"
                  />
                  <p className="text-xs text-neutral-500 mt-1.5">
                    Obtain this token by talking to the BotFather on Telegram.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-neutral-900 mb-1">
                    Webhook URL
                  </label>
                  <input
                    type="url"
                    value={settings.metadata?.webhookUrl || ''}
                    onChange={(e) =>
                      setSettings((prev) => ({
                        ...prev,
                        metadata: { ...prev.metadata, webhookUrl: e.target.value },
                      }))
                    }
                    placeholder="https://yourdomain.com/api/webhooks/telegram"
                    className="w-full p-3 bg-white border border-neutral-200 rounded-xl focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all text-sm text-neutral-800 shadow-sm"
                  />
                  <p className="text-xs text-neutral-500 mt-1.5">
                    The absolute URL where Telegram will send updates. Example:
                    https://hasanraiyan.vercel.app/api/webhooks/telegram
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-200">
          <DialogFooter className="flex-col sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl flex-1 justify-center bg-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              isLoading={saving}
              className="rounded-xl bg-black hover:bg-neutral-800 text-white flex-1 justify-center shadow-md"
            >
              <Save className="w-4 h-4 mr-2" /> Save Configuration
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
