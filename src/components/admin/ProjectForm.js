'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Card } from '@/components/ui';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import CustomDropdownMinimal from '@/components/CustomDropdown';
import ProjectPreviewCard from './ProjectPreviewCard';
import ImageManager from './ImageManager';
import TagManager from './TagManager';
import FormSection from './FormSection';

const defaultProject = {
  title: '',
  slug: '',
  projectNumber: '',
  category: 'Web Development',
  tagline: '',
  thumbnail: '',
  description: '',
  fullDescription: '',
  featured: false,
  images: [{ url: '', alt: '', caption: '' }],
  tags: [{ name: '', category: '' }],
};

export default function ProjectForm({ 
  initialData, 
  onSave, 
  onDelete,
  isEditing = false 
}) {
  const router = useRouter();
  const [formData, setFormData] = useState(initialData || defaultProject);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(!isEditing);

  useEffect(() => {
    if (initialData) {
      // Ensure arrays are not null/undefined
      const data = {
        ...defaultProject,
        ...initialData,
        images: initialData.images?.length > 0 ? initialData.images : [{ url: '', alt: '', caption: '' }],
        tags: initialData.tags?.length > 0 ? initialData.tags : [{ name: '', category: '' }],
      };
      setFormData(data);
    }
  }, [initialData]);
  
  const categoryOptions = [
    { value: 'Web Development', label: 'Web Development' },
    { value: 'Mobile App', label: 'Mobile App' },
    { value: 'UI/UX Design', label: 'UI/UX Design' },
    { value: 'Branding', label: 'Branding' },
    { value: 'E-commerce', label: 'E-commerce' }
  ];

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => {
      const newFormData = { ...prev, [name]: newValue };
      if (name === 'title' && autoGenerateSlug) {
        newFormData.slug = generateSlug(newValue);
      }
      return newFormData;
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    const submissionData = new FormData();
    for (const key in formData) {
      if (key === 'images' || key === 'tags') {
        // Filter out empty items before stringifying
        const validImages = formData.images.filter(img => img.url.trim() !== '');
        const validTags = formData.tags.filter(tag => tag.name.trim() !== '');
        submissionData.append(key, JSON.stringify(key === 'images' ? validImages : validTags));
      } else {
        submissionData.append(key, formData[key]);
      }
    }
    
    try {
      if (isEditing) {
        await onSave(initialData._id, submissionData);
      } else {
        await onSave(submissionData);
      }
      // Server actions handle redirect, but we can show a message
      setMessage({ type: 'success', text: `Project ${isEditing ? 'updated' : 'created'} successfully!` });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Failed to save project:', error);
      setMessage({ type: 'error', text: 'An error occurred while saving.' });
      setSaving(false);
    }
  };
  
  const handleDelete = async () => {
    if (!isEditing || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(initialData._id);
      // Redirect is handled by the server action
    } catch (error) {
      console.error('Error deleting project:', error);
      setMessage({ type: 'error', text: 'Failed to delete project.' });
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <AdminPageWrapper
      title={isEditing ? 'Edit Project' : 'Create New Project'}
      description={isEditing ? `Editing "${initialData?.title}"` : 'Add a new project to your portfolio.'}
    >
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg border-l-4 ${
          message.type === 'success' ? 'bg-green-50 border-green-400 text-green-800' : 'bg-red-50 border-red-400 text-red-800'
        }`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleFormSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Left Column - Form Fields */}
          <div className="lg:col-span-2 space-y-8">
            <FormSection
              title="Basic Information"
              description="Core details for your project. The title and slug are required."
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">Project Title *</label>
                  <input name="title" type="text" required value={formData.title} onChange={handleChange} className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">URL Slug *</label>
                  <input name="slug" type="text" required value={formData.slug} onChange={handleChange} readOnly={autoGenerateSlug} className={`w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black ${autoGenerateSlug ? 'bg-neutral-100' : ''}`} />
                  <label className="flex items-center text-xs text-neutral-600 mt-2">
                    <input type="checkbox" checked={autoGenerateSlug} onChange={(e) => setAutoGenerateSlug(e.target.checked)} className="mr-1 w-3 h-3"/>
                    Auto-generate from title
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">Project Number *</label>
                  <input name="projectNumber" type="text" required value={formData.projectNumber} onChange={handleChange} className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black" />
                </div>
                <div className="md:col-span-2">
                  <CustomDropdownMinimal label="CATEGORY *" options={categoryOptions} value={formData.category} onChange={handleChange} name="category" />
                </div>
              </div>
            </FormSection>

            <FormSection
              title="Content & Description"
              description="Provide the text content for the project listing and the detailed page."
            >
              <div className="space-y-6">
                <div>
                    <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">Tagline *</label>
                    <input name="tagline" type="text" required value={formData.tagline} onChange={handleChange} className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">Short Description *</label>
                  <textarea name="description" rows={3} required value={formData.description} onChange={handleChange} className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black resize-y" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">Full Description *</label>
                  <textarea name="fullDescription" rows={6} required value={formData.fullDescription} onChange={handleChange} className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black resize-y" />
                </div>
              </div>
            </FormSection>
            
            <FormSection
              title="Project Images"
              description="Add gallery images for your project. The first image URL will be used as the thumbnail."
            >
              <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">Thumbnail Image URL *</label>
              <input name="thumbnail" type="url" required value={formData.thumbnail} onChange={handleChange} className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black mb-6" />
              <ImageManager images={formData.images} setImages={(newImages) => setFormData(p => ({ ...p, images: newImages }))} />
            </FormSection>

            <FormSection
              title="Technologies & Tags"
              description="List the technologies used. This will be displayed on the project page."
            >
              <TagManager tags={formData.tags} setTags={(newTags) => setFormData(p => ({ ...p, tags: newTags }))} />
            </FormSection>
          </div>

          {/* Right Column - Preview & Actions */}
          <div className="lg:col-span-1 space-y-8 lg:sticky lg:top-28">
            <FormSection title="Live Preview" noBorder>
              <ProjectPreviewCard project={formData} />
            </FormSection>
            
            <Card className="p-6">
              <h3 className="text-lg font-bold text-black font-['Playfair_Display'] mb-4">Actions</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg">
                  <input name="featured" type="checkbox" checked={formData.featured} onChange={handleChange} className="w-5 h-5 text-black border-2 border-neutral-300 rounded focus:ring-black" id="featured" />
                  <div>
                    <label htmlFor="featured" className="font-semibold text-black cursor-pointer">Featured Project</label>
                    <p className="text-sm text-neutral-600">Show on homepage.</p>
                  </div>
                </div>
                <Button type="submit" variant="primary" disabled={saving} className="w-full">
                  {saving ? 'Saving...' : (isEditing ? 'Update Project' : 'Create Project')}
                </Button>
                <Button type="button" href="/admin/projects" variant="ghost" className="w-full">Cancel</Button>
              </div>

              {isEditing && (
                <>
                  <div className="h-px bg-neutral-200 my-6"></div>
                  <Button type="button" variant="ghost" onClick={() => setShowDeleteModal(true)} className="w-full text-red-600 hover:bg-red-50">
                    Delete Project
                  </Button>
                </>
              )}
            </Card>
          </div>
        </div>
      </form>

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-black">Delete Project</h3>
            <p className="text-neutral-600 my-4">Are you sure you want to delete this project? This action cannot be undone.</p>
            <div className="flex gap-3">
              <Button onClick={() => setShowDeleteModal(false)} variant="ghost" className="flex-1">Cancel</Button>
              <Button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-600 text-white hover:bg-red-700">
                {deleting ? 'Deleting...' : 'Delete Project'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </AdminPageWrapper>
  );
}