'use client';

import { createProject } from '@/app/actions/projectActions';
import ProjectForm from '@/components/admin/ProjectForm';

export default function NewProjectPage() {
  return (
    <ProjectForm 
      onSave={createProject} 
      isEditing={false} 
    />
  );
}