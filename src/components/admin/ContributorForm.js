'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Button } from '@/components/custom-ui';
import ActionButton from './ActionButton';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import MediaLibraryModal from './MediaLibraryModal';

const defaultContributor = {
  name: '',
  avatar: '',
  bio: '',
  portfolio: '',
  linkedin: '',
  github: '',
  twitter: '',
  dribbble: '',
  behance: '',
  instagram: '',
  youtube: '',
};

export default function ContributorForm({ initialData, onSave, isEditing = false }) {
  const router = useRouter();
  const [formData, setFormData] = useState(initialData || defaultContributor);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...defaultContributor,
        ...initialData,
        ...initialData.socialLinks,
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleMediaSelect = (asset) => {
    setFormData((prev) => ({ ...prev, avatar: asset.secure_url }));
    setIsMediaModalOpen(false);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    const submissionData = new FormData();

    // Add basic fields
    submissionData.append('name', formData.name);
    submissionData.append('avatar', formData.avatar);
    submissionData.append('bio', formData.bio);

    // Add social links
    submissionData.append('portfolio', formData.portfolio);
    submissionData.append('linkedin', formData.linkedin);
    submissionData.append('github', formData.github);
    submissionData.append('twitter', formData.twitter);
    submissionData.append('dribbble', formData.dribbble);
    submissionData.append('behance', formData.behance);
    submissionData.append('instagram', formData.instagram);
    submissionData.append('youtube', formData.youtube);

    try {
      if (isEditing) {
        await onSave(initialData._id, submissionData);
      } else {
        await onSave(submissionData);
      }
      setMessage({
        type: 'success',
        text: `Contributor ${isEditing ? 'updated' : 'created'} successfully!`,
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Failed to save contributor:', error);
      setMessage({ type: 'error', text: 'An error occurred while saving.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPageWrapper
      title={isEditing ? 'Edit Contributor' : 'Create New Contributor'}
      description={
        isEditing
          ? `Editing "${initialData?.name}"`
          : 'Add a new contributor to your portfolio projects.'
      }
    >
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg border-l-4 ${
            message.type === 'success'
              ? 'bg-green-50 border-green-400 text-green-800'
              : 'bg-red-50 border-red-400 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleFormSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            {/* --- BASIC INFO --- */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-black font-['Playfair_Display'] mb-4">
                Basic Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                    Name *
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black"
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                    Avatar URL *
                  </label>
                  <div className="flex gap-2">
                    <input
                      name="avatar"
                      type="url"
                      required
                      value={formData.avatar}
                      onChange={handleChange}
                      className="flex-1 px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black"
                      placeholder="https://example.com/avatar.jpg or select from media library"
                    />
                    <Button
                      type="button"
                      onClick={() => setIsMediaModalOpen(true)}
                      variant="secondary"
                      size="sm"
                      className="px-3 py-3"
                    >
                      <i className="fas fa-images"></i>
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                    Bio
                  </label>
                  <textarea
                    name="bio"
                    rows={3}
                    value={formData.bio}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black resize-y"
                    placeholder="Short biography or description"
                  />
                </div>
              </div>
            </Card>

            {/* --- SOCIAL LINKS --- */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-black font-['Playfair_Display'] mb-4">
                Social Links
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <i className="fas fa-globe mr-2"></i>
                    Portfolio
                  </label>
                  <input
                    name="portfolio"
                    type="url"
                    value={formData.portfolio}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    placeholder="https://johndoe.dev"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <i className="fab fa-linkedin mr-2"></i>
                    LinkedIn
                  </label>
                  <input
                    name="linkedin"
                    type="url"
                    value={formData.linkedin}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    placeholder="https://linkedin.com/in/johndoe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <i className="fab fa-github mr-2"></i>
                    GitHub
                  </label>
                  <input
                    name="github"
                    type="url"
                    value={formData.github}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    placeholder="https://github.com/johndoe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <i className="fab fa-twitter mr-2"></i>
                    Twitter/X
                  </label>
                  <input
                    name="twitter"
                    type="url"
                    value={formData.twitter}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    placeholder="https://twitter.com/johndoe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <i className="fab fa-dribbble mr-2"></i>
                    Dribbble
                  </label>
                  <input
                    name="dribbble"
                    type="url"
                    value={formData.dribbble}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    placeholder="https://dribbble.com/johndoe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <i className="fab fa-behance mr-2"></i>
                    Behance
                  </label>
                  <input
                    name="behance"
                    type="url"
                    value={formData.behance}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    placeholder="https://behance.net/johndoe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <i className="fab fa-instagram mr-2"></i>
                    Instagram
                  </label>
                  <input
                    name="instagram"
                    type="url"
                    value={formData.instagram}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    placeholder="https://instagram.com/johndoe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <i className="fab fa-youtube mr-2"></i>
                    YouTube
                  </label>
                  <input
                    name="youtube"
                    type="url"
                    value={formData.youtube}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg"
                    placeholder="https://youtube.com/@johndoe"
                  />
                </div>
              </div>
            </Card>
          </div>

          <div className="lg:col-span-1 space-y-8 lg:sticky lg:top-28">
            {/* --- PREVIEW --- */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-black font-['Playfair_Display'] mb-4">
                Preview
              </h3>
              {formData.avatar && formData.name ? (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-4">
                    <img
                      src={formData.avatar}
                      alt={formData.name}
                      className="w-12 h-12 rounded-full mr-4 object-cover"
                    />
                    <div>
                      <h4 className="font-semibold text-gray-900">{formData.name}</h4>
                      <p className="text-sm text-gray-500">{formData.bio || 'No bio available'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.portfolio && (
                      <a href={formData.portfolio} className="text-gray-600 hover:text-black">
                        <i className="fas fa-globe"></i>
                      </a>
                    )}
                    {formData.linkedin && (
                      <a href={formData.linkedin} className="text-gray-600 hover:text-black">
                        <i className="fab fa-linkedin"></i>
                      </a>
                    )}
                    {formData.github && (
                      <a href={formData.github} className="text-gray-600 hover:text-black">
                        <i className="fab fa-github"></i>
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Add name and avatar URL to see preview</p>
              )}
            </Card>

            {/* --- ACTIONS --- */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-black font-['Playfair_Display'] mb-4">
                Actions
              </h3>
              <div className="space-y-4">
                <ActionButton
                  isSaving={saving}
                  text={isEditing ? 'Update Contributor' : 'Create Contributor'}
                  savingText="Saving..."
                  className="w-full"
                />
                <ActionButton
                  onClick={() => router.push('/admin/contributors')}
                  text="Cancel"
                  variant="ghost"
                  className="w-full"
                />
              </div>
            </Card>
          </div>
        </div>
      </form>

      {/* Media Library Modal */}
      <MediaLibraryModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={handleMediaSelect}
      />
    </AdminPageWrapper>
  );
}
