'use client';

import { useState, useEffect } from 'react';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import FormSection from '@/components/admin/FormSection';
import ActionButton from '@/components/admin/ActionButton';
import Switch from '@/components/admin/Switch';

function generateId() {
  return Date.now() + Math.floor(Math.random() * 1000);
}

export default function StatsSettingsPage() {
  const [formData, setFormData] = useState({
    heading: { title: '', description: '' },
    stats: [],
    animation: { countUp: true, duration: 2000 },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetch('/api/admin/sections/stats')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setFormData(data.data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      heading: { ...prev.heading, [name]: value },
    }));
  };

  const handleAnimationChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      animation: {
        ...prev.animation,
        [name]: type === 'checkbox' ? checked : Number(value),
      },
    }));
  };

  const handleStatChange = (index, field, value) => {
    setFormData((prev) => {
      const updated = [...prev.stats];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, stats: updated };
    });
  };

  const addStat = () => {
    setFormData((prev) => ({
      ...prev,
      stats: [
        ...prev.stats,
        {
          id: generateId(),
          number: '0',
          label: '',
          icon: 'fas fa-chart-bar',
          description: '',
        },
      ],
    }));
  };

  const removeStat = (index) => {
    setFormData((prev) => ({
      ...prev,
      stats: prev.stats.filter((_, i) => i !== index),
    }));
  };

  const moveStat = (index, direction) => {
    setFormData((prev) => {
      const updated = [...prev.stats];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= updated.length) return prev;
      [updated[index], updated[targetIndex]] = [updated[targetIndex], updated[index]];
      return { ...prev, stats: updated };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    const res = await fetch('/api/admin/sections/stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    const result = await res.json();
    setMessage({ type: res.ok ? 'success' : 'error', text: result.message || result.error });
    setSaving(false);
  };

  if (loading) {
    return (
      <AdminPageWrapper title="Statistics Section">
        <div className="space-y-8">
          <div className="h-16 bg-neutral-100 rounded-lg animate-pulse"></div>
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-6 bg-neutral-200 rounded w-1/3 animate-pulse"></div>
                <div className="h-4 bg-neutral-100 rounded w-2/3 animate-pulse"></div>
                <div className="h-12 bg-neutral-100 rounded-lg animate-pulse mt-4"></div>
              </div>
            ))}
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
      title="Statistics Section"
      description="Manage homepage statistics with animated counters."
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
          title="Heading"
          description="Set the title and description for the statistics section."
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                Section Title
              </label>
              <input
                name="title"
                type="text"
                value={formData.heading.title || ''}
                onChange={handleChange}
                placeholder="e.g., Our Achievements"
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-black focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                Description
              </label>
              <input
                name="description"
                type="text"
                value={formData.heading.description || ''}
                onChange={handleChange}
                placeholder="e.g., Numbers that speak for themselves"
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-black focus:outline-none"
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Statistics"
          description="Add, edit, and reorder statistical items with animated counters."
        >
          <div className="space-y-6">
            {formData.stats.map((stat, index) => (
              <div
                key={stat.id || index}
                className="p-4 border-2 border-neutral-200 rounded-lg space-y-4"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-neutral-500 uppercase tracking-wider">
                    Stat #{index + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveStat(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 text-neutral-400 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move up"
                    >
                      <i className="fas fa-arrow-up text-sm"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveStat(index, 'down')}
                      disabled={index === formData.stats.length - 1}
                      className="p-1.5 text-neutral-400 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move down"
                    >
                      <i className="fas fa-arrow-down text-sm"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeStat(index)}
                      className="p-1.5 text-neutral-400 hover:text-red-500 transition-colors"
                      title="Remove"
                    >
                      <i className="fas fa-trash text-sm"></i>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1 uppercase">
                      Number
                    </label>
                    <input
                      type="text"
                      value={stat.number || ''}
                      onChange={(e) => handleStatChange(index, 'number', e.target.value)}
                      placeholder="e.g., 180+"
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:border-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1 uppercase">
                      Label
                    </label>
                    <input
                      type="text"
                      value={stat.label || ''}
                      onChange={(e) => handleStatChange(index, 'label', e.target.value)}
                      placeholder="e.g., Projects Completed"
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:border-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1 uppercase">
                      Icon Class
                    </label>
                    <input
                      type="text"
                      value={stat.icon || ''}
                      onChange={(e) => handleStatChange(index, 'icon', e.target.value)}
                      placeholder="e.g., fas fa-project-diagram"
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:border-black focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 mb-1 uppercase">
                      Description
                    </label>
                    <input
                      type="text"
                      value={stat.description || ''}
                      onChange={(e) => handleStatChange(index, 'description', e.target.value)}
                      placeholder="e.g., Successfully delivered projects"
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:border-black focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addStat}
              className="w-full py-3 border-2 border-dashed border-neutral-300 rounded-lg text-neutral-500 hover:text-black hover:border-black transition-colors text-sm font-semibold uppercase tracking-wider"
            >
              <i className="fas fa-plus mr-2"></i>
              Add Statistic
            </button>
          </div>
        </FormSection>

        <FormSection title="Animation" description="Configure the counter animation behavior.">
          <div className="space-y-6">
            <Switch
              label="Count-Up Animation"
              description="Animate numbers counting up from zero."
              checked={formData.animation.countUp}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({
                  ...prev,
                  animation: { ...prev.animation, countUp: checked },
                }))
              }
            />
            <div>
              <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                Duration (milliseconds)
              </label>
              <input
                name="duration"
                type="number"
                min="500"
                step="100"
                value={formData.animation.duration || 2000}
                onChange={handleAnimationChange}
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-black focus:outline-none"
              />
              <p className="text-xs text-neutral-500 mt-1">
                How long the animation takes. Default is 2000ms (2 seconds).
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
