'use client';

import { useState, useEffect } from 'react';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import FormSection from '@/components/admin/FormSection';
import ActionButton from '@/components/admin/ActionButton';

export default function ToolTeaserSettingsPage() {
  const [formData, setFormData] = useState({
    imageAiTitle: '',
    imageAiDescription: '',
    imageAiPlaceholder: '',
    imageAiButtonText: '',
    imageAiButtonLink: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetch('/api/admin/sections/tool-teaser')
      .then((res) => res.json())
      .then((data) => {
        setFormData(data);
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    const res = await fetch('/api/admin/sections/tool-teaser', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const result = await res.json();
    setMessage({ type: res.ok ? 'success' : 'error', text: result.message });
    setSaving(false);
  };

  if (loading) {
    return (
      <AdminPageWrapper title="Tool Teaser">
        <div className="space-y-8">
          <div className="h-16 bg-neutral-100 rounded-lg animate-pulse"></div>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="h-6 bg-neutral-200 rounded w-1/3 animate-pulse"></div>
              <div className="h-4 bg-neutral-100 rounded w-2/3 animate-pulse"></div>
            </div>
            <div className="space-y-6">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-neutral-200 rounded w-1/4 animate-pulse"></div>
                  <div className="h-12 bg-neutral-100 rounded-lg animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-4 pt-6 border-t border-neutral-200">
            <div className="h-10 bg-neutral-200 rounded w-24 animate-pulse"></div>
          </div>
        </div>
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper
      title="Tool Teaser"
      description="Configure the AI Artist teaser section on the tools page."
    >
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        <FormSection
          title="AI Artist"
          description="Customize the AI Artist teaser card appearance and behavior."
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                Title
              </label>
              <input
                name="imageAiTitle"
                type="text"
                value={formData.imageAiTitle || ''}
                onChange={handleChange}
                placeholder="Try My AI Artist"
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                Description
              </label>
              <textarea
                name="imageAiDescription"
                value={formData.imageAiDescription || ''}
                onChange={handleChange}
                placeholder="Experience the same AI technology I use for my projects..."
                rows={3}
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                Placeholder Text
              </label>
              <input
                name="imageAiPlaceholder"
                type="text"
                value={formData.imageAiPlaceholder || ''}
                onChange={handleChange}
                placeholder="A futuristic city in a glass bottle..."
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Shown as placeholder in the AI artist input field.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                Button Text
              </label>
              <input
                name="imageAiButtonText"
                type="text"
                value={formData.imageAiButtonText || ''}
                onChange={handleChange}
                placeholder="Enter full AI Creative Studio"
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                Button Link
              </label>
              <input
                name="imageAiButtonLink"
                type="text"
                value={formData.imageAiButtonLink || ''}
                onChange={handleChange}
                placeholder="/tools/image-ai"
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg"
              />
              <p className="text-xs text-neutral-500 mt-1">
                The URL the button links to when clicked.
              </p>
            </div>
          </div>
        </FormSection>

        <div className="flex flex-wrap gap-4 pt-6 border-t border-neutral-200">
          <ActionButton isSaving={saving} text="Save Settings" savingText="Saving..." />
        </div>
      </form>
    </AdminPageWrapper>
  );
}
