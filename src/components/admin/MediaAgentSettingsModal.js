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
import { Sparkles, Save, X, Bot, ShieldAlert, Cpu, Activity, Settings2 } from 'lucide-react';

/**
 * MediaAgentSettingsModal
 *
 * Updated to support the new Agent Registry system.
 * Allows configuration of individual agents from the registry.
 */
export default function MediaAgentSettingsModal({ isOpen, onClose, onSave }) {
  const [selectedAgentId, setSelectedAgentId] = useState('image_analyzer');
  const [agents, setAgents] = useState([]);
  const [agentDetails, setAgentDetails] = useState(null);

  const [settings, setSettings] = useState({
    providerId: '',
    model: '',
    persona: '',
    isActive: true,
    embeddingProviderId: '',
    embeddingModel: '',
    generationProviderId: '',
    generationModel: '',
    qdrantCollection: 'media_assets',
  });

  const [providers, setProviders] = useState([]);
  const [models, setModels] = useState([]);
  const [embeddingModels, setEmbeddingModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [fetchingEmbeddingModels, setFetchingEmbeddingModels] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAgents();
      fetchProviders();
    }
  }, [isOpen]);

  useEffect(() => {
    // Load agent settings when agent is selected AND agents list is populated
    if (selectedAgentId && agents.length > 0) {
      const agent = agents.find((a) => a.agentId === selectedAgentId);
      setAgentDetails(agent);
      if (agent) {
        console.log('[MediaAgentSettingsModal] Loading agent settings:', agent);

        setSettings((prev) => ({
          ...prev,
          providerId: agent.providerId || '',
          model: agent.model || '',
          persona: agent.persona || '',
          isActive: agent.isActive ?? true,
          embeddingProviderId: agent.embeddingProviderId || '',
          embeddingModel: agent.embeddingModel || '',
          generationProviderId: agent.generationProviderId || '',
          generationModel: agent.generationModel || '',
          qdrantCollection: agent.qdrantCollection || 'media_assets',
        }));

        // Fetch models for the loaded provider (after providers are loaded)
        if (agent.providerId && providers.length > 0) {
          console.log(
            '[MediaAgentSettingsModal] Fetching analysis models for provider:',
            agent.providerId
          );
          fetchModels(agent.providerId, false);
        }

        // Fetch embedding models if embedding provider is set
        if (agent.embeddingProviderId && providers.length > 0) {
          console.log(
            '[MediaAgentSettingsModal] Fetching embedding models for provider:',
            agent.embeddingProviderId
          );
          fetchModels(agent.embeddingProviderId, true);
        }
      }
    }
  }, [selectedAgentId, agents, providers]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/agents');
      if (response.ok) {
        const data = await response.json();
        console.log('[MediaAgentSettingsModal] Loaded agents:', data.agents);
        setAgents(data.agents || []);

        // Auto-select first media agent if available
        const mediaAgents = (data.agents || []).filter((a) => a.type === 'media');
        if (mediaAgents.length > 0) {
          const firstMediaAgent = mediaAgents[0].agentId;
          console.log('[MediaAgentSettingsModal] Auto-selecting agent:', firstMediaAgent);
          setSelectedAgentId(firstMediaAgent);

          // If providers are already loaded, fetch models immediately
          if (providers.length > 0) {
            const agent = mediaAgents[0];
            if (agent.providerId) {
              fetchModels(agent.providerId, false);
            }
            if (agent.embeddingProviderId) {
              fetchModels(agent.embeddingProviderId, true);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/media/models');
      const data = await response.json();
      if (data.providers) {
        console.log('[MediaAgentSettingsModal] Loaded providers:', data.providers);
        setProviders(data.providers);

        // If we have a selected agent with a provider, fetch models now
        if (selectedAgentId && agents.length > 0) {
          const agent = agents.find((a) => a.agentId === selectedAgentId);
          if (agent?.providerId) {
            console.log(
              '[MediaAgentSettingsModal] Fetching models after providers loaded:',
              agent.providerId
            );
            fetchModels(agent.providerId, false);
          }
          if (agent?.embeddingProviderId) {
            console.log(
              '[MediaAgentSettingsModal] Fetching embedding models after providers loaded:',
              agent.embeddingProviderId
            );
            fetchModels(agent.embeddingProviderId, true);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const fetchModels = async (providerId, isEmbedding = false) => {
    if (!providerId) {
      console.warn('[MediaAgentSettingsModal] fetchModels called without providerId');
      return;
    }

    console.log(
      '[MediaAgentSettingsModal] Fetching models for provider:',
      providerId,
      'isEmbedding:',
      isEmbedding
    );

    if (isEmbedding) setFetchingEmbeddingModels(true);
    else setFetchingModels(true);

    try {
      const url = `/api/media/models?providerId=${encodeURIComponent(providerId)}`;
      console.log('[MediaAgentSettingsModal] Fetching URL:', url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('[MediaAgentSettingsModal] Received models data:', data);

      if (data.models) {
        const modelsArray = Array.isArray(data.models) ? data.models : [];
        console.log('[MediaAgentSettingsModal] Setting models:', modelsArray.length, 'models');

        if (isEmbedding) {
          setEmbeddingModels(modelsArray);
        } else {
          setModels(modelsArray);
        }
      } else if (data.error) {
        console.error('[MediaAgentSettingsModal] API error:', data.error);
      }
    } catch (error) {
      console.error(
        `[MediaAgentSettingsModal] Error fetching ${isEmbedding ? 'embedding ' : ''}models:`,
        error
      );
      // Clear models on error to show empty dropdown
      if (isEmbedding) {
        setEmbeddingModels([]);
      } else {
        setModels([]);
      }
    } finally {
      if (isEmbedding) setFetchingEmbeddingModels(false);
      else setFetchingModels(false);
    }
  };

  const handleProviderChange = (e) => {
    const providerId = e.target.value;
    setSettings((prev) => ({ ...prev, providerId, model: '' }));
    setModels([]);
    fetchModels(providerId, false);
  };

  const handleEmbeddingProviderChange = (e) => {
    const providerId = e.target.value;
    setSettings((prev) => ({ ...prev, embeddingProviderId: providerId, embeddingModel: '' }));
    setEmbeddingModels([]);
    fetchModels(providerId, true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      console.log('[MediaAgentSettingsModal] Saving settings:', settings);

      const response = await fetch(`/api/admin/agents/${selectedAgentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: settings.providerId,
          model: settings.model,
          persona: settings.persona,
          isActive: settings.isActive,
          embeddingProviderId: settings.embeddingProviderId,
          embeddingModel: settings.embeddingModel,
          generationProviderId: settings.generationProviderId,
          generationModel: settings.generationModel,
          qdrantCollection: settings.qdrantCollection,
        }),
      });

      const result = await response.json();
      console.log('[MediaAgentSettingsModal] Save response:', result);

      if (response.ok) {
        console.log('[MediaAgentSettingsModal] Save successful!');
        onSave();
        onClose();
      } else {
        console.error('[MediaAgentSettingsModal] Save failed:', result);
        alert('Failed to save settings: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('[MediaAgentSettingsModal] Error saving settings:', error);
      alert('Error saving settings: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleResetState = async () => {
    if (
      !confirm(
        'Are you sure you want to reset the AI agent state? This will clear any "Processing" status.'
      )
    ) {
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/admin/media/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isProcessing: false }),
      });

      if (response.ok) {
        const updated = await response.json();
        setSettings((prev) => ({ ...prev, ...updated }));
        alert('Agent state reset successfully.');
      }
    } catch (error) {
      console.error('Error resetting agent state:', error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-neutral-300';
    if (status.isActive && status.isInitialized) return 'bg-green-500';
    if (status.isActive) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Cpu className="w-5 h-5" />
              </div>
              <DialogTitle className="text-xl font-bold">Agent Configuration</DialogTitle>
            </div>
            {agentDetails && (
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${getStatusColor(agentDetails)}`} />
                <span className="text-xs text-neutral-500">
                  {agentDetails.isActive
                    ? agentDetails.isInitialized
                      ? 'Ready'
                      : 'Initializing'
                    : 'Inactive'}
                </span>
              </div>
            )}
          </div>
          <p className="text-sm text-neutral-500">
            Configure AI agents for media processing and analysis.
          </p>
        </DialogHeader>

        <div className="py-4">
          {/* Agent Selector */}
          <div className="mb-6">
            <label className="text-xs font-medium text-neutral-700 mb-2 block">Select Agent</label>
            <div className="grid grid-cols-2 gap-2">
              {agents
                .filter((a) => a.type === 'media')
                .map((agent) => (
                  <button
                    key={agent.agentId}
                    onClick={() => setSelectedAgentId(agent.agentId)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedAgentId === agent.agentId
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20'
                        : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusColor(agent)}`} />
                      <span className="text-sm font-medium">{agent.name}</span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1 truncate">{agent.description}</p>
                  </button>
                ))}
            </div>
          </div>
        </div>

        <div className="py-6 space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          {agentDetails && (
            <div className="p-3 bg-neutral-50 rounded-xl">
              <div className="flex items-start gap-3">
                <Settings2 className="w-5 h-5 text-neutral-400 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-semibold">{agentDetails.name}</h4>
                  <p className="text-xs text-neutral-500 mt-1">{agentDetails.description}</p>
                  {agentDetails.tools && agentDetails.tools.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {agentDetails.tools.map((tool) => (
                        <span
                          key={tool}
                          className="px-2 py-0.5 bg-white border border-neutral-200 rounded text-[10px] text-neutral-600 uppercase tracking-wider"
                        >
                          {tool}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-3 h-3" />
              Analysis Settings
            </h4>
            <CustomDropdown
              label="Analysis Provider"
              value={settings.providerId}
              onChange={handleProviderChange}
              options={[
                { value: '', label: 'Select Provider' },
                ...providers.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />

            <div className="space-y-1">
              <CustomDropdown
                label="Analysis Model"
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
                <p className="text-[10px] text-amber-600 flex items-center gap-1">
                  <span>No models loaded. Try selecting the provider again.</span>
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              Image Generation Settings
            </h4>

            <CustomDropdown
              label="Generation Provider"
              value={settings.generationProviderId}
              onChange={(e) => {
                const providerId = e.target.value;
                setSettings((prev) => ({
                  ...prev,
                  generationProviderId: providerId,
                  generationModel: '',
                }));
                fetchModels(providerId, false);
              }}
              options={[
                { value: '', label: 'Select Provider' },
                ...providers.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />

            <div className="space-y-1">
              <CustomDropdown
                label="Generation Model"
                value={settings.generationModel}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, generationModel: e.target.value }))
                }
                isLoading={fetchingModels}
                disabled={!settings.generationProviderId}
                options={[
                  {
                    value: '',
                    label: settings.generationProviderId ? 'Select Model' : 'Select provider first',
                  },
                  ...models.map((m) => ({ value: m, label: m })),
                ]}
              />
              {settings.generationProviderId && models.length === 0 && !fetchingModels && (
                <p className="text-[10px] text-amber-600 flex items-center gap-1">
                  <span>No models loaded. Try selecting the provider again.</span>
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-neutral-100">
            <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
              Semantic Search (Qdrant)
            </h4>

            <CustomDropdown
              label="Embedding Provider"
              value={settings.embeddingProviderId}
              onChange={handleEmbeddingProviderChange}
              options={[
                { value: '', label: 'Select Provider' },
                ...providers.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />

            <div className="space-y-1">
              <CustomDropdown
                label="Embedding Model"
                value={settings.embeddingModel}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, embeddingModel: e.target.value }))
                }
                isLoading={fetchingEmbeddingModels}
                disabled={!settings.embeddingProviderId}
                options={[
                  {
                    value: '',
                    label: settings.embeddingProviderId ? 'Select Model' : 'Select provider first',
                  },
                  ...embeddingModels.map((m) => ({ value: m, label: m })),
                ]}
              />
              {settings.embeddingProviderId &&
                embeddingModels.length === 0 &&
                !fetchingEmbeddingModels && (
                  <p className="text-[10px] text-amber-600 flex items-center gap-1">
                    <span>No models loaded. Try selecting the provider again.</span>
                  </p>
                )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-neutral-700">Qdrant Collection Name</label>
              <input
                type="text"
                value={settings.qdrantCollection}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, qdrantCollection: e.target.value }))
                }
                className="w-full p-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20"
                placeholder="media_assets"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-800 flex items-center gap-2">
              <Bot className="w-4 h-4 text-neutral-400" />
              Agent Persona & Instructions
            </label>
            <textarea
              value={settings.persona}
              onChange={(e) => setSettings((prev) => ({ ...prev, persona: e.target.value }))}
              rows={4}
              className="w-full p-3 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm leading-relaxed"
              placeholder="Tell the agent how to describe images..."
            />
            <p className="text-[11px] text-neutral-500">
              The agent will use these instructions to generate alt text or captions.
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetState}
              disabled={saving}
              className="text-amber-600 border-amber-200 hover:bg-amber-50 w-full sm:w-auto rounded-xl"
            >
              <ShieldAlert className="w-4 h-4 mr-2" />
              Reset Agent State
            </Button>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl flex-1 sm:flex-initial"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              isLoading={saving}
              className="rounded-xl bg-black hover:bg-neutral-800 text-white border-none shadow-sm transition-all active:scale-95 flex-1 sm:flex-initial"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
