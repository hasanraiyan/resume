'use client';

import { useState, useEffect } from 'react';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import FormSection from '@/components/admin/FormSection';
import ActionButton from '@/components/admin/ActionButton';
import Switch from '@/components/admin/Switch';
import IconPicker from '@/components/admin/IconPicker';
import { getAboutData } from '@/app/actions/aboutActions';
import { useUploadThing } from '@/utils/uploadthing';

export default function AboutSectionAdminPage() {
  const [formData, setFormData] = useState({
    sectionTitle: 'About Me',
    bio: {
      paragraphs: [''],
    },
    resume: {
      text: 'Download Resume',
      url: '#',
    },
    features: [],
    isActive: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [uploadingResume, setUploadingResume] = useState(false);

  const { startUpload } = useUploadThing('resumeUploader', {
    onClientUploadComplete: (res) => {
      if (res && res[0]) {
        handleResumeChange('url', res[0].url);
        setMessage({ type: 'success', text: 'Resume uploaded successfully' });
      }
      setUploadingResume(false);
    },
    onUploadError: (error) => {
      console.error('Error uploading resume:', error);
      setMessage({ type: 'error', text: 'Failed to upload resume' });
      setUploadingResume(false);
    },
  });

  useEffect(() => {
    fetchAboutData();
  }, []);

  const fetchAboutData = async () => {
    try {
      const data = await getAboutData();
      if (data) {
        setFormData({
          sectionTitle: data.sectionTitle || 'About Me',
          bio: {
            paragraphs: data.bio?.paragraphs?.length > 0 ? data.bio.paragraphs : [''],
          },
          resume: {
            text: data.resume?.text || 'Download Resume',
            url: data.resume?.url || '#',
          },
          features: data.features || [],
          isActive: data.isActive !== false,
        });
      }
    } catch (error) {
      console.error('Error fetching about data:', error);
      setMessage({ type: 'error', text: 'Failed to load about section data' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBioChange = (index, value) => {
    setFormData((prev) => {
      const newParagraphs = [...prev.bio.paragraphs];
      newParagraphs[index] = value;
      return {
        ...prev,
        bio: { ...prev.bio, paragraphs: newParagraphs },
      };
    });
  };

  const addParagraph = () => {
    setFormData((prev) => ({
      ...prev,
      bio: {
        ...prev.bio,
        paragraphs: [...prev.bio.paragraphs, ''],
      },
    }));
  };

  const removeParagraph = (index) => {
    setFormData((prev) => {
      const newParagraphs = prev.bio.paragraphs.filter((_, i) => i !== index);
      return {
        ...prev,
        bio: { ...prev.bio, paragraphs: newParagraphs.length > 0 ? newParagraphs : [''] },
      };
    });
  };

  const handleResumeChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      resume: { ...prev.resume, [field]: value },
    }));
  };

  const handleFeatureChange = (index, field, value) => {
    setFormData((prev) => {
      const newFeatures = [...prev.features];
      newFeatures[index] = { ...newFeatures[index], [field]: value };
      return { ...prev, features: newFeatures };
    });
  };

  const addFeature = () => {
    if (formData.features.length >= 4) {
      setMessage({ type: 'error', text: 'You can only add up to 4 feature highlights.' });
      return;
    }

    const newFeature = {
      id: Date.now(),
      icon: 'fas fa-lightbulb',
      title: 'New Feature',
      description: 'Feature description',
    };
    setFormData((prev) => ({
      ...prev,
      features: [...prev.features, newFeature],
    }));
  };

  const removeFeature = (index) => {
    setFormData((prev) => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index),
    }));
  };

  const handleResumeUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: 'Please upload a PDF or Word document' });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'File size must be less than 5MB' });
      return;
    }

    setUploadingResume(true);
    setMessage({ type: '', text: '' });

    try {
      await startUpload([file]);
    } catch (error) {
      console.error('Error uploading resume:', error);
      setMessage({ type: 'error', text: 'Failed to upload resume' });
      setUploadingResume(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const response = await fetch('/api/admin/about-section', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'About section saved successfully' });
      } else {
        throw new Error('Save failed');
      }
    } catch (error) {
      console.error('Error saving about section:', error);
      setMessage({ type: 'error', text: 'Failed to save about section' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    fetchAboutData();
    setMessage({ type: '', text: '' });
  };

  if (loading) {
    return (
      <AdminPageWrapper title="About Section">
        <div className="space-y-8">
          <div className="h-16 bg-neutral-100 rounded-lg animate-pulse"></div>
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="h-6 bg-neutral-200 rounded w-1/3 animate-pulse"></div>
              <div className="h-4 bg-neutral-100 rounded w-2/3 animate-pulse"></div>
            </div>
            <div className="space-y-4">
              <div className="h-12 bg-neutral-100 rounded-lg animate-pulse"></div>
              <div className="h-24 bg-neutral-100 rounded-lg animate-pulse"></div>
              <div className="h-12 bg-neutral-100 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper
      title="About Section"
      description="Manage your about section content, bio, resume, and feature highlights."
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
        <FormSection
          title="Section Settings"
          description="Configure the about section title and visibility."
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                Section Title
              </label>
              <input
                name="sectionTitle"
                type="text"
                value={formData.sectionTitle}
                onChange={handleChange}
                placeholder="About Me"
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-black focus:outline-none transition-colors"
              />
            </div>

            <Switch
              label="Section Active"
              description="Toggle the visibility of the about section on your portfolio."
              checked={formData.isActive}
              onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isActive: checked }))}
            />
          </div>
        </FormSection>

        <FormSection
          title="Biography"
          description="Write your personal biography. You can add multiple paragraphs for rich content."
        >
          <div className="space-y-4">
            {formData.bio.paragraphs.map((paragraph, index) => (
              <div key={index} className="flex gap-2">
                <textarea
                  value={paragraph}
                  onChange={(e) => handleBioChange(index, e.target.value)}
                  placeholder={`Paragraph ${index + 1}`}
                  rows={3}
                  className="flex-1 px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-black focus:outline-none transition-colors resize-none"
                />
                {formData.bio.paragraphs.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeParagraph(index)}
                    className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={addParagraph}
              className="px-4 py-2 text-black border-2 border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
            >
              <i className="fas fa-plus mr-2"></i>
              Add Paragraph
            </button>
          </div>
        </FormSection>

        <FormSection
          title="Resume"
          description="Configure your resume download button and upload your resume file."
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                Button Text
              </label>
              <input
                type="text"
                value={formData.resume.text}
                onChange={(e) => handleResumeChange('text', e.target.value)}
                placeholder="Download Resume"
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-black focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                Resume URL
              </label>
              <input
                type="url"
                value={formData.resume.url}
                onChange={(e) => handleResumeChange('url', e.target.value)}
                placeholder="https://example.com/resume.pdf"
                className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-black focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                Upload Resume
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleResumeUpload}
                  disabled={uploadingResume}
                  className="flex-1 px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-black focus:outline-none transition-colors"
                />
                {uploadingResume && (
                  <div className="flex items-center gap-2 text-neutral-600">
                    <i className="fas fa-spinner fa-spin"></i>
                    Uploading...
                  </div>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Upload PDF or Word document (max 5MB). This will update the resume URL above.
              </p>
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Feature Highlights"
          description="Add up to 4 feature highlights that showcase your key skills and attributes."
        >
          <div className="space-y-6">
            {formData.features.map((feature, index) => (
              <div
                key={feature.id}
                className="p-4 border-2 border-neutral-200 rounded-lg space-y-4"
              >
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold text-black">Feature {index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeFeature(index)}
                    className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                  >
                    <i className="fas fa-trash mr-1"></i>
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                      Icon
                    </label>
                    <IconPicker
                      selectedIcon={feature.icon}
                      onIconSelect={(iconClass) => handleFeatureChange(index, 'icon', iconClass)}
                      placeholder="Select Feature Icon"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                      Title
                    </label>
                    <input
                      type="text"
                      value={feature.title}
                      onChange={(e) => handleFeatureChange(index, 'title', e.target.value)}
                      placeholder="Feature Title"
                      className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-black focus:outline-none transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                    Description
                  </label>
                  <textarea
                    value={feature.description}
                    onChange={(e) => handleFeatureChange(index, 'description', e.target.value)}
                    placeholder="Feature description"
                    rows={2}
                    className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:border-black focus:outline-none transition-colors resize-none"
                  />
                </div>
              </div>
            ))}

            {formData.features.length < 4 ? (
              <button
                type="button"
                onClick={addFeature}
                className="w-full px-4 py-3 text-black border-2 border-dashed border-neutral-300 rounded-lg hover:border-black hover:bg-neutral-50 transition-colors"
              >
                <i className="fas fa-plus mr-2"></i>
                Add Feature ({formData.features.length}/4)
              </button>
            ) : (
              <div className="w-full px-4 py-3 text-neutral-500 border-2 border-dashed border-neutral-200 rounded-lg bg-neutral-50 text-center text-sm font-medium">
                Maximum limit of 4 features reached
              </div>
            )}
          </div>
        </FormSection>

        <div className="flex gap-4 pt-6 border-t border-neutral-200">
          <ActionButton isSaving={saving} text="Save Changes" savingText="Saving..." />
          <ActionButton type="button" onClick={handleReset} text="Reset" variant="secondary" />
        </div>
      </form>
    </AdminPageWrapper>
  );
}
