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
import { Sparkles, Save, X, Bot, ShieldAlert } from 'lucide-react';

export default function MediaAgentSettingsModal({ isOpen, onClose, onSave }) {
  const [settings, setSettings] = useState({
    providerId: '',
    model: '',
    persona: '',
    isActive: true,
  });
  const [providers, setProviders] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingModels, setFetchingModels] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
      fetchProviders();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/media/settings');
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        if (data.providerId) {
          fetchModels(data.providerId);
        }
      }
    } catch (error) {
      console.error('Error fetching media agent settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProviders = async () => {
    try {
      const response = await fetch('/api/media/models');
      const data = await response.json();
      if (data.providers) {
        setProviders(data.providers);
      }
    } catch (error) {
      console.error('Error fetching providers:', error);
    }
  };

  const fetchModels = async (providerId) => {
    if (!providerId) return;
    setFetchingModels(true);
    try {
      const response = await fetch(`/api/media/models?providerId=${providerId}`);
      const data = await response.json();
      if (data.models) {
        setModels(data.models);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
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
    setSaving(true);
    try {
      const response = await fetch('/api/admin/media/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (response.ok) {
        onSave();
        onClose();
      }
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleResetState = async () => {
    if (
      !confirm(
        'Are you sure you want to reset the AI agent state? This will clear any "Processing" status.'
      )
    )
      return;

    setSaving(true);
    try {
      const response = await fetch('/api/admin/media/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isProcessing: false }),
      });

      if (response.ok) {
        const updated = await response.json();
        setSettings(updated);
        alert('Agent state reset successfully.');
      }
    } catch (error) {
      console.error('Error resetting agent state:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <DialogTitle className="text-xl font-bold">Image Agent Settings</DialogTitle>
          </div>
          <p className="text-sm text-neutral-500">
            Configure how the AI agent analyzes and describes your images.
          </p>
        </DialogHeader>

        <div className="py-6 space-y-6">
          <div className="space-y-4">
            <CustomDropdown
              label="AI Provider"
              value={settings.providerId}
              onChange={handleProviderChange}
              options={[
                { value: '', label: 'Select Provider' },
                ...providers.map((p) => ({ value: p.id, label: p.name })),
              ]}
            />

            <CustomDropdown
              label="Model"
              value={settings.model}
              onChange={(e) => setSettings((prev) => ({ ...prev, model: e.target.value }))}
              isLoading={fetchingModels}
              disabled={!settings.providerId}
              options={[
                { value: '', label: 'Select Model' },
                ...models.map((m) => ({ value: m, label: m })),
              ]}
            />
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
