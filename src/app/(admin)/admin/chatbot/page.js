'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import IconPicker from '@/components/admin/IconPicker';
import ActionButton from '@/components/admin/ActionButton';
import CustomDropdown from '@/components/CustomDropdown';
import Switch from '@/components/admin/Switch';

export default function ChatbotSettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [availableModels, setAvailableModels] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    aiName: 'Kiro',
    persona: '',
    baseKnowledge: '',
    servicesOffered: '',
    callToAction: '',
    rules: [''],
    isActive: true,
    modelName: 'openai-large'
  });

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

  // Fetch settings
  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetchSettings();
    }
  }, [session]);

  // Fetch available models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('/api/admin/chatbot/models');
        if (response.ok) {
          const models = await response.json();
          setAvailableModels(models);
        }
      } catch (error) {
        console.error('Error fetching available models:', error);
      }
    };

    if (session?.user?.role === 'admin') {
      fetchModels();
    }
  }, [session]);

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
    setFormData(prev => {
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
    setFormData(prev => {
      const newData = {
        ...prev,
        rules: prev.rules.map((rule, i) =>
          i === index ? value : rule
        )
      };

      return newData;
    });
  };

  const addRule = () => {
    setFormData(prev => {
      const newData = {
        ...prev,
        rules: [...prev.rules, '']
      };

      return newData;
    });
  };

  const removeRule = (index) => {
    if (formData.rules.length > 1) {
      setFormData(prev => {
        const newData = {
          ...prev,
          rules: prev.rules.filter((_, i) => i !== index)
        };

        return newData;
      });
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
    <AdminPageWrapper title="Chatbot Settings">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <h1 className="text-3xl font-bold text-black font-['Playfair_Display']">AI Assistant Configuration</h1>
          </div>
          <p className="text-neutral-600">
            Configure your AI assistant's personality, knowledge base, and behavior.
            These settings control how the chatbot interacts with visitors on your portfolio.
          </p>
        </div>

        {/* Keyboard Shortcuts Info */}
        <div className="mb-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 bg-neutral-50 p-3 rounded-lg">
            <span className="font-medium">Shortcuts:</span>
            <code className="px-2 py-1 bg-white border border-neutral-200 rounded">Ctrl+S</code>
            <span>Save Changes</span>
          </div>
        </div>

        {/* Success/Error Messages */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            message.type === 'error' ? 'bg-red-50 text-red-800 border border-red-200' :
            'bg-neutral-50 text-neutral-800 border border-neutral-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Form Sections - Two Column Grid */}
        <div className="grid gap-8 lg:grid-cols-2 mb-8">
          {/* Left Column - Basic Settings & Persona */}
          <div className="space-y-6">

            {/* Basic Settings */}
            <div className="bg-white p-6 rounded-lg border border-neutral-200">
              <h3 className="text-xl font-semibold mb-4 text-black">Basic Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">AI Name</label>
                  <input
                    type="text"
                    value={formData.aiName}
                    onChange={(e) => handleInputChange('aiName', e.target.value)}
                    className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="e.g., Kiro"
                  />
                </div>
                <div>
                  <Switch
                    label="Chatbot Status"
                    description="Enable or disable the chatbot on the website."
                    checked={formData.isActive}
                    onCheckedChange={(value) => handleInputChange('isActive', value)}
                  />
                </div>
                <div>
                  <CustomDropdown
                    label="AI Model"
                    name="modelName"
                    value={formData.modelName}
                    onChange={(e) => handleInputChange('modelName', e.target.value)}
                    options={availableModels.map(model => ({ value: model, label: model }))}
                  />
                </div>
              </div>
            </div>

            {/* AI Persona */}
            <div className="bg-white p-6 rounded-lg border border-neutral-200">
              <h3 className="text-xl font-semibold mb-4 text-black">AI Persona</h3>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Persona Description</label>
                <textarea
                  value={formData.persona}
                  onChange={(e) => handleInputChange('persona', e.target.value)}
                  rows={4}
                  className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Describe how the AI should behave and communicate..."
                />
                <p className="text-sm text-neutral-500 mt-1">
                  This defines the AI's personality and communication style.
                </p>
              </div>
            </div>

            {/* Knowledge Base */}
            <div className="bg-white p-6 rounded-lg border border-neutral-200">
              <h3 className="text-xl font-semibold mb-4 text-black">Knowledge Base</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Base Knowledge</label>
                  <textarea
                    value={formData.baseKnowledge}
                    onChange={(e) => handleInputChange('baseKnowledge', e.target.value)}
                    rows={3}
                    className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="General information about you and your work..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">Services Offered</label>
                  <textarea
                    value={formData.servicesOffered}
                    onChange={(e) => handleInputChange('servicesOffered', e.target.value)}
                    rows={4}
                    className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    placeholder="List your services, one per line..."
                  />
                  <p className="text-sm text-neutral-500 mt-1">
                    The AI will use this to match visitor needs to your skills.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column - Call to Action & Rules */}
          <div className="space-y-6">

            {/* Call to Action */}
            <div className="bg-white p-6 rounded-lg border border-neutral-200">
              <h3 className="text-xl font-semibold mb-4 text-black">Call to Action</h3>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">Primary Call to Action</label>
                <textarea
                  value={formData.callToAction}
                  onChange={(e) => handleInputChange('callToAction', e.target.value)}
                  rows={3}
                  className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="What should the AI say to encourage contact..."
                />
                <p className="text-sm text-neutral-500 mt-1">
                  This message will be used to guide interested visitors toward the contact form.
                </p>
              </div>
            </div>

            {/* Behavioral Rules */}
            <div className="bg-white p-6 rounded-lg border border-neutral-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-black">Behavioral Rules</h3>
                <button
                  onClick={addRule}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors text-sm"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Add Rule
                </button>
              </div>

              <p className="text-sm text-neutral-600 mb-4">
                Define specific rules for how the AI should behave and respond to users.
              </p>

              <div className="space-y-4">
                {formData.rules.map((rule, index) => (
                  <div key={index} className="relative p-4 border border-neutral-200 rounded-lg bg-neutral-50">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-medium text-sm text-neutral-900">Rule {index + 1}</span>
                      {formData.rules.length > 1 && (
                        <button
                          onClick={() => removeRule(index)}
                          className="text-red-600 hover:text-red-800 text-sm transition-colors"
                        >
                          <i className="fas fa-trash mr-1"></i>
                          Remove
                        </button>
                      )}
                    </div>
                    <textarea
                      value={rule}
                      onChange={(e) => handleRuleChange(index, e.target.value)}
                      rows={2}
                      className="w-full p-2 border border-neutral-300 rounded text-sm bg-white focus:ring-2 focus:ring-black focus:border-transparent"
                      placeholder={`Rule ${index + 1}...`}
                    />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 pt-6 border-t border-neutral-200">
          <ActionButton isSaving={saving} onClick={handleSave} text="Save Changes" savingText="Saving..." />
          <ActionButton onClick={handleReset} text="Reset Changes" variant="ghost" />
        </div>
      </div>
    </AdminPageWrapper>
  );
}
