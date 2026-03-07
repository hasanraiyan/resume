'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import ActionButton from '@/components/admin/ActionButton';

const fieldLabels = {
  title: 'Section Title',
  description: 'Section Description',
  subtitle: 'Subtitle',
  viewAllText: 'View All Button Text',
  viewAllLink: 'View All Link',
  achievementTitle: 'Achievements Heading',
  achievementDescription: 'Achievements Description',
  certificationTitle: 'Certifications Heading',
  certificationDescription: 'Certifications Description',
  imageAiTitle: 'AI Artist Title',
  imageAiDescription: 'AI Artist Description',
  imageAiPlaceholder: 'AI Artist Placeholder',
  imageAiButtonText: 'AI Artist Button Text',
  presentationTitle: 'Presentation Gen Title',
  presentationDescription: 'Presentation Gen Description',
  presentationPlaceholder: 'Presentation Gen Placeholder',
  presentationButtonText: 'Presentation Gen Button Text',
};

export default function GenericSectionAdminPage({ params }) {
  const { type } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();

  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchSectionData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/sections/${type}`);
      const result = await response.json();

      if (result.success) {
        // Filter out internal fields like _id, __v, createdAt, updatedAt
        const filteredData = Object.keys(result.data)
          .filter((key) => !['_id', '__v', 'createdAt', 'updatedAt', 'isActive'].includes(key))
          .reduce((obj, key) => {
            obj[key] = result.data[key];
            return obj;
          }, {});

        setFormData(filteredData);
      } else {
        setMessage({ type: 'error', text: 'Failed to load section data' });
      }
    } catch (error) {
      console.error('Error fetching section data:', error);
      setMessage({ type: 'error', text: 'Failed to load section data' });
    } finally {
      setLoading(false);
    }
  }, [type]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/admin/login');
    } else if (status === 'authenticated' && session?.user?.role === 'admin') {
      fetchSectionData();
    }
  }, [status, session, router, fetchSectionData]);

  const handleInputChange = (key, value) => {
    setFormData((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch(`/api/admin/sections/${type}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setMessage({ type: 'success', text: 'Section updated successfully!' });
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update section' });
      }
    } catch (error) {
      console.error('Error saving section data:', error);
      setMessage({ type: 'error', text: 'Failed to save changes' });
    } finally {
      setSaving(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <AdminPageWrapper title={`Manage ${type}`}>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
        </div>
      </AdminPageWrapper>
    );
  }

  const sectionLabel = type
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return (
    <AdminPageWrapper title={`Manage ${sectionLabel} Section`}>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-sm text-neutral-500 hover:text-black flex items-center gap-2"
          >
            <i className="fas fa-arrow-left"></i> Back to Sections
          </button>
        </div>

        {message.text && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        <div className="bg-white p-8 rounded-xl border border-neutral-200 shadow-sm space-y-6">
          {formData &&
            Object.keys(formData).map((key) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-neutral-900 mb-2">
                  {fieldLabels[key] || key.charAt(0).toUpperCase() + key.slice(1)}
                </label>
                {key.toLowerCase().includes('description') ||
                (key.toLowerCase().includes('text') && formData[key]?.length > 50) ? (
                  <textarea
                    value={formData[key] || ''}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    rows={4}
                    className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  />
                ) : (
                  <input
                    type="text"
                    value={formData[key] || ''}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent transition-all"
                  />
                )}
              </div>
            ))}

          <div className="pt-4 flex items-center gap-4">
            <ActionButton
              isSaving={saving}
              onClick={handleSave}
              text="Save Changes"
              savingText="Saving..."
            />
            <button
              onClick={fetchSectionData}
              className="px-6 py-2.5 text-neutral-600 hover:text-black font-medium transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </AdminPageWrapper>
  );
}
