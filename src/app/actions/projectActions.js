// src/app/actions/projectActions.js
'use server';

import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { serializeProject, serializeProjects } from '@/lib/serialize';

function processFormData(formData) {
  return {
    title: formData.get('title'),
    slug: formData.get('slug'),
    featured: formData.get('featured') === 'true',
    projectNumber: formData.get('projectNumber'),
    category: formData.get('category'),
    tagline: formData.get('tagline'),
    description: formData.get('description'),
    fullDescription: formData.get('fullDescription'),
    thumbnail: formData.get('thumbnail'),
    // Parse the JSON string fields
    images: JSON.parse(formData.get('images') || '[]'),
    tags: JSON.parse(formData.get('tags') || '[]'),
    links: JSON.parse(formData.get('links') || '{}'),
    details: JSON.parse(formData.get('details') || '{}'),
  };
}

export async function createProject(formData) {
  await dbConnect();

  try {
    const projectData = processFormData(formData);
    const newProject = new Project(projectData);
    await newProject.save();

    revalidatePath('/projects');
    revalidatePath('/admin/projects');
    revalidatePath('/');
  } catch (error) {
    console.error('Create Project Error:', error);
    return {
      success: false,
      message: error.code === 11000 ? 'Slug already exists.' : 'Failed to create project.',
    };
  }

  redirect('/admin/projects');
}

export async function updateProject(id, formData) {
  await dbConnect();

  try {
    const projectData = processFormData(formData);
    const updatedProject = await Project.findByIdAndUpdate(id, projectData, {
      new: true,
      runValidators: true,
    });

    if (!updatedProject) {
      return { success: false, message: 'Project not found.' };
    }

    revalidatePath('/projects');
    revalidatePath(`/projects/${updatedProject.slug}`);
    revalidatePath('/admin/projects');
    revalidatePath('/');
  } catch (error) {
    console.error('Update Project Error:', error);
    return {
      success: false,
      message: error.code === 11000 ? 'Slug already exists.' : 'Failed to update project.',
    };
  }

  // No redirect here to allow success message to show on edit page
}

export async function deleteProject(id) {
  await dbConnect();
  try {
    const deletedProject = await Project.findByIdAndDelete(id);
    if (!deletedProject) {
      return { success: false, message: 'Project not found.' };
    }
    revalidatePath('/projects');
    revalidatePath('/admin/projects');
    revalidatePath('/');
  } catch (error) {
    console.error('Delete Project Error:', error);
    return { success: false, message: 'Failed to delete project.' };
  }
  redirect('/admin/projects');
}

export async function getAllProjects() {
  await dbConnect();

  try {
    const projects = await Project.find({}).sort({ createdAt: -1 }).lean();
    const serializedProjects = serializeProjects(projects);
    return { success: true, projects: serializedProjects };
  } catch (error) {
    console.error('Get Projects Error:', error);
    return { success: false, projects: [] };
  }
}

export async function getProjectBySlug(slug) {
  await dbConnect();

  try {
    const project = await Project.findOne({ slug }).lean();
    if (!project) {
      return { success: false, project: null };
    }
    const serializedProject = serializeProject(project);
    return { success: true, project: serializedProject };
  } catch (error) {
    console.error('Get Project Error:', error);
    return { success: false, project: null };
  }
}

export async function getFeaturedProjects() {
  await dbConnect();

  try {
    const projects = await Project.find({ featured: true }).sort({ createdAt: -1 }).lean();
    const serializedProjects = serializeProjects(projects);
    return { success: true, projects: serializedProjects };
  } catch (error) {
    console.error('Get Featured Projects Error:', error);
    return { success: false, projects: [] };
  }
}
