'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import FormSection from '@/components/admin/FormSection';
import ActionButton from '@/components/admin/ActionButton';

const DEFAULT_NAV_ITEM = { id: 0, label: '', href: '' };

export default function SiteConfigPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    siteName: '',
    tagline: '',
    ownerName: '',
    navigation: [],
    navbarCta: { text: '', href: '' },
    footerText: '',
    seo: { description: '', keywords: [] },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [keywordInput, setKeywordInput] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || session.user.role !== 'admin') {
      router.push('/login');
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session?.user?.role === 'admin') {
      fetch('/api/admin/site-config')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setFormData({
              siteName: data.data.siteName || '',
              tagline: data.data.tagline || '',
              ownerName: data.data.ownerName || '',
              navigation: data.data.navigation || [],
              navbarCta: data.data.navbarCta || { text: '', href: '' },
              footerText: data.data.footerText || '',
              seo: data.data.seo || { description: '', keywords: [] },
            });
          }
        })
        .catch((error) => {
          console.error('Error fetching site config:', error);
          setMessage({ type: 'error', text: 'Failed to load site configuration' });
        })
        .finally(() => setLoading(false));
    }
  }, [session]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNestedChange = (parent, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value },
    }));
  };

  const handleNavigationChange = (index, field, value) => {
    setFormData((prev) => {
      const newNav = [...prev.navigation];
      newNav[index] = { ...newNav[index], [field]: value };
      return { ...prev, navigation: newNav };
    });
  };

  const addNavigationItem = () => {
    setFormData((prev) => {
      const maxId = prev.navigation.reduce((max, item) => Math.max(max, item.id || 0), 0);
      return {
        ...prev,
        navigation: [...prev.navigation, { ...DEFAULT_NAV_ITEM, id: maxId + 1 }],
      };
    });
  };

  const removeNavigationItem = (index) => {
    setFormData((prev) => {
      const newNav = prev.navigation.filter((_, i) => i !== index);
      return { ...prev, navigation: newNav };
    });
  };

  const moveNavigationItem = (index, direction) => {
    setFormData((prev) => {
      const newNav = [...prev.navigation];
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= newNav.length) return prev;
      [newNav[index], newNav[newIndex]] = [newNav[newIndex], newNav[index]];
      return { ...prev, navigation: newNav };
    });
  };

  const addKeyword = () => {
    if (!keywordInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      seo: { ...prev.seo, keywords: [...prev.seo.keywords, keywordInput.trim()] },
    }));
    setKeywordInput('');
  };

  const removeKeyword = (index) => {
    setFormData((prev) => ({
      ...prev,
      seo: {
        ...prev.seo,
        keywords: prev.seo.keywords.filter((_, i) => i !== index),
      },
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await fetch('/api/admin/site-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await res.json();
      if (result.success) {
        setMessage({ type: 'success', text: 'Site configuration updated successfully!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update site configuration' });
      }
    } catch (error) {
      console.error('Error saving site config:', error);
      setMessage({ type: 'error', text: 'Failed to save changes' });
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AdminPageWrapper title="Site Configuration">
        <div className="space-y-8">
          <div className="h-16 bg-neutral-100 rounded-lg animate-pulse"></div>
          <div className="space-y-6">
            <div className="h-6 bg-neutral-200 rounded w-1/3 animate-pulse"></div>
            <div className="h-12 bg-neutral-100 rounded-lg animate-pulse"></div>
            <div className="h-12 bg-neutral-100 rounded-lg animate-pulse"></div>
          </div>
        </div>
      </AdminPageWrapper>
    );
  }

  if (!session || session.user.role !== 'admin') {
    return null;
  }

  return (
    <AdminPageWrapper
      title="Site Configuration"
      description="Manage site-wide settings including navigation, branding, and SEO."
    >
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Basic Settings */}
        <FormSection title="Basic Settings" description="Site name, owner, and tagline.">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Site Name</label>
              <input
                name="siteName"
                type="text"
                value={formData.siteName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="My Portfolio"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Owner Name</label>
              <input
                name="ownerName"
                type="text"
                value={formData.ownerName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Tagline</label>
              <input
                name="tagline"
                type="text"
                value={formData.tagline}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Digital Excellence"
              />
            </div>
          </div>
        </FormSection>

        {/* Navigation */}
        <FormSection
          title="Navigation"
          description="Main navigation links shown in the navbar and mobile menu."
        >
          <div className="space-y-4">
            {formData.navigation.map((item, index) => (
              <div
                key={index}
                className="p-4 border border-neutral-200 rounded-lg bg-neutral-50 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm">Item {index + 1}</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => moveNavigationItem(index, 'up')}
                      disabled={index === 0}
                      className="p-1 text-neutral-600 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <i className="fas fa-arrow-up"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => moveNavigationItem(index, 'down')}
                      disabled={index === formData.navigation.length - 1}
                      className="p-1 text-neutral-600 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <i className="fas fa-arrow-down"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => removeNavigationItem(index)}
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Label</label>
                    <input
                      type="text"
                      value={item.label}
                      onChange={(e) => handleNavigationChange(index, 'label', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded text-sm bg-white"
                      placeholder="e.g., Projects"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">URL</label>
                    <input
                      type="text"
                      value={item.href}
                      onChange={(e) => handleNavigationChange(index, 'href', e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-300 rounded text-sm bg-white"
                      placeholder="/projects"
                    />
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addNavigationItem}
              className="w-full py-2 border-2 border-dashed border-neutral-300 text-neutral-600 rounded-lg hover:border-black hover:text-black transition-colors"
            >
              <i className="fas fa-plus mr-2"></i>
              Add Navigation Item
            </button>
          </div>
        </FormSection>

        {/* CTA Button */}
        <FormSection title="Navbar CTA" description="The call-to-action button in the navbar.">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Button Text</label>
              <input
                type="text"
                value={formData.navbarCta.text}
                onChange={(e) => handleNestedChange('navbarCta', 'text', e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Let's Talk"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Button URL</label>
              <input
                type="text"
                value={formData.navbarCta.href}
                onChange={(e) => handleNestedChange('navbarCta', 'href', e.target.value)}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="/#contact"
              />
            </div>
          </div>
        </FormSection>

        {/* SEO */}
        <FormSection
          title="SEO Settings"
          description="Meta description and keywords for search engines."
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Meta Description
              </label>
              <textarea
                value={formData.seo.description}
                onChange={(e) => handleNestedChange('seo', 'description', e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Expert web development and design portfolio."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">Keywords</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
                  className="flex-1 px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                  placeholder="Add keyword..."
                />
                <button
                  type="button"
                  onClick={addKeyword}
                  className="px-4 py-3 bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.seo.keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-100 text-neutral-700 rounded-full text-sm"
                  >
                    {keyword}
                    <button
                      type="button"
                      onClick={() => removeKeyword(index)}
                      className="text-neutral-500 hover:text-red-600"
                    >
                      <i className="fas fa-times text-xs"></i>
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </FormSection>

        {/* Footer */}
        <FormSection title="Footer" description="Footer text and copyright information.">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">Footer Text</label>
            <textarea
              name="footerText"
              value={formData.footerText}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
              placeholder="© 2024 My Portfolio. All rights reserved."
            />
          </div>
        </FormSection>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 pt-6 border-t border-neutral-200">
          <ActionButton isSaving={saving} text="Save Settings" savingText="Saving..." />
        </div>
      </form>
    </AdminPageWrapper>
  );
}
