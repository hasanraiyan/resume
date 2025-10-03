'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { updateProject, deleteProject } from '@/app/actions/projectActions';
import ProjectForm from '@/components/admin/ProjectForm';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';

export default function EditProjectPage({ params }) {
  const router = useRouter();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!params.id) return;
    
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/projects/${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch project data.');
        }
        const data = await response.json();
        setProject(data.project);
      } catch (err) {
        setError(err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [params.id]);

  if (loading) {
    return (
      <AdminPageWrapper title="Edit Project">
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-black border-t-transparent mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading project...</p>
        </div>
      </AdminPageWrapper>
    );
  }

  if (error || !project) {
    return (
      <AdminPageWrapper title="Error">
        <div className="text-center py-20">
          <h3 className="text-xl font-semibold text-black mb-2">Could not load project</h3>
          <p className="text-neutral-600 mb-8">{error || 'The project may have been deleted.'}</p>
        </div>
      </AdminPageWrapper>
    );
  }

  return (
    <ProjectForm 
      initialData={project}
      onSave={updateProject}
      onDelete={deleteProject}
      isEditing={true}
    />
  );
}