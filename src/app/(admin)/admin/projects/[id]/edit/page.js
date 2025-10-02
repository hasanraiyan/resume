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
  const [selectedCategory, setSelectedCategory] = useState('');
  const [projectId, setProjectId] = useState(null);

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
      const resolvedParams = await params;
      setProjectId(resolvedParams.id);
    };
    getParams();
  }, [params]);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        console.log('Fetching project with ID:', projectId);
        const response = await fetch(`/api/projects/${projectId}`);
        console.log('Response status:', response.status);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Project data:', data);
          setProject(data.project);
          setSelectedCategory(data.project?.category || '');
        } else {
          const errorData = await response.json();
          console.error('API Error:', errorData);
          console.log('Sample projects available:', errorData.sampleProjects);
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
      <Card className="max-w-4xl mx-auto">
        <form action={async (formData) => {
          await updateProject(projectId, formData);
        }} className="space-y-8 p-8">
          
          {/* Basic Information */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-black font-['Playfair_Display'] border-b-2 border-neutral-200 pb-4">
              Basic Information
            </h2>
            
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
          </div>

          {/* Descriptions */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-black font-['Playfair_Display'] border-b-2 border-neutral-200 pb-4">
              Project Description
            </h2>

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

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-6 border-t-2 border-neutral-200">
            <Button 
              type="button"
              variant="ghost"
              className="text-red-600 hover:text-red-800 hover:bg-red-50"
              onClick={() => {
                if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
                  // TODO: Add delete functionality
                  console.log('Delete project:', projectId);
                }
              }}
            >
              <i className="fas fa-trash mr-2"></i>
              Delete Project
            </Button>
            
            <div className="flex space-x-4">
              <Button href="/admin/projects" variant="ghost">
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                <i className="fas fa-save mr-2"></i>
                Update Project
              </Button>
            </div>
          </div>

        </form>
      </Card>
      
    </AdminPageWrapper>
  );
}
