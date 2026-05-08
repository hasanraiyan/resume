'use client';

import { useState, useEffect } from 'react';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import FormSection from '@/components/admin/FormSection';
import ActionButton from '@/components/admin/ActionButton';

export default function TestimonialsSettingsPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetch('/api/admin/sections/testimonials')
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

    const res = await fetch('/api/admin/sections/testimonials', {
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
      <AdminPageWrapper title="Testimonials Section">
        <div className="space-y-8">
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
                <div className="h-12 bg-neutral-100 rounded-lg animate-pulse"></div>
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
      title="Testimonials Section"
      description="Configure the testimonials section displayed on your portfolio."
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
          title="Section Header"
          description="Set the title and description for the testimonials section."
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                Title
              </label>
              <input
                name="title"
                type="text"
                value={formData.title || ''}
                onChange={handleChange}
                placeholder="Client Testimonials"
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                Description
              </label>
              <input
                name="description"
                type="text"
                value={formData.description || ''}
                onChange={handleChange}
                placeholder="What my clients say about working with me"
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg"
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
