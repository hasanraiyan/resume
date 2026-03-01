'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import CustomDropdown from '@/components/CustomDropdown';
import Switch from '@/components/admin/Switch';
import {
  Settings,
  UserCircle,
  BookOpen,
  ShieldCheck,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  Check,
  Sparkles,
  Wrench,
  Server,
  Network,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import LucideIconPicker from '@/components/admin/LucideIconPicker';

export default function ChatbotSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [availableModels, setAvailableModels] = useState([]);
  const [fetchingModels, setFetchingModels] = useState({});

  // Form state
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', icon: Settings, desc: 'Core settings & model' },
    { id: 'providers', label: 'Providers', icon: Sparkles, desc: 'Manage AI Providers' },
    { id: 'persona', label: 'Personality', icon: UserCircle, desc: 'AI style & tone' },
    { id: 'knowledge', label: 'Knowledge', icon: BookOpen, desc: 'Base context & services' },
    { id: 'behavior', label: 'Behavior', icon: ShieldCheck, desc: 'Rules & instructions' },
    { id: 'mcp', label: 'MCP', icon: Server, desc: 'Dynamic tool servers' },
  ];

  const [formData, setFormData] = useState({
    aiName: 'Kiro',
    persona: '',
    baseKnowledge: '',
    servicesOffered: '',
    callToAction: '',
    rules: [''],
    isActive: true,
    modelName: { providerId: 'default-openai', model: 'openai-large' },
    fastModel: { providerId: '', model: '' },
    thinkingModel: { providerId: '', model: '' },
    proModel: { providerId: '', model: '' },
    defaultEngine: 'fast',
    providers: [],
  });

  const [mcpServers, setMcpServers] = useState([]);
  const [fetchingMcp, setFetchingMcp] = useState(false);
  const [mcpSaving, setMcpSaving] = useState(false);
  const [mcpError, setMcpError] = useState('');
  const [isMcpModalOpen, setIsMcpModalOpen] = useState(false);
  const [editingServer, setEditingServer] = useState(null);
  const [mcpFormData, setMcpFormData] = useState({
    name: '',
    description: '',
    url: '',
    icon: 'Server',
    isActive: true,
  });

  const [modelsByProvider, setModelsByProvider] = useState({});

  // Redirect if not admin
  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'admin') {
      router.push('/admin/login');
    }
  }, [session, status, router]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/chatbot');
      const result = await response.json();

      if (result) {
        setSettings(result);
        setFormData(result);
      }
    } catch (error) {
      console.error('Error fetching chatbot settings:', error);
      setMessage({ type: 'error', text: 'Failed to load chatbot settings' });
    } finally {
      setLoading(false);
    }
  };

  const fetchMcpServers = async () => {
    try {
      setFetchingMcp(true);
      const response = await fetch('/api/admin/chatbot/mcp');
      if (response.ok) {
        const result = await response.json();
        setMcpServers(result);
      }
    } catch (error) {
      console.error('Error fetching MCP servers:', error);
    } finally {
      setFetchingMcp(false);
    }
  };

  // Fetch settings
  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchSettings();
      fetchMcpServers();
    }
  }, [session]);

  // Fetch available models for each provider
  useEffect(() => {
    const fetchModelsForProvider = async (providerId) => {
      if (!providerId || modelsByProvider[providerId]) return;
      setFetchingModels((prev) => ({ ...prev, [providerId]: true }));
      try {
        const response = await fetch(`/api/admin/chatbot/providers/${providerId}/models`);
        if (response.ok) {
          const models = await response.json();
          setModelsByProvider((prev) => ({ ...prev, [providerId]: models }));
        }
      } catch (error) {
        console.error(`Error fetching models for provider ${providerId}:`, error);
      } finally {
        setFetchingModels((prev) => ({ ...prev, [providerId]: false }));
      }
    };

    if (session?.user?.role === 'admin' && formData.providers?.length > 0) {
      formData.providers.forEach((p) => fetchModelsForProvider(p.id));
    }
  }, [session, formData.providers, modelsByProvider]);

  const handleAddProvider = () => {
    const newId = `provider-${Date.now()}`;
    setFormData((prev) => ({
      ...prev,
      providers: [
        ...prev.providers,
        {
          id: newId,
          name: 'New Provider',
          baseUrl: 'https://api.openai.com/v1',
          apiKey: '',
          isActive: true,
          supportsTools: true,
        },
      ],
    }));
  };

  const handleUpdateProvider = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      providers: prev.providers.map((p) => (p.id === id ? { ...p, [field]: value } : p)),
    }));
  };

  const handleDeleteProvider = (id) => {
    setFormData((prev) => ({
      ...prev,
      providers: prev.providers.filter((p) => p.id !== id),
    }));
  };

  // Model slots UI generator
  const renderModelSlot = (label, name) => {
    const slotValue = formData[name] || { providerId: '', model: '' };
    const engineKey = name.replace('Model', '');
    const isDefault = formData.defaultEngine === engineKey;

    const providerOptions = [
      { value: '', label: '- Select Provider -' },
      ...(formData.providers || []).map((p) => ({ value: p.id, label: p.name })),
    ];

    const selectedProviderId = slotValue.providerId;
    const modelOptions = [
      { value: '', label: '- Select Model -' },
      ...(modelsByProvider[selectedProviderId] || []).map((m) => ({ value: m, label: m })),
    ];

    return (
      <div
        className={`space-y-4 relative bg-white p-4 rounded-xl border transition-all cursor-pointer hover:z-50 focus-within:z-50 ${
          isDefault ? 'border-blue-500 ring-1 ring-blue-500/20 shadow-sm' : 'border-neutral-200'
        }`}
        onClick={() => handleInputChange('defaultEngine', engineKey)}
      >
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm text-neutral-800 flex items-center gap-2">
            {name === 'fastModel'
              ? '🚀'
              : name === 'thinkingModel'
                ? '🧠'
                : name === 'proModel'
                  ? '👑'
                  : '🤖'}
            {label}
          </h4>
          <div
            className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              isDefault ? 'border-blue-500 bg-blue-500' : 'border-neutral-300 bg-white'
            }`}
          >
            {isDefault && <Check className="w-3 h-3 text-white stroke-[3]" />}
          </div>
        </div>
        <div className="space-y-3" onClick={(e) => e.stopPropagation()}>
          <CustomDropdown
            label="Provider"
            name={`${name}-provider`}
            value={selectedProviderId}
            onChange={(e) => {
              const newProviderId = e.target.value;
              handleInputChange(name, { providerId: newProviderId, model: '' });
            }}
            options={providerOptions}
          />
          <CustomDropdown
            label="Model"
            name={`${name}-model`}
            value={slotValue.model}
            isLoading={fetchingModels[selectedProviderId]}
            onChange={(e) =>
              handleInputChange(name, { providerId: selectedProviderId, model: e.target.value })
            }
            options={modelOptions}
          />
        </div>
      </div>
    );
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/admin/chatbot', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Chatbot settings updated successfully!' });
        setSettings(result.settings);

        // Trigger real-time update for the chatbot widget
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('chatbotSettingsUpdated'));
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update chatbot settings' });
      }
    } catch (error) {
      console.error('Error saving chatbot settings:', error);
      setMessage({ type: 'error', text: 'Failed to save changes' });
    } finally {
      setSaving(false);
    }
  }, [formData]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!saving) {
          handleSave();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [saving, handleSave]);

  const handleReset = useCallback(() => {
    if (settings) {
      setFormData(settings);
      setMessage({ type: 'info', text: 'Changes reverted to last saved version' });
    }
  }, [settings]);

  const handleInputChange = (path, value) => {
    setFormData((prev) => {
      const newData = { ...prev };
      const keys = path.split('.');
      let current = newData;

      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = value;
      return newData;
    });
  };

  const handleRuleChange = (index, value) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        rules: prev.rules.map((rule, i) => (i === index ? value : rule)),
      };

      return newData;
    });
  };

  const addRule = () => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        rules: [...prev.rules, ''],
      };

      return newData;
    });
  };

  const removeRule = (index) => {
    if (formData.rules.length > 1) {
      setFormData((prev) => {
        const newData = {
          ...prev,
          rules: prev.rules.filter((_, i) => i !== index),
        };

        return newData;
      });
    }
  };

  const handleOpenMcpModal = (server = null) => {
    setMcpError('');
    if (server) {
      setEditingServer(server);
      setMcpFormData({
        name: server.name,
        description: server.description || '',
        url: server.url,
        icon: server.icon || 'Server',
        isActive: server.isActive,
      });
    } else {
      setEditingServer(null);
      setMcpFormData({
        name: '',
        description: '',
        url: '',
        icon: 'Server',
        isActive: true,
      });
    }
    setIsMcpModalOpen(true);
  };

  const handleSaveMcp = async () => {
    try {
      setMcpSaving(true);
      setMcpError('');
      const isEdit = !!editingServer;
      const url = isEdit ? `/api/admin/chatbot/mcp/${editingServer._id}` : '/api/admin/chatbot/mcp';
      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mcpFormData),
      });

      if (response.ok) {
        setMessage({
          type: 'success',
          text: `MCP Server ${isEdit ? 'updated' : 'added'} successfully.`,
        });
        setIsMcpModalOpen(false);
        fetchMcpServers(); // reload list
      } else {
        const errorData = await response.json();
        setMcpError(errorData.error || 'Failed to save MCP server');
      }
    } catch (error) {
      console.error(error);
      setMcpError('Network error or failed to connect to MCP server');
    } finally {
      setMcpSaving(false);
    }
  };

  const handleDeleteMcp = async (id) => {
    if (!confirm('Are you sure you want to delete this MCP server?')) return;
    try {
      const response = await fetch(`/api/admin/chatbot/mcp/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setMessage({ type: 'success', text: 'MCP Server deleted successfully.' });
        fetchMcpServers();
      } else {
        setMessage({ type: 'error', text: 'Failed to delete MCP server' });
      }
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Error deleting MCP server' });
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AdminPageWrapper title="Chatbot Settings">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-neutral-600">Loading chatbot settings...</p>
          </div>
        </div>
      </AdminPageWrapper>
    );
  }

  if (!session || session.user.role !== 'admin') {
    return null;
  }

  return (
    <AdminPageWrapper>
      <div className="max-w-5xl  mx-auto pb-24">
        {/* Header */}
        <div className="mb-8 items-start flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
              <h1 className="text-3xl font-bold text-black font-['Playfair_Display']">
                AI Assistant Configuration
              </h1>
            </div>
            <p className="text-neutral-600 max-w-2xl">
              Configure your AI assistant's personality, knowledge base, and behavior. These
              settings control how the chatbot interacts with visitors on your portfolio.
            </p>
          </div>
        </div>

        {/* Success/Error Messages */}
        {message.text && (
          <div
            className={`mb-6 p-4 rounded-xl flex items-center gap-3 animate-in fade-in ${
              message.type === 'success'
                ? 'bg-green-50 text-green-800 border-green-200'
                : message.type === 'error'
                  ? 'bg-red-50 text-red-800 border-red-200'
                  : 'bg-blue-50 text-blue-800 border-blue-200'
            } border`}
          >
            <div
              className={`p-1.5 rounded-full ${message.type === 'success' ? 'bg-green-100' : message.type === 'error' ? 'bg-red-100' : 'bg-blue-100'}`}
            >
              <Check className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium">{message.text}</p>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex space-x-2 bg-neutral-100/70 p-1.5 rounded-2xl mb-8 border border-neutral-200/50 overflow-x-auto custom-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-medium transition-all flex-1 justify-center sm:justify-start min-w-[140px] outline-none ${
                activeTab === tab.id
                  ? 'bg-white text-black shadow-sm ring-1 ring-neutral-200/50 scale-[1.02]'
                  : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200/50 hover:scale-[1.01]'
              }`}
            >
              <div
                className={`p-1.5 rounded-lg transition-colors ${activeTab === tab.id ? 'bg-blue-50 text-blue-600' : 'bg-transparent text-neutral-400'}`}
              >
                <tab.icon className="w-4 h-4" />
              </div>
              <div className="flex flex-col items-start hidden sm:block text-left">
                <span className="block leading-none mb-1">{tab.label}</span>
                {/* <span
                  className={`text-[10px] font-normal leading-none ${activeTab === tab.id ? 'text-neutral-500' : 'text-neutral-400'}`}
                >
                  {tab.desc}
                </span> */}
              </div>
            </button>
          ))}
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-3xl border border-neutral-200/60 shadow-sm min-h-[400px]">
          {activeTab === 'general' && (
            <div className="p-6 sm:p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="pb-6 border-b border-neutral-100">
                <h3 className="text-lg font-semibold text-black mb-1">Basic Settings</h3>
                <p className="text-sm text-neutral-500">
                  Core configuration for your chatbot widget.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-800">
                    AI Assistant Name
                  </label>
                  <input
                    type="text"
                    value={formData.aiName}
                    onChange={(e) => handleInputChange('aiName', e.target.value)}
                    className="w-full px-4 border border-neutral-200 rounded-xl focus:ring-2 bg-neutral-50 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm h-[50px]"
                    placeholder="e.g., Kiro"
                  />
                  <p className="text-xs text-neutral-500">
                    The name visitors will see when chatting.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-800">
                    Chatbot Status
                  </label>
                  <div className="px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center w-full h-[50px]">
                    <div className="w-full">
                      <Switch
                        label="Active"
                        description=""
                        checked={formData.isActive}
                        onCheckedChange={(value) => handleInputChange('isActive', value)}
                      />
                    </div>
                  </div>
                  <p className="text-xs text-transparent select-none" aria-hidden="true">
                    Alignment spacer
                  </p>
                </div>

                <div className="space-y-6 sm:col-span-2 p-6 bg-neutral-50/50 border border-neutral-200 rounded-2xl relative z-[30]">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-900 mb-1 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-500" />
                      Widget Model Selection
                    </label>
                    <p className="text-xs text-neutral-500 mb-4">
                      Assign specific providers and models to roles. These options will appear in
                      the chatbot widget so users can choose how the AI thinks.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-6 relative z-50">
                    {renderModelSlot('Fast Engine', 'fastModel')}
                    {renderModelSlot('Thinking Engine', 'thinkingModel')}
                    {renderModelSlot('Pro Engine', 'proModel')}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'providers' && (
            <div className="p-6 sm:p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
                <div>
                  <h3 className="text-lg font-semibold text-black mb-1">AI Providers</h3>
                  <p className="text-sm text-neutral-500">
                    Configure API keys and base URLs for different AI models (OpenAI, Anthropic,
                    OpenRouter, etc.).
                  </p>
                </div>
                <button
                  onClick={handleAddProvider}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl transition-colors text-sm font-medium flex items-center gap-2 border border-neutral-200 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Add Provider
                </button>
              </div>

              <div className="space-y-6">
                {!formData.providers || formData.providers.length === 0 ? (
                  <div className="text-center p-8 border border-dashed border-neutral-300 rounded-2xl bg-neutral-50">
                    <p className="text-neutral-500 text-sm">
                      No providers configured yet. Click "Add Provider" to get started.
                    </p>
                  </div>
                ) : (
                  formData.providers.map((provider) => (
                    <div
                      key={provider.id}
                      className="p-6 border border-neutral-200 rounded-2xl bg-white shadow-sm space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-base text-black flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${provider.isActive ? 'bg-green-500' : 'bg-red-500'}`}
                          ></div>
                          {provider.name}
                        </h4>
                        <button
                          onClick={() => handleDeleteProvider(provider.id)}
                          className="text-neutral-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                          title="Delete Provider"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="block text-xs font-medium text-neutral-600">
                            Provider Name
                          </label>
                          <input
                            type="text"
                            value={provider.name}
                            onChange={(e) =>
                              handleUpdateProvider(provider.id, 'name', e.target.value)
                            }
                            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            placeholder="e.g., OpenAI"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-medium text-neutral-600">
                            Base URL
                          </label>
                          <input
                            type="text"
                            value={provider.baseUrl}
                            onChange={(e) =>
                              handleUpdateProvider(provider.id, 'baseUrl', e.target.value)
                            }
                            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            placeholder="e.g., https://api.openai.com/v1"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block text-xs font-medium text-neutral-600">
                            API Key
                          </label>
                          <input
                            type="password"
                            value={provider.apiKey === '********' ? '' : provider.apiKey}
                            onChange={(e) =>
                              handleUpdateProvider(provider.id, 'apiKey', e.target.value)
                            }
                            className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                            placeholder={
                              provider.apiKey === '********'
                                ? '******** (Encrypted)'
                                : 'Enter API Key'
                            }
                          />
                          <p className="text-[10px] text-neutral-500">
                            Leave empty to keep existing key. Never visible in frontend.
                          </p>
                        </div>

                        <div className="flex gap-4">
                          <div className="space-y-2 flex-1">
                            <label className="block text-xs font-medium text-neutral-600 mb-2">
                              Active Status
                            </label>
                            <div className="h-[38px] flex items-center">
                              <Switch
                                checked={provider.isActive}
                                onCheckedChange={(value) =>
                                  handleUpdateProvider(provider.id, 'isActive', value)
                                }
                              />
                            </div>
                          </div>
                          <div className="space-y-2 flex-1">
                            <label className="block text-xs font-medium text-neutral-600 mb-2">
                              Supports Tools
                            </label>
                            <div className="h-[38px] flex items-center">
                              <Switch
                                checked={provider.supportsTools !== false}
                                onCheckedChange={(value) =>
                                  handleUpdateProvider(provider.id, 'supportsTools', value)
                                }
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'persona' && (
            <div className="p-6 sm:p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="pb-6 border-b border-neutral-100">
                <h3 className="text-lg font-semibold text-black mb-1">AI Personality</h3>
                <p className="text-sm text-neutral-500">
                  Define how the AI should behave, its tone, and how it guides users.
                </p>
              </div>

              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-800 flex items-center gap-2">
                    <UserCircle className="w-4 h-4 text-neutral-400" />
                    Persona Description
                  </label>
                  <p className="text-xs text-neutral-500 mb-2">
                    This is the core system prompt that shapes every response.
                  </p>
                  <textarea
                    value={formData.persona}
                    onChange={(e) => handleInputChange('persona', e.target.value)}
                    rows={6}
                    className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm leading-relaxed resize-y min-h-[120px]"
                    placeholder="Describe how the AI should behave and communicate..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-neutral-400" />
                    Primary Call to Action
                  </label>
                  <p className="text-xs text-neutral-500 mb-2">
                    The message used to guide interested visitors toward the contact form.
                  </p>
                  <textarea
                    value={formData.callToAction}
                    onChange={(e) => handleInputChange('callToAction', e.target.value)}
                    rows={3}
                    className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm leading-relaxed resize-y"
                    placeholder="What should the AI say to encourage contact..."
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'knowledge' && (
            <div className="p-6 sm:p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="pb-6 border-b border-neutral-100">
                <h3 className="text-lg font-semibold text-black mb-1">Knowledge Base</h3>
                <p className="text-sm text-neutral-500">
                  Inject specific facts, services, and base context into the AI's permanent memory.
                </p>
              </div>

              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-800 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-neutral-400" />
                    Base Knowledge
                  </label>
                  <textarea
                    value={formData.baseKnowledge}
                    onChange={(e) => handleInputChange('baseKnowledge', e.target.value)}
                    rows={4}
                    className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm leading-relaxed resize-y"
                    placeholder="General information about you and your work..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-neutral-800 flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-neutral-400" />
                    Services Offered
                  </label>
                  <p className="text-xs text-neutral-500 mb-2">
                    The AI will use this list to match visitor needs to your skills. (One per line)
                  </p>
                  <textarea
                    value={formData.servicesOffered}
                    onChange={(e) => handleInputChange('servicesOffered', e.target.value)}
                    rows={5}
                    className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm leading-relaxed whitespace-pre-wrap resize-y font-mono"
                    placeholder="List your services, one per line..."
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'behavior' && (
            <div className="p-6 sm:p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
                <div>
                  <h3 className="text-lg font-semibold text-black mb-1">Behavioral Rules</h3>
                  <p className="text-sm text-neutral-500">
                    Define specific, strict rules for how the AI must handle edge cases or certain
                    prompts.
                  </p>
                </div>
                <button
                  onClick={addRule}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl transition-colors text-sm font-medium flex items-center gap-2 border border-neutral-200 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Add Rule
                </button>
              </div>

              <div className="space-y-4">
                {formData.rules.map((rule, index) => (
                  <div
                    key={index}
                    className="relative group p-5 border border-neutral-200 rounded-2xl bg-neutral-50/50 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-semibold text-xs text-blue-600 tracking-wider uppercase bg-blue-100/50 px-2 py-1 rounded">
                        Rule {index + 1}
                      </span>
                      {formData.rules.length > 1 && (
                        <button
                          onClick={() => removeRule(index)}
                          className="text-neutral-400 hover:text-red-600 text-sm transition-colors p-1.5 rounded-lg hover:bg-red-50"
                          title="Remove Rule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <textarea
                      value={rule}
                      onChange={(e) => handleRuleChange(index, e.target.value)}
                      rows={2}
                      className="w-full p-3 border border-neutral-200 rounded-xl text-sm bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-y"
                      placeholder={`Rule ${index + 1}...`}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'mcp' && (
            <div className="p-6 sm:p-8 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-100">
                <div>
                  <h3 className="text-lg font-semibold text-black mb-1">Dynamic MCP Servers</h3>
                  <p className="text-sm text-neutral-500">
                    Add Model Context Protocol (MCP) servers via SSE endpoints. This allows your
                    chatbot to access dynamic tools and external data.
                  </p>
                </div>
                <button
                  onClick={() => handleOpenMcpModal()}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-xl transition-colors text-sm font-medium flex items-center gap-2 border border-neutral-200 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Add Server
                </button>
              </div>

              <div className="space-y-6">
                {fetchingMcp ? (
                  <div className="text-center p-8 border border-dashed border-neutral-300 rounded-2xl bg-neutral-50">
                    <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-neutral-500 text-sm">Loading servers...</p>
                  </div>
                ) : mcpServers.length === 0 ? (
                  <div className="text-center p-8 border border-dashed border-neutral-300 rounded-2xl bg-neutral-50">
                    <p className="text-neutral-500 text-sm">
                      No MCP servers configured yet. Click "Add Server" to connect to an external
                      service.
                    </p>
                  </div>
                ) : (
                  mcpServers.map((server) => {
                    const IconComponent = LucideIcons[server.icon] || LucideIcons.Server;
                    return (
                      <div
                        key={server._id}
                        className="p-6 border border-neutral-200 rounded-2xl bg-white shadow-sm space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center bg-blue-50 text-blue-600 border border-blue-100`}
                            >
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-semibold text-base text-black flex items-center gap-2">
                                {server.name}
                                <span
                                  className={`text-[10px] px-2 py-0.5 rounded-full ${server.isActive ? 'bg-green-100 text-green-700' : 'bg-neutral-100 text-neutral-600'}`}
                                >
                                  {server.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </h4>
                              <p className="text-xs text-neutral-500 font-mono mt-0.5 truncate max-w-[200px] sm:max-w-md">
                                {server.url}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => handleOpenMcpModal(server)}
                              className="text-neutral-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                              title="Edit Server"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMcp(server._id)}
                              className="text-neutral-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete Server"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {server.description && (
                          <p className="text-sm text-neutral-600 border-t border-neutral-100 pt-3">
                            {server.description}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MCP Modal */}
      {isMcpModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setIsMcpModalOpen(false)}
          ></div>
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 sm:p-8 relative z-10 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold font-['Playfair_Display']">
                {editingServer ? 'Edit MCP Server' : 'Add MCP Server'}
              </h3>
              <button
                disabled={mcpSaving}
                onClick={() => setIsMcpModalOpen(false)}
                className="p-2 hover:bg-neutral-100 rounded-full transition-colors flex items-center justify-center disabled:opacity-50"
              >
                <span className="text-neutral-500 font-bold block leading-none">✕</span>
              </button>
            </div>

            {mcpError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-sm flex items-start gap-3 shadow-sm">
                <div className="p-1 bg-red-100 rounded-lg shrink-0 w-6 h-6 flex items-center justify-center font-bold text-red-600">
                  !
                </div>
                <div className="font-mono mt-0.5 break-all max-h-[150px] overflow-y-auto custom-scrollbar">
                  {mcpError}
                </div>
              </div>
            )}

            <div className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700">Server Name</label>
                <input
                  type="text"
                  value={mcpFormData.name}
                  onChange={(e) => setMcpFormData((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
                  placeholder="e.g. Memory Service"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700">SSE Endpont URL</label>
                <input
                  type="text"
                  value={mcpFormData.url}
                  onChange={(e) => setMcpFormData((p) => ({ ...p, url: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-mono"
                  placeholder="http://localhost:3001/mcp/sse"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-neutral-700">
                  Description (Optional)
                </label>
                <textarea
                  value={mcpFormData.description}
                  onChange={(e) => setMcpFormData((p) => ({ ...p, description: e.target.value }))}
                  rows={2}
                  className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm resize-y"
                  placeholder="What tools does this server provide?"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 w-full">
                  <label className="text-sm font-medium text-neutral-700">Icon</label>
                  <LucideIconPicker
                    value={mcpFormData.icon}
                    onChange={(val) => setMcpFormData((p) => ({ ...p, icon: val }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-neutral-800">
                    Active Status
                  </label>
                  <div className="px-4 h-[42px] bg-neutral-50 border border-neutral-200 rounded-xl flex items-center justify-between w-full">
                    <span className="text-sm text-neutral-600">
                      {mcpFormData.isActive ? 'Enabled' : 'Disabled'}
                    </span>
                    <Switch
                      checked={mcpFormData.isActive}
                      onCheckedChange={(value) =>
                        setMcpFormData((p) => ({ ...p, isActive: value }))
                      }
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-8 flex gap-3 justify-end">
              <button
                disabled={mcpSaving}
                onClick={() => setIsMcpModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={mcpSaving}
                onClick={handleSaveMcp}
                className="px-5 py-2.5 rounded-xl bg-black text-white text-sm font-medium hover:bg-neutral-800 transition-colors shadow-lg shadow-black/10 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {mcpSaving && (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                )}
                {mcpSaving
                  ? 'Testing Connection...'
                  : editingServer
                    ? 'Update Server'
                    : 'Add Server'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Action Footer */}
      <div className="fixed bottom-0 left-0 lg:left-64 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-neutral-200/60 z-40 transform transition-transform shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-neutral-500 hidden sm:flex">
            <span className="font-medium">Shortcut:</span>
            <code className="px-1.5 py-0.5 bg-neutral-100 border border-neutral-200 rounded font-mono text-neutral-600">
              Ctrl+S
            </code>
            <span>to save changes</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto ml-auto">
            <button
              onClick={handleReset}
              className="px-5 py-2.5 text-sm font-medium text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 transition-colors rounded-xl flex items-center justify-center gap-2 flex-1 sm:flex-none border border-neutral-200"
            >
              <RotateCcw className="w-4 h-4" /> <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2.5 text-sm font-medium text-white bg-black hover:bg-neutral-800 transition-colors rounded-xl flex items-center justify-center gap-2 disabled:opacity-70 flex-1 sm:flex-none shadow-lg shadow-black/10"
            >
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </AdminPageWrapper>
  );
}
