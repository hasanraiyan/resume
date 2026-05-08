'use client';

import { useState, useEffect } from 'react';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import FormSection from '@/components/admin/FormSection';
import ActionButton from '@/components/admin/ActionButton';

export default function SkillsSettingsPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetch('/api/admin/sections/skills')
      .then((res) => res.json())
      .then((data) => {
        setFormData({
          title: data.title || '',
          description: data.description || '',
        });
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

    const res = await fetch('/api/admin/sections/skills', {
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
      <AdminPageWrapper title="Skills Section">
        <div className="space-y-8">
          <div className="h-16 bg-neutral-100 rounded-lg animate-pulse"></div>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="h-6 bg-neutral-200 rounded w-1/3 animate-pulse"></div>
              <div className="h-4 bg-neutral-100 rounded w-2/3 animate-pulse"></div>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="h-4 bg-neutral-200 rounded w-1/4 animate-pulse"></div>
                <div className="h-12 bg-neutral-100 rounded-lg animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-neutral-200 rounded w-1/4 animate-pulse"></div>
                <div className="h-24 bg-neutral-100 rounded-lg animate-pulse"></div>
              </div>
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
      title="Skills Section"
      description="Configure the title and description for the skills section on your portfolio."
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
          title="Skills Section Settings"
          description="Update the heading and description shown on the skills section of your portfolio."
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                Section Title
              </label>
              <input
                name="title"
                type="text"
                value={formData.title || ''}
                onChange={handleChange}
                placeholder="e.g. Technical Skills"
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                Section Description
              </label>
              <textarea
                name="description"
                value={formData.description || ''}
                onChange={handleChange}
                placeholder="e.g. The technology stack and tools I use to bring ideas to life"
                rows={3}
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg resize-none"
              />
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
