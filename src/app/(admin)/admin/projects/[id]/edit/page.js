'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateProject } from '@/app/actions/projectActions';
import { Input, Button, Card } from '@/components/ui';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import CustomDropdownMinimal from '@/components/CustomDropdown';

export default function EditProjectPage({ params }) {
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [projectId, setProjectId] = useState(null);
  const [images, setImages] = useState([]);
  const [tags, setTags] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const categoryOptions = [
    { value: 'Web Development', label: 'Web Development' },
    { value: 'Mobile App', label: 'Mobile App' },
    { value: 'UI/UX Design', label: 'UI/UX Design' },
    { value: 'Branding', label: 'Branding' },
    { value: 'E-commerce', label: 'E-commerce' }
  ];

  // Handle params (which might be a Promise in Next.js 15)
  useEffect(() => {
    const getParams = async () => {
      try {
        const resolvedParams = await Promise.resolve(params);
        if (resolvedParams && resolvedParams.id) {
          setProjectId(resolvedParams.id);
        }
      } catch (error) {
        console.error('Error resolving params:', error);
        router.push('/admin/projects');
      }
    };
    getParams();
  }, [params, router]);

  useEffect(() => {
    if (!projectId) return;
    
    const fetchProject = async () => {
      try {
        console.log('Fetching project with ID:', projectId);
        const response = await fetch(`/api/projects/${projectId}`);
        console.log('Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Project data:', data);
          const projectData = data.project;
          setProject(projectData);
          setSelectedCategory(projectData?.category || '');
          setImages(projectData?.images || [{ url: '', alt: '', caption: '' }]);
          setTags(projectData?.tags || [{ name: '', category: '' }]);
        } else {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          setMessage({ type: 'error', text: 'Failed to load project data' });
        }
      } catch (error) {
        console.error('Error fetching project:', error);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  // Image management functions
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

  // Tag management functions
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

  // Handle form submission
  const handleSubmit = async (formData) => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    try {
      // Add images and tags as JSON strings
      formData.append('images', JSON.stringify(images.filter(img => img.url)));
      formData.append('tags', JSON.stringify(tags.filter(tag => tag.name)));
      
      await updateProject(projectId, formData);
      setMessage({ type: 'success', text: 'Project updated successfully!' });
      
      // Scroll to top to show message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Error updating project:', error);
      setMessage({ type: 'error', text: 'Failed to update project. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminPageWrapper title="Edit Project" description="Loading project data...">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-black border-t-transparent mx-auto"></div>
            <p className="mt-4 text-neutral-600">Loading project...</p>
          </div>
        </div>
      </AdminPageWrapper>
    );
  }

  if (!project) {
    return (
      <AdminPageWrapper title="Project Not Found">
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-exclamation-triangle text-neutral-400 text-2xl"></i>
          </div>
          <h3 className="text-xl font-semibold text-black mb-2">Project not found</h3>
          <p className="text-neutral-600 mb-8">The project you're looking for doesn't exist or may have been deleted.</p>
          <Button href="/admin/projects" variant="primary">
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Projects
          </Button>
        </div>
      </AdminPageWrapper>
    );
  }

  return (
    <AdminPageWrapper
      title="Edit Project"
      description={`Editing "${project.title}" - Update your project information and settings.`}
      actionButton={
        <Button href="/admin/projects" variant="ghost">
          <i className="fas fa-arrow-left mr-2"></i>
          Back to Projects
        </Button>
      }
    >
      {/* Success/Error Messages */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg border-l-4 ${
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
                  Required fields marked with *
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
                  defaultValue={project.title}
                  className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                  URL Slug *
                </label>
                <input
                  name="slug"
                  type="text"
                  required
                  defaultValue={project.slug}
                  className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">
                  Project Number *
                </label>
                <input
                  name="projectNumber"
                  type="text"
                  required
                  defaultValue={project.projectNumber}
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
                  defaultValue={project.tagline}
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
                  defaultValue={project.thumbnail}
                  className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black transition-colors"
                />
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
                  defaultValue={project.description}
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
                  defaultValue={project.fullDescription}
                  className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black transition-colors resize-none"
                />
              </div>

              <div className="flex items-center space-x-3 p-4 bg-neutral-50 rounded-lg">
                <input
                  name="featured"
                  type="checkbox"
                  value="true"
                  defaultChecked={project.featured}
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
                        Image {index + 1}
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
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
              <Button 
                type="button"
                variant="ghost"
                className="text-red-600 hover:text-red-800 hover:bg-red-50 order-2 sm:order-1"
                onClick={() => setShowDeleteModal(true)}
              >
                <i className="fas fa-trash mr-2"></i>
                Delete Project
              </Button>
              
              <div className="flex flex-col sm:flex-row gap-3 order-1 sm:order-2">
                <Button href="/admin/projects" variant="ghost">
                  <i className="fas fa-times mr-2"></i>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={saving}
                  className="min-w-[140px]"
                >
                  {saving ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Saving...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save mr-2"></i>
                      Update Project
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>

        </form>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <i className="fas fa-trash text-red-600"></i>
              </div>
              <h3 className="text-lg font-semibold text-black">Delete Project</h3>
            </div>
            <p className="text-neutral-600 mb-6">
              Are you sure you want to delete "{project.title}"? This action cannot be undone and will permanently remove all project data.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                onClick={() => setShowDeleteModal(false)}
                variant="ghost"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  // TODO: Implement delete functionality
                  console.log('Delete project:', projectId);
                  setShowDeleteModal(false);
                }}
                className="flex-1 bg-red-600 text-white hover:bg-red-700"
              >
                <i className="fas fa-trash mr-2"></i>
                Delete Project
              </Button>
            </div>
          </div>
        </div>
      )}
      
    </AdminPageWrapper>
  );
}
