'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/custom-ui/Dialog';
import Button from '@/components/custom-ui/Button';
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
  BarChart3,
  RefreshCw,
  Activity,
  BookOpen,
  Wrench,
} from 'lucide-react';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { AGENT_IDS } from '@/lib/constants/agents';
import {
  getLongTermMemoryConfig,
  mergeLongTermMemoryMetadata,
} from '@/lib/agents/memory/longTermMemoryConfig';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function AgentConfigurationModal({ isOpen, onClose, agentData, providers, onSave }) {
  const [activeTab, setActiveTab] = useState('engine'); // 'engine', 'tools', 'mcp', 'persona'
  const [settings, setSettings] = useState({
    providerId: '',
    model: '',
    summaryProviderId: '',
    summaryModel: '',
    persona: '',
    isActive: true,
    tools: [],
    activeMCPs: [],
    activeSkills: [],
    metadata: {},
  });

  const [models, setModels] = useState([]);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [summaryModels, setSummaryModels] = useState([]);
  const [fetchingSummaryModels, setFetchingSummaryModels] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mcpServers, setMcpServers] = useState([]);
  const [fetchingMCPs, setFetchingMCPs] = useState(false);
  const [skills, setSkills] = useState([]);
  const [fetchingSkills, setFetchingSkills] = useState(false);

  // Metrics State
  const [metricsData, setMetricsData] = useState(null);
  const [fetchingMetrics, setFetchingMetrics] = useState(false);
  const isTelegramAgent = agentData?.agentId === AGENT_IDS.TELEGRAM_ASSISTANT;

  const getEffectiveMainProviderId = (providerId) => providerId || agentData?.defaultProvider || '';

  const fetchModelOptions = async (providerId, setTarget, setLoading) => {
    if (!providerId) {
      setTarget([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `/api/media/models?providerId=${encodeURIComponent(providerId)}`
      );
      if (response.ok) {
        const data = await response.json();
        setTarget(Array.isArray(data.models) ? data.models : []);
      } else {
        setTarget([]);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
      setTarget([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMCPs = async () => {
    setFetchingMCPs(true);
    try {
      const res = await fetch('/api/admin/mcp-servers');
      if (res.ok) {
        const data = await res.json();
        setMcpServers(Array.isArray(data.servers) ? data.servers : []);
      }
    } catch (error) {
      console.error('Failed to fetch MCP servers:', error);
    } finally {
      setFetchingMCPs(false);
    }
  };

  const fetchSkills = async () => {
    setFetchingSkills(true);
    try {
      const res = await fetch('/api/admin/skills');
      if (res.ok) {
        const data = await res.json();
        setSkills(Array.isArray(data.skills) ? data.skills : []);
      }
    } catch (error) {
      console.error('Failed to fetch skills:', error);
    } finally {
      setFetchingSkills(false);
    }
  };

  useEffect(() => {
    if (isOpen && agentData) {
      // Fetch fresh agent data to ensure activeSkills is up-to-date
      const fetchFreshAgentData = async () => {
        try {
          const res = await fetch(`/api/admin/agents/${agentData.agentId}`);
          if (res.ok) {
            const data = await res.json();
            const fresh = data.agent || agentData;

            setSettings({
              providerId: fresh.providerId || '',
              model: fresh.model || '',
              summaryProviderId: fresh.summaryProviderId || '',
              summaryModel: fresh.summaryModel || '',
              persona: fresh.persona || '',
              isActive: fresh.isActive ?? true,
              tools: fresh.tools || [],
              activeMCPs: fresh.activeMCPs || [],
              activeSkills: fresh.activeSkills || [],
              metadata: fresh.metadata || {},
            });

            const initialMainProviderId = fresh.providerId || fresh.defaultProvider || '';
            if (initialMainProviderId) {
              fetchModelOptions(initialMainProviderId, setModels, setFetchingModels);
            } else {
              setFetchingModels(false);
              setModels([]);
            }

            if (fresh.agentId === AGENT_IDS.TELEGRAM_ASSISTANT && fresh.summaryProviderId) {
              fetchModelOptions(
                fresh.summaryProviderId,
                setSummaryModels,
                setFetchingSummaryModels
              );
            } else {
              setSummaryModels([]);
              setFetchingSummaryModels(false);
            }
          } else {
            // Fallback to agentData if fetch fails
            setSettings({
              providerId: agentData.providerId || '',
              model: agentData.model || '',
              summaryProviderId: agentData.summaryProviderId || '',
              summaryModel: agentData.summaryModel || '',
              persona: agentData.persona || '',
              isActive: agentData.isActive ?? true,
              tools: agentData.tools || [],
              activeMCPs: agentData.activeMCPs || [],
              activeSkills: agentData.activeSkills || [],
              metadata: agentData.metadata || {},
            });
          }
        } catch (error) {
          console.error('Failed to fetch fresh agent data:', error);
        }
      };

      // Clear previous states to avoid flickering stale data
      setMetricsData(null);
      setModels([]);
      setFetchingMetrics(true);
      setFetchingModels(true);

      fetchFreshAgentData();
      fetchMCPs();
      fetchSkills();
      fetchMetrics(agentData.agentId);
      setActiveTab('engine'); // Reset tab on open
    }
  }, [isOpen, agentData]);

  const fetchMetrics = async (agentId) => {
    if (!agentId) return;
    setFetchingMetrics(true);
    try {
      const res = await fetch(`/api/admin/agents/${agentId}/metrics?days=30`);
      if (res.ok) {
        const data = await res.json();
        setMetricsData(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setFetchingMetrics(false);
    }
  };

  const handleProviderChange = (e) => {
    const providerId = e.target.value;
    const effectiveProviderId = getEffectiveMainProviderId(providerId);
    setSettings((prev) => ({
      ...prev,
      providerId,
      model: '',
      ...(prev.summaryProviderId ? {} : { summaryModel: '' }),
    }));
    setModels([]);
    fetchModelOptions(effectiveProviderId, setModels, setFetchingModels);
  };

  const handleSummaryProviderChange = (e) => {
    const summaryProviderId = e.target.value;
    setSettings((prev) => ({ ...prev, summaryProviderId, summaryModel: '' }));

    if (summaryProviderId) {
      fetchModelOptions(summaryProviderId, setSummaryModels, setFetchingSummaryModels);
    } else {
      setSummaryModels([]);
      setFetchingSummaryModels(false);
    }
  };

  const updateLongTermMemorySettings = (updates) => {
    setSettings((prev) => ({
      ...prev,
      metadata: mergeLongTermMemoryMetadata(prev.metadata, updates),
    }));
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

  const toggleSkill = (skillId) => {
    setSettings((prev) => {
      const current = prev.activeSkills || [];
      if (current.includes(skillId)) {
        return { ...prev, activeSkills: current.filter((id) => id !== skillId) };
      }
      return { ...prev, activeSkills: [...current, skillId] };
    });
  };

  if (!agentData) return null;

  const summaryModelOptions = settings.summaryProviderId ? summaryModels : models;
  const isFetchingSummaryModelOptions = settings.summaryProviderId
    ? fetchingSummaryModels
    : fetchingModels;
  const effectiveSummaryProviderId =
    settings.summaryProviderId || getEffectiveMainProviderId(settings.providerId);
  const longTermMemory = getLongTermMemoryConfig(settings.metadata);

  const tabs = [
    { id: 'engine', label: 'Engine', icon: Bot },
    { id: 'metrics', label: 'Metrics', icon: BarChart3 },
    { id: 'tools', label: 'Tools', icon: Webhook },
    { id: 'mcp', label: 'MCP', icon: Plug },
    { id: 'skills', label: 'Skills', icon: BookOpen },
    { id: 'persona', label: 'Persona', icon: Settings2 },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden bg-white gap-0 border-none shadow-[0_32px_128px_-16px_rgba(0,0,0,0.3)] rounded-3xl">
        {/* Header Section */}
        <div className="bg-white px-8 pt-8 pb-6 relative">
          <DialogHeader className="mb-0">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-5">
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all duration-300 border-2 ${
                    settings.isActive
                      ? 'bg-black text-white border-black'
                      : 'bg-neutral-100 text-neutral-400 border-neutral-100'
                  }`}
                >
                  <Cpu className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <DialogTitle className="text-2xl font-bold font-serif text-neutral-900 tracking-tight">
                    {agentData.name}
                  </DialogTitle>
                  <p className="text-sm text-neutral-500 mt-1.5 leading-relaxed pr-8">
                    {agentData.description}
                  </p>
                </div>
              </div>

              <div className="flex flex-col items-end gap-1.5 pr-12">
                <label
                  className="relative inline-flex items-center cursor-pointer group scale-110 origin-right transition-transform"
                  aria-label="Toggle Agent Status"
                >
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={settings.isActive}
                    onChange={(e) => setSettings({ ...settings, isActive: e.target.checked })}
                  />
                  <div className="w-10 h-5.5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-black"></div>
                </label>
                <span
                  className={`text-[10px] font-black uppercase tracking-[0.2em] ${settings.isActive ? 'text-green-600' : 'text-neutral-400'}`}
                >
                  {settings.isActive ? 'Active' : 'Offline'}
                </span>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Navigation Tabs */}
        <div className="flex px-8 border-b border-neutral-100 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-1 py-4 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer relative mr-6 last:mr-0 whitespace-nowrap shrink-0 ${
                  isActive ? 'text-black' : 'text-neutral-400 hover:text-neutral-600'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-black' : 'text-neutral-400'}`} />
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-black rounded-full"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Areas */}
        <div className="px-8 py-8 h-[480px] overflow-y-auto custom-scrollbar">
          {/* Engine Tab */}
          {activeTab === 'engine' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-6">
                <CustomDropdown
                  label="API Provider"
                  value={settings.providerId}
                  onChange={handleProviderChange}
                  options={[
                    { value: '', label: 'Inherit Default' },
                    ...providers.map((p) => ({ value: p.providerId, label: p.name })),
                  ]}
                />

                <div className="space-y-2">
                  <CustomDropdown
                    label="Execution Model"
                    value={settings.model}
                    onChange={(e) => setSettings((prev) => ({ ...prev, model: e.target.value }))}
                    isLoading={fetchingModels}
                    disabled={!getEffectiveMainProviderId(settings.providerId)}
                    options={[
                      {
                        value: '',
                        label: getEffectiveMainProviderId(settings.providerId)
                          ? 'Use Provider Default'
                          : 'Select provider first',
                      },
                      ...models.map((m) => ({ value: m, label: m })),
                    ]}
                  />
                  {getEffectiveMainProviderId(settings.providerId) &&
                    models.length === 0 &&
                    !fetchingModels && (
                      <div className="flex items-center gap-2 mt-3 text-amber-600 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <p className="text-[11px] font-medium leading-tight">
                          No models loaded. Please check the API Key configuration for this
                          provider.
                        </p>
                      </div>
                    )}
                </div>

                {isTelegramAgent && (
                  <div className="pt-6 border-t border-neutral-100 space-y-6">
                    <div className="flex items-center gap-2 mt-3 text-amber-600 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                      <MessageCircle className="w-4 h-4 shrink-0" />
                      <p className="text-[11px] font-medium leading-tight">
                        The Summary Engine is only used to compress older Telegram conversation
                        history. Tool calls and final replies still use the main execution model.
                      </p>
                    </div>

                    <CustomDropdown
                      label="Summary Provider"
                      value={settings.summaryProviderId}
                      onChange={handleSummaryProviderChange}
                      options={[
                        { value: '', label: 'Use Main Provider' },
                        ...providers.map((p) => ({ value: p.providerId, label: p.name })),
                      ]}
                    />

                    <div className="space-y-2">
                      <CustomDropdown
                        label="Summary Model"
                        value={settings.summaryModel}
                        onChange={(e) =>
                          setSettings((prev) => ({ ...prev, summaryModel: e.target.value }))
                        }
                        isLoading={isFetchingSummaryModelOptions}
                        disabled={!effectiveSummaryProviderId}
                        options={[
                          {
                            value: '',
                            label: effectiveSummaryProviderId
                              ? 'Use Main Model'
                              : 'Select provider first',
                          },
                          ...summaryModelOptions.map((m) => ({ value: m, label: m })),
                        ]}
                      />

                      {effectiveSummaryProviderId &&
                        summaryModelOptions.length === 0 &&
                        !isFetchingSummaryModelOptions && (
                          <div className="flex items-center gap-2 mt-3 text-amber-600 bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <p className="text-[11px] font-medium leading-tight">
                              No summary models loaded for this provider. Leave Summary Model blank
                              to fall back to the main model.
                            </p>
                          </div>
                        )}
                    </div>

                    <div className="pt-6 border-t border-neutral-100 space-y-5">
                      <div className="flex items-start justify-between gap-4 bg-neutral-50 p-4 rounded-2xl border border-neutral-100">
                        <div className="space-y-1.5">
                          <p className="text-xs font-bold uppercase tracking-[0.18em] text-neutral-700">
                            Long-Term Memory
                          </p>
                          <p className="text-[11px] leading-relaxed text-neutral-500 font-medium max-w-[420px]">
                            Remembers profile details and reusable facts for the same Telegram user
                            across future private-chat sessions. `/clear` only resets thread
                            history.
                          </p>
                        </div>

                        <label
                          className="relative inline-flex items-center cursor-pointer group scale-105 origin-right transition-transform shrink-0"
                          aria-label="Toggle Long-Term Memory"
                        >
                          <input
                            type="checkbox"
                            className="sr-only peer"
                            checked={longTermMemory.enabled}
                            onChange={(e) =>
                              updateLongTermMemorySettings({ enabled: e.target.checked })
                            }
                          />
                          <div className="w-10 h-5.5 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4.5 after:w-4.5 after:transition-all peer-checked:bg-black"></div>
                        </label>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                            Retrieval Limit
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            step="1"
                            value={longTermMemory.retrievalLimit}
                            disabled={!longTermMemory.enabled}
                            onChange={(e) =>
                              updateLongTermMemorySettings({
                                retrievalLimit: Number(e.target.value),
                              })
                            }
                            className="w-full h-11 px-4 bg-white border-2 border-neutral-100 rounded-2xl focus:ring-0 focus:border-black outline-none transition-all text-sm text-neutral-800 disabled:bg-neutral-50 disabled:text-neutral-400"
                          />
                          <p className="text-[11px] text-neutral-400 leading-tight">
                            How many saved memories to inject per reply.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                            Max Entries
                          </label>
                          <input
                            type="number"
                            min="5"
                            max="500"
                            step="1"
                            value={longTermMemory.maxEntriesPerUser}
                            disabled={!longTermMemory.enabled}
                            onChange={(e) =>
                              updateLongTermMemorySettings({
                                maxEntriesPerUser: Number(e.target.value),
                              })
                            }
                            className="w-full h-11 px-4 bg-white border-2 border-neutral-100 rounded-2xl focus:ring-0 focus:border-black outline-none transition-all text-sm text-neutral-800 disabled:bg-neutral-50 disabled:text-neutral-400"
                          />
                          <p className="text-[11px] text-neutral-400 leading-tight">
                            Older low-value memories are pruned above this cap.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">
                            Min Salience
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="1"
                            step="0.05"
                            value={longTermMemory.minSalienceToStore}
                            disabled={!longTermMemory.enabled}
                            onChange={(e) =>
                              updateLongTermMemorySettings({
                                minSalienceToStore: Number(e.target.value),
                              })
                            }
                            className="w-full h-11 px-4 bg-white border-2 border-neutral-100 rounded-2xl focus:ring-0 focus:border-black outline-none transition-all text-sm text-neutral-800 disabled:bg-neutral-50 disabled:text-neutral-400"
                          />
                          <p className="text-[11px] text-neutral-400 leading-tight">
                            Ignore extracted memories below this score.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-sky-700 bg-sky-50/80 p-3 rounded-xl border border-sky-100">
                        <MessageCircle className="w-4 h-4 shrink-0" />
                        <p className="text-[11px] font-medium leading-tight">
                          Long-term memory is only used for Telegram private chats. Different users
                          stay isolated from each other.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Metrics Tab */}
          {activeTab === 'metrics' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {fetchingMetrics ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100 flex flex-col items-center justify-center animate-pulse"
                      >
                        <div className="h-2 w-20 bg-neutral-200 rounded-full mb-3" />
                        <div className="h-8 w-16 bg-neutral-300 rounded-lg" />
                      </div>
                    ))}
                  </div>
                  <div className="bg-white p-6 rounded-2xl border border-neutral-100 h-[240px] animate-pulse">
                    <div className="flex justify-between mb-8">
                      <div className="h-3 w-32 bg-neutral-100 rounded-full" />
                      <div className="flex gap-4">
                        <div className="h-3 w-12 bg-neutral-100 rounded-full" />
                        <div className="h-3 w-12 bg-neutral-100 rounded-full" />
                      </div>
                    </div>
                    <div className="flex items-end justify-between h-32 px-4 gap-2">
                      {[...Array(12)].map((_, i) => (
                        <div
                          key={i}
                          className="w-full bg-neutral-50 rounded-t-sm"
                          style={{ height: `${Math.random() * 100}%` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : !metricsData ? (
                <div className="text-center py-12 px-6 border-2 border-dashed border-neutral-100 rounded-3xl bg-neutral-50/30 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                    <BarChart3 className="w-6 h-6 text-neutral-300" />
                  </div>
                  <p className="text-sm font-medium text-neutral-500">
                    No metrics data available for this agent.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100 flex flex-col items-center justify-center group hover:bg-white hover:border-black transition-all duration-300">
                      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-2 group-hover:text-neutral-500 transition-colors">
                        Total Executions
                      </p>
                      <p className="text-4xl font-black text-black tracking-tighter">
                        {metricsData.summary.totalExecutions}
                      </p>
                    </div>
                    <div className="bg-neutral-50 p-6 rounded-2xl border border-neutral-100 flex flex-col items-center justify-center group hover:bg-white hover:border-black transition-all duration-300">
                      <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-widest mb-2 group-hover:text-neutral-500 transition-colors">
                        Success Rate
                      </p>
                      <div className="flex items-baseline gap-1">
                        <p
                          className={`text-4xl font-black tracking-tighter ${metricsData.summary.successRate >= 95 ? 'text-green-500' : metricsData.summary.successRate >= 80 ? 'text-amber-500' : 'text-red-500'}`}
                        >
                          {metricsData.summary.totalExecutions > 0
                            ? Math.round(metricsData.summary.successRate)
                            : '0'}
                        </p>
                        <span className="text-xl font-bold text-neutral-300">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-neutral-100 shadow-sm h-[240px]">
                    <Line
                      data={{
                        labels: metricsData.chartData.map((d) =>
                          new Date(d.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        ),
                        datasets: [
                          {
                            label: 'Total',
                            data: metricsData.chartData.map((d) => d.total),
                            borderColor: '#a3a3a3', // Neutral gray
                            backgroundColor: 'transparent',
                            borderWidth: 2,
                            borderDash: [5, 5], // Dashed line to differentiate from primary lines
                            pointBackgroundColor: '#ffffff',
                            pointBorderColor: '#a3a3a3',
                            pointBorderWidth: 2,
                            pointRadius: 3,
                            fill: false,
                            tension: 0.4,
                          },
                          {
                            label: 'Success',
                            data: metricsData.chartData.map((d) => d.success),
                            borderColor: '#10B981', // Emerald green
                            backgroundColor: 'rgba(16, 185, 129, 0.05)',
                            borderWidth: 2,
                            pointBackgroundColor: '#ffffff',
                            pointBorderColor: '#10B981',
                            pointBorderWidth: 2,
                            pointRadius: 3,
                            fill: true,
                            tension: 0.4,
                          },
                          {
                            label: 'Errors',
                            data: metricsData.chartData.map((d) => d.errors),
                            borderColor: '#EF4444', // Red
                            backgroundColor: 'rgba(239, 68, 68, 0.05)',
                            borderWidth: 2,
                            pointBackgroundColor: '#ffffff',
                            pointBorderColor: '#EF4444',
                            pointBorderWidth: 2,
                            pointRadius: 3,
                            fill: true,
                            tension: 0.4,
                          },
                        ],
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                          mode: 'index',
                          intersect: false, // Show all lines on hover anywhere vertically
                        },
                        plugins: {
                          legend: {
                            display: true,
                            position: 'top',
                            align: 'end',
                            labels: {
                              boxWidth: 8,
                              usePointStyle: true,
                              pointStyle: 'circle',
                              font: { size: 11, family: "''Inter', sans-serif'" },
                              color: '#525252',
                            },
                          },
                          tooltip: {
                            backgroundColor: '#000000',
                            padding: 12,
                            titleFont: { size: 13, family: "''Inter', sans-serif'" },
                            bodyFont: { size: 13, family: "''Inter', sans-serif'" },
                            cornerRadius: 8,
                          },
                        },
                        scales: {
                          x: {
                            grid: { display: false },
                            ticks: {
                              maxTicksLimit: 7,
                              font: { size: 10, family: "''Inter', sans-serif'" },
                              color: '#a3a3a3',
                            },
                          },
                          y: {
                            beginAtZero: true,
                            grid: { color: '#f5f5f5' },
                            ticks: {
                              precision: 0,
                              font: { size: 10, family: "''Inter', sans-serif'" },
                              color: '#a3a3a3',
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {/* Tools Tab */}
          {activeTab === 'tools' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {!agentData.tools || agentData.tools.length === 0 ? (
                <div className="text-center py-12 px-6 border-2 border-dashed border-neutral-100 rounded-3xl bg-neutral-50/30 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                    <Webhook className="w-6 h-6 text-neutral-300" />
                  </div>
                  <p className="text-sm font-medium text-neutral-500">
                    No built-in tools configured for this agent.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {agentData.tools.map((tool) => {
                    const isEnabled = settings.tools.includes(tool);
                    return (
                      <button
                        key={tool}
                        onClick={() => toggleTool(tool)}
                        className={`flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all cursor-pointer text-left group ${
                          isEnabled
                            ? 'bg-neutral-900 border-neutral-900 text-white shadow-xl shadow-black/10'
                            : 'bg-white border-neutral-100 text-neutral-700 hover:border-neutral-200 hover:bg-neutral-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-green-400' : 'bg-neutral-200'}`}
                          />
                          <span className="text-sm font-semibold tracking-tight">{tool}</span>
                        </div>
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isEnabled ? 'bg-white/20' : 'bg-neutral-100 opacity-0 group-hover:opacity-100'}`}
                        >
                          <CheckCircle2
                            className={`w-3.5 h-3.5 ${isEnabled ? 'text-white' : 'text-neutral-400'}`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* MCP Tab */}
          {activeTab === 'mcp' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {fetchingMCPs ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-neutral-300" />
                  <p className="text-xs font-medium text-neutral-400">Syncing servers...</p>
                </div>
              ) : mcpServers.length === 0 ? (
                <div className="text-center py-12 px-6 border-2 border-dashed border-neutral-100 rounded-3xl bg-neutral-50/30 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                    <Plug className="w-6 h-6 text-neutral-300" />
                  </div>
                  <p className="text-sm font-medium text-neutral-600 mb-2">
                    No MCP servers available.
                  </p>
                  <a
                    href="/admin/chatbot"
                    className="text-xs font-bold text-black underline underline-offset-4 hover:text-neutral-500 uppercase tracking-widest transition-colors"
                  >
                    Configure in Settings
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
                        className={`w-full flex items-center gap-4 px-5 py-4.5 rounded-2xl text-left border-2 cursor-pointer transition-all ${
                          isAssigned
                            ? 'bg-neutral-900 border-neutral-900 text-white shadow-xl shadow-black/10'
                            : 'bg-white border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50/50'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                            isAssigned
                              ? 'bg-white text-black'
                              : 'border-2 border-neutral-200 bg-white'
                          }`}
                        >
                          {isAssigned && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold tracking-tight">{mcp.name}</p>
                            {!mcp.isActive && (
                              <span className="text-[9px] uppercase font-black text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100">
                                Offline
                              </span>
                            )}
                          </div>
                          {mcp.description && (
                            <p
                              className={`text-[11px] truncate mt-1 ${isAssigned ? 'text-neutral-400' : 'text-neutral-500'}`}
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

          {/* Skills Tab */}
          {activeTab === 'skills' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {fetchingSkills ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <RefreshCw className="w-6 h-6 animate-spin text-neutral-300" />
                  <p className="text-xs font-medium text-neutral-400">Loading skills...</p>
                </div>
              ) : skills.length === 0 ? (
                <div className="text-center py-12 px-6 border-2 border-dashed border-neutral-100 rounded-3xl bg-neutral-50/30 flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
                    <BookOpen className="w-6 h-6 text-neutral-300" />
                  </div>
                  <p className="text-sm font-medium text-neutral-600 mb-2">No skills available.</p>
                  <a
                    href="/admin/chatbot?tab=skills"
                    className="text-xs font-bold text-black underline underline-offset-4 hover:text-neutral-500 uppercase tracking-widest transition-colors"
                  >
                    Create in Settings
                  </a>
                </div>
              ) : (
                <div className="space-y-3">
                  {skills.map((skill) => {
                    const isAssigned = (settings.activeSkills || []).includes(skill._id);
                    return (
                      <button
                        key={skill._id}
                        type="button"
                        onClick={() => toggleSkill(skill._id)}
                        className={`w-full flex items-center gap-4 px-5 py-4.5 rounded-2xl text-left border-2 cursor-pointer transition-all ${
                          isAssigned
                            ? 'bg-neutral-900 border-neutral-900 text-white shadow-xl shadow-black/10'
                            : 'bg-white border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50/50'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${
                            isAssigned
                              ? 'bg-white text-black'
                              : 'border-2 border-neutral-200 bg-white'
                          }`}
                        >
                          {isAssigned && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold tracking-tight">{skill.displayName}</p>
                            <span className="text-[9px] uppercase font-black text-purple-500 bg-purple-50 px-1.5 py-0.5 rounded-md border border-purple-100">
                              {skill.category}
                            </span>
                            {!skill.isActive && (
                              <span className="text-[9px] uppercase font-black text-red-500 bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100">
                                Inactive
                              </span>
                            )}
                          </div>
                          {skill.description && (
                            <p
                              className={`text-[11px] truncate mt-1 ${isAssigned ? 'text-neutral-400' : 'text-neutral-500'}`}
                            >
                              {skill.description}
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
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300 h-full flex flex-col">
              <div className="bg-neutral-50 p-4 rounded-2xl border border-neutral-100 mb-2">
                <p className="text-[11px] leading-relaxed text-neutral-500 font-medium">
                  Define specialized instructions for this agent's system prompt. Guide behavior,
                  tone, or specific operational constraints to optimize performance.
                </p>
              </div>
              <textarea
                value={settings.persona}
                onChange={(e) => setSettings((prev) => ({ ...prev, persona: e.target.value }))}
                className="flex-1 min-h-[200px] w-full p-5 bg-white border-2 border-neutral-100 rounded-2xl focus:ring-0 focus:border-black outline-none transition-all text-sm leading-relaxed text-neutral-800 resize-none shadow-sm"
                placeholder="e.g., 'You are a critical code auditor. Focus on security patterns and performance bottlenecks...'"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-6 bg-white border-t border-neutral-100">
          <DialogFooter className="flex-row gap-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="rounded-2xl flex-1 justify-center bg-white border-2 border-neutral-100 hover:border-neutral-200 hover:bg-neutral-50 text-neutral-600 font-bold uppercase tracking-widest text-[10px] h-12"
            >
              Discard Changes
            </Button>
            <Button
              onClick={handleSave}
              isLoading={saving}
              className="rounded-2xl bg-black hover:bg-neutral-800 text-white flex-1 justify-center font-bold uppercase tracking-widest text-[10px] h-12"
            >
              <Save className="w-3.5 h-3.5 mr-2" /> Save Configuration
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
