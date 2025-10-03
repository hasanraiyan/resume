'use client';

import { useState } from 'react';
import { createProject } from '@/app/actions/projectActions';
import { Input, Button, Card } from '@/components/ui';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import CustomDropdownMinimal from '@/components/CustomDropdown';

export default function NewProjectPage() {
  const [images, setImages] = useState([{ url: '', alt: '', caption: '' }]);
  const [tags, setTags] = useState([{ name: '', category: '' }]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [title, setTitle] = useState('');
  const [autoGenerateSlug, setAutoGenerateSlug] = useState(true);

  const categoryOptions = [
    { value: 'Web Development', label: 'Web Development' },
    { value: 'Mobile App', label: 'Mobile App' },
    { value: 'UI/UX Design', label: 'UI/UX Design' },
    { value: 'Branding', label: 'Branding' },
    { value: 'E-commerce', label: 'E-commerce' }
  ];

  const addImage = () => {
    setImages([...images, { url: '', alt: '', caption: '' }]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const updateImage = (index, field, value) => {
    const newImages = [...images];
    newImages[index][field] = value;
    setImages(newImages);
  };

  const addTag = () => {
    setTags([...tags, { name: '', category: '' }]);
  };

  const removeTag = (index) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const updateTag = (index, field, value) => {
    const newTags = [...tags];
    newTags[index][field] = value;
    setTags(newTags);
  };

  // Auto-generate slug from title
  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (value) => {
    setTitle(value);
    // Auto-generate slug if enabled
    if (autoGenerateSlug && value) {
      const slugInput = document.querySelector('input[name="slug"]');
      if (slugInput) {
        slugInput.value = generateSlug(value);
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (formData) => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Add images and tags as JSON strings
      formData.append('images', JSON.stringify(images.filter(img => img.url)));
      formData.append('tags', JSON.stringify(tags.filter(tag => tag.name)));
      
      await createProject(formData);
      setMessage({ type: 'success', text: 'Project created successfully! Redirecting...' });
      
      // Redirect after success
      setTimeout(() => {
        window.location.href = '/admin/projects';
      }, 2000);
    } catch (error) {
      console.error('Error creating project:', error);
      setMessage({ type: 'error', text: 'Failed to create project. Please try again.' });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPageWrapper
      title="Create New Project"
      description="Add a new project to your portfolio. Fill out all the required information to showcase your work."
      actionButton={
        <Button href="/admin/projects" variant="ghost">
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Projects
        </Button>
      }
    >
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center text-blue-600">
              <i className="fas fa-circle text-xs mr-2"></i>
              Basic Info
            </span>
            <span className="flex items-center text-neutral-400">
              <i className="fas fa-circle text-xs mr-2"></i>
              Images & Tags
            </span>
            <span className="flex items-center text-neutral-400">
              <i className="fas fa-circle text-xs mr-2"></i>
              Review & Publish
            </span>
          </div>
          <div className="mt-2 h-2 bg-neutral-200 rounded-full">
            <div className="h-full w-1/3 bg-blue-600 rounded-full transition-all duration-300"></div>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {message.text && (
        <div className={`mb-6 max-w-4xl mx-auto p-4 rounded-lg border-l-4 ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-400 text-green-800' 
            : 'bg-red-50 border-red-400 text-red-800'
        }`}>
          <div className="flex items-center">
            <i className={`fas ${
              message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-triangle'
            } mr-2`}></i>
            <span className="font-medium">{message.text}</span>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto space-y-8">
        <form action={handleSubmit} className="space-y-8">
          
          {/* Basic Information Card */}
          <Card className="p-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-black font-['Playfair_Display']">
                  Basic Information
                </h2>
                <div className="text-sm text-neutral-600">
                  <i className="fas fa-info-circle mr-1"></i>
                  All fields marked with * are required
                </div>
              </div>
              <div className="h-px bg-neutral-200"></div>
            
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                  Project Title *
                </label>
                <input
                  name="title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="My Awesome Project"
                  className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black transition-colors"
                />
                <p className="text-xs text-neutral-500 mt-1">This will be the main title displayed for your project</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-black uppercase tracking-wider">
                    URL Slug *
                  </label>
                  <label className="flex items-center text-xs text-neutral-600">
                    <input
                      type="checkbox"
                      checked={autoGenerateSlug}
                      onChange={(e) => setAutoGenerateSlug(e.target.checked)}
                      className="mr-1 w-3 h-3"
                    />
                    Auto-generate from title
                  </label>
                </div>
                <input
                  name="slug"
                  type="text"
                  required
                  placeholder="my-awesome-project"
                  className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black transition-colors"
                  readOnly={autoGenerateSlug}
                  style={{ backgroundColor: autoGenerateSlug ? '#f9f9f9' : 'white' }}
                />
                <p className="text-xs text-neutral-500 mt-1">This will be used in the project URL: /projects/<span className="font-mono">your-slug</span></p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                  Project Number *
                </label>
                <input
                  name="projectNumber"
                  type="text"
                  required
                  placeholder="01"
                  className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <div>
                <CustomDropdownMinimal
                  label="CATEGORY *"
                  options={categoryOptions}
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  name="category"
                />
                {/* Hidden input for form submission */}
                <input type="hidden" name="category" value={selectedCategory} />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                  Tagline *
                </label>
                <input
                  name="tagline"
                  type="text"
                  required
                  placeholder="A brief, catchy description"
                  className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                  Thumbnail Image URL *
                </label>
                <input
                  name="thumbnail"
                  type="url"
                  required
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black transition-colors"
                />
              </div>
              </div>
            </div>
          </Card>

          {/* Descriptions Card */}
          <Card className="p-8">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-black font-['Playfair_Display']">
                Project Description
              </h2>
              <div className="h-px bg-neutral-200"></div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                  Short Description *
                </label>
                <textarea
                  name="description"
                  rows={3}
                  required
                  placeholder="Brief project description for listings..."
                  className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                  Full Description *
                </label>
                <textarea
                  name="fullDescription"
                  rows={6}
                  required
                  placeholder="Detailed project description for the project page..."
                  className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black transition-colors resize-none"
                />
              </div>

              <div className="flex items-center space-x-3 p-4 bg-neutral-50 rounded-lg">
                <input
                  name="featured"
                  type="checkbox"
                  value="true"
                  className="w-5 h-5 text-black border-2 border-neutral-300 rounded focus:ring-black focus:ring-2"
                  id="featured"
                />
                <div>
                  <label htmlFor="featured" className="font-semibold text-black cursor-pointer">
                    Featured Project
                  </label>
                  <p className="text-sm text-neutral-600">Show this project prominently on the homepage.</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Images Management Card */}
          <Card className="p-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-black font-['Playfair_Display']">
                  Project Images
                </h2>
                <Button type="button" onClick={addImage} variant="secondary" size="small">
                  <i className="fas fa-plus mr-2"></i>
                  Add Image
                </Button>
              </div>
              <div className="h-px bg-neutral-200"></div>
              
              <div className="space-y-4">
                {images.map((image, index) => (
                  <div key={index} className="p-4 border-2 border-neutral-200 rounded-lg bg-neutral-50">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-semibold text-sm text-neutral-700">
                        Image {index + 1} {index === 0 && '(Thumbnail)'}
                      </span>
                      {images.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          <i className="fas fa-trash mr-1"></i>
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                          Image URL *
                        </label>
                        <input
                          type="url"
                          value={image.url}
                          onChange={(e) => updateImage(index, 'url', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-neutral-300 rounded-lg focus:outline-none focus:border-black transition-colors"
                          placeholder="https://example.com/image.jpg"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                          Alt Text
                        </label>
                        <input
                          type="text"
                          value={image.alt}
                          onChange={(e) => updateImage(index, 'alt', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-neutral-300 rounded-lg focus:outline-none focus:border-black transition-colors"
                          placeholder="Image description"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                          Caption
                        </label>
                        <input
                          type="text"
                          value={image.caption}
                          onChange={(e) => updateImage(index, 'caption', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-neutral-300 rounded-lg focus:outline-none focus:border-black transition-colors"
                          placeholder="Optional caption"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {images.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-neutral-300 rounded-lg">
                    <i className="fas fa-images text-neutral-400 text-3xl mb-4"></i>
                    <p className="text-neutral-600">No images added yet</p>
                    <p className="text-sm text-neutral-500 mb-4">Click "Add Image" to get started</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Tags Management Card */}
          <Card className="p-8">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-black font-['Playfair_Display']">
                  Technologies & Tags
                </h2>
                <Button type="button" onClick={addTag} variant="secondary" size="small">
                  <i className="fas fa-plus mr-2"></i>
                  Add Tag
                </Button>
              </div>
              <div className="h-px bg-neutral-200"></div>
              
              <div className="space-y-4">
                {tags.map((tag, index) => (
                  <div key={index} className="p-4 border-2 border-neutral-200 rounded-lg bg-neutral-50">
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-semibold text-sm text-neutral-700">
                        Tag {index + 1}
                      </span>
                      {tags.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTag(index)}
                          className="text-red-600 hover:text-red-800 text-sm"
                        >
                          <i className="fas fa-trash mr-1"></i>
                          Remove
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                          Tag Name *
                        </label>
                        <input
                          type="text"
                          value={tag.name}
                          onChange={(e) => updateTag(index, 'name', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-neutral-300 rounded-lg focus:outline-none focus:border-black transition-colors"
                          placeholder="React, Node.js, etc."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                          Category
                        </label>
                        <select
                          value={tag.category}
                          onChange={(e) => updateTag(index, 'category', e.target.value)}
                          className="w-full px-4 py-3 border-2 border-neutral-300 rounded-lg focus:outline-none focus:border-black transition-colors"
                        >
                          <option value="">Select category</option>
                          <option value="frontend">Frontend</option>
                          <option value="backend">Backend</option>
                          <option value="database">Database</option>
                          <option value="tool">Tool</option>
                          <option value="framework">Framework</option>
                          <option value="library">Library</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
                
                {tags.length === 0 && (
                  <div className="text-center py-12 border-2 border-dashed border-neutral-300 rounded-lg">
                    <i className="fas fa-tags text-neutral-400 text-3xl mb-4"></i>
                    <p className="text-neutral-600">No tags added yet</p>
                    <p className="text-sm text-neutral-500 mb-4">Click "Add Tag" to get started</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* Action Buttons Card */}
          <Card className="p-8">
            <div className="flex flex-col sm:flex-row sm:justify-end sm:items-center gap-4">
              <Button href="/admin/projects" variant="ghost">
                <i className="fas fa-times mr-2"></i>
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                disabled={saving}
                className="min-w-[160px]"
              >
                {saving ? (
                  <>
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    Creating...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plus mr-2"></i>
                    Create Project
                  </>
                )}
              </Button>
            </div>
          </Card>

        </form>
      </div>
      
    </AdminPageWrapper>
  );
}
