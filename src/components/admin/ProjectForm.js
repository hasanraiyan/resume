'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui';
import ActionButton from './ActionButton';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import CustomDropdownMinimal from '@/components/CustomDropdown';
import ProjectPreviewCard from './ProjectPreviewCard';
import ImageManager from './ImageManager';
import TagManager from './TagManager';
import FormSection from './FormSection';
import ResultsManager from './ResultsManager'; // <-- IMPORT THE NEW COMPONENT

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
  images: [],
  tags: [],
  links: { live: '', github: '', figma: '' },
  details: { client: '', year: '', duration: '', role: '', challenge: '', solution: '', results: [] }
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
      const data = {
        ...defaultProject,
        ...initialData,
        images: initialData.images?.length > 0 ? initialData.images : [{ url: '', alt: '', caption: '' }],
        tags: initialData.tags?.length > 0 ? initialData.tags : [{ name: '', category: '' }],
        links: { ...defaultProject.links, ...initialData.links },
        details: { ...defaultProject.details, ...initialData.details },
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
    return title.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const [section, field] = name.split('.');

    if (field) { // Handle nested state (links, details)
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      const newValue = type === 'checkbox' ? checked : value;
      setFormData(prev => {
        const newFormData = { ...prev, [name]: newValue };
        if (name === 'title' && autoGenerateSlug) {
          newFormData.slug = generateSlug(newValue);
        }
        return newFormData;
      });
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    const submissionData = new FormData();
    // Convert nested objects to JSON strings for the server action
    submissionData.append('images', JSON.stringify(formData.images.filter(img => img.url.trim() !== '')));
    submissionData.append('tags', JSON.stringify(formData.tags.filter(tag => tag.name.trim() !== '')));
    submissionData.append('links', JSON.stringify(formData.links));
    submissionData.append('details', JSON.stringify(formData.details));

    // Append top-level fields
    for (const key in formData) {
      if (!['images', 'tags', 'links', 'details'].includes(key)) {
        submissionData.append(key, formData[key]);
      }
    }
    
    try {
      if (isEditing) {
        await onSave(initialData._id, submissionData);
      } else {
        await onSave(submissionData);
      }
      setMessage({ type: 'success', text: `Project ${isEditing ? 'updated' : 'created'} successfully!` });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      console.error('Failed to save project:', error);
      setMessage({ type: 'error', text: 'An error occurred while saving.' });
    } finally {
      setSaving(false);
    }
  };
  
  const handleDelete = async () => {
    if (!isEditing || !onDelete) return;
    setDeleting(true);
    try {
      await onDelete(initialData._id);
    } catch (error) {
      console.error('Error deleting project:', error);
      setMessage({ type: 'error', text: 'Failed to delete project.' });
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <AdminPageWrapper title={isEditing ? 'Edit Project' : 'Create New Project'} description={isEditing ? `Editing "${initialData?.title}"` : 'Add a new project to your portfolio.'}>
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg border-l-4 ${message.type === 'success' ? 'bg-green-50 border-green-400 text-green-800' : 'bg-red-50 border-red-400 text-red-800'}`}>
          {message.text}
        </div>
      )}
      
      <form onSubmit={handleFormSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          <div className="lg:col-span-2 space-y-8">
            {/* --- BASIC INFO --- */}
            <FormSection title="Basic Information" description="Core details for your project.">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2"><label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">Project Title *</label><input name="title" type="text" required value={formData.title} onChange={handleChange} className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black" /></div>
                <div><label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">URL Slug *</label><input name="slug" type="text" required value={formData.slug} onChange={handleChange} readOnly={autoGenerateSlug} className={`w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black ${autoGenerateSlug ? 'bg-neutral-100' : ''}`} /><label className="flex items-center text-xs text-neutral-600 mt-2"><input type="checkbox" checked={autoGenerateSlug} onChange={(e) => setAutoGenerateSlug(e.target.checked)} className="mr-1 w-3 h-3"/>Auto-generate</label></div>
                <div><label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">Project Number *</label><input name="projectNumber" type="text" required value={formData.projectNumber} onChange={handleChange} className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black" /></div>
                <div className="md:col-span-2"><CustomDropdownMinimal label="CATEGORY *" options={categoryOptions} value={formData.category} onChange={handleChange} name="category" /></div>
              </div>
            </FormSection>

            {/* --- CONTENT --- */}
            <FormSection title="Content & Case Study" description="Provide the text content for the project listing and the detailed page.">
                <div className="space-y-6">
                    <div><label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">Tagline *</label><input name="tagline" type="text" required value={formData.tagline} onChange={handleChange} className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black" /></div>
                    <div><label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">Short Description *</label><textarea name="description" rows={3} required value={formData.description} onChange={handleChange} className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black resize-y" /></div>
                    <div><label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">Full Description *</label><textarea name="fullDescription" rows={6} required value={formData.fullDescription} onChange={handleChange} className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black resize-y" /></div>
                    <div><label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">The Challenge</label><textarea name="details.challenge" rows={3} value={formData.details.challenge} onChange={handleChange} className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black resize-y" /></div>
                    <div><label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">The Solution</label><textarea name="details.solution" rows={3} value={formData.details.solution} onChange={handleChange} className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black resize-y" /></div>
                </div>
            </FormSection>
            
            {/* --- MEDIA & TAGS --- */}
            <FormSection title="Project Media & Tech" description="Manage gallery images, tech tags, and external links.">
              <div className="space-y-6">
                <div><label className="block text-sm font-semibold text-black mb-2 uppercase tracking-wider">Thumbnail Image URL *</label><input name="thumbnail" type="url" required value={formData.thumbnail} onChange={handleChange} className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg focus:outline-none focus:border-black" /></div>
                <div><h4 className="text-md font-semibold text-black mb-2">Gallery Images</h4><ImageManager images={formData.images} setImages={(newImages) => setFormData(p => ({ ...p, images: newImages }))} /></div>
                <div><h4 className="text-md font-semibold text-black mb-2">Technologies & Tags</h4><TagManager tags={formData.tags} setTags={(newTags) => setFormData(p => ({ ...p, tags: newTags }))} /></div>
                <div>
                  <h4 className="text-md font-semibold text-black mb-2">Project Links</h4>
                  <div className="space-y-3">
                    <input name="links.live" type="url" placeholder="Live Site URL (e.g., https://...)" value={formData.links.live} onChange={handleChange} className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg" />
                    <input name="links.github" type="url" placeholder="GitHub Repo URL" value={formData.links.github} onChange={handleChange} className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg" />
                    <input name="links.figma" type="url" placeholder="Figma Design URL" value={formData.links.figma} onChange={handleChange} className="w-full px-4 py-3 border-2 border-neutral-200 rounded-lg" />
                  </div>
                </div>
              </div>
            </FormSection>
          </div>

          <div className="lg:col-span-1 space-y-8 lg:sticky lg:top-28">
            <FormSection title="Live Preview" noBorder>
              <ProjectPreviewCard project={formData} />
            </FormSection>
            
            {/* --- DETAILS & RESULTS --- */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-black font-['Playfair_Display'] mb-4">Sidebar Details</h3>
              <div className="space-y-4">
                <div><label className="text-sm font-medium">Client</label><input name="details.client" type="text" value={formData.details.client} onChange={handleChange} className="w-full px-3 py-2 border border-neutral-300 rounded-lg mt-1" /></div>
                <div><label className="text-sm font-medium">Year</label><input name="details.year" type="text" value={formData.details.year} onChange={handleChange} className="w-full px-3 py-2 border border-neutral-300 rounded-lg mt-1" /></div>
                <div><label className="text-sm font-medium">Duration</label><input name="details.duration" type="text" value={formData.details.duration} onChange={handleChange} className="w-full px-3 py-2 border border-neutral-300 rounded-lg mt-1" /></div>
                <div><label className="text-sm font-medium">Role</label><input name="details.role" type="text" value={formData.details.role} onChange={handleChange} className="w-full px-3 py-2 border border-neutral-300 rounded-lg mt-1" /></div>
              </div>
              <div className="h-px bg-neutral-200 my-6"></div>
              <h3 className="text-lg font-bold text-black font-['Playfair_Display'] mb-4">Results & Impact</h3>
              <ResultsManager results={formData.details.results} setResults={(newResults) => setFormData(p => ({ ...p, details: { ...p.details, results: newResults } }))} />
            </Card>

            {/* --- ACTIONS --- */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-black font-['Playfair_Display'] mb-4">Actions</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-neutral-50 rounded-lg"><input name="featured" type="checkbox" checked={formData.featured} onChange={handleChange} className="w-5 h-5 text-black border-2 border-neutral-300 rounded focus:ring-black" id="featured" /><div><label htmlFor="featured" className="font-semibold text-black cursor-pointer">Featured Project</label><p className="text-sm text-neutral-600">Show on homepage.</p></div></div>
                <ActionButton isSaving={saving} text={isEditing ? 'Update Project' : 'Create Project'} savingText="Saving..." className="w-full" />
                <ActionButton onClick={() => router.push('/admin/projects')} text="Cancel" variant="ghost" className="w-full" />
              </div>
              {isEditing && (<><div className="h-px bg-neutral-200 my-6"></div><ActionButton onClick={() => setShowDeleteModal(true)} text="Delete Project" variant="ghost" className="w-full text-red-600 hover:bg-red-50" /></>)}
            </Card>
          </div>
        </div>
      </form>

      {showDeleteModal && ( <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"> <div className="bg-white rounded-lg max-w-md w-full p-6"> <h3 className="text-lg font-semibold text-black">Delete Project</h3> <p className="text-neutral-600 my-4">Are you sure you want to delete this project? This action cannot be undone.</p> <div className="flex gap-3"> <ActionButton onClick={() => setShowDeleteModal(false)} text="Cancel" variant="ghost" className="flex-1" /> <ActionButton onClick={handleDelete} isSaving={deleting} text="Delete Project" savingText="Deleting..." className="flex-1 bg-red-600 text-white hover:bg-red-700" /> </div> </div> </div> )}
    </AdminPageWrapper>
  );
}