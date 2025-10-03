// src/app/actions/projectActions.js
'use server';

import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createProject(formData) {
  await dbConnect();

  try {
    const projectData = {
      title: formData.get('title'),
      slug: formData.get('slug'),
      featured: formData.get('featured') === 'true',
      projectNumber: formData.get('projectNumber'),
      category: formData.get('category'),
      tagline: formData.get('tagline'),
      description: formData.get('description'),
      fullDescription: formData.get('fullDescription'),
      thumbnail: formData.get('thumbnail'),
      // Parse JSON fields if they exist
      images: formData.get('images') ? JSON.parse(formData.get('images')) : [],
      tags: formData.get('tags') ? JSON.parse(formData.get('tags')) : [],
    };
    
    const newProject = new Project(projectData);
    await newProject.save();

    // Refresh pages that show project data
    revalidatePath('/projects');
    revalidatePath('/admin/projects');
    revalidatePath('/');

  } catch (error) {
    // Handle errors, e.g., validation or duplicate slug
    console.error('Create Project Error:', error);
    return { 
      success: false, 
      message: error.code === 11000 ? 'Project with this slug already exists.' : 'Failed to create project.' 
    };
  }
  
  // Redirect to the admin project list after success
  redirect('/admin/projects');
}

export async function updateProject(id, formData) {
  await dbConnect();

  try {
    const projectData = {
      title: formData.get('title'),
      slug: formData.get('slug'),
      featured: formData.get('featured') === 'true',
      projectNumber: formData.get('projectNumber'),
      category: formData.get('category'),
      tagline: formData.get('tagline'),
      description: formData.get('description'),
      fullDescription: formData.get('fullDescription'),
      thumbnail: formData.get('thumbnail'),
      images: formData.get('images') ? JSON.parse(formData.get('images')) : [],
      tags: formData.get('tags') ? JSON.parse(formData.get('tags')) : [],
    };
    
    const updatedProject = await Project.findByIdAndUpdate(
      id, 
      projectData, 
      { new: true, runValidators: true }
    );

    if (!updatedProject) {
      return { success: false, message: 'Project not found.' };
    }

    // Refresh pages that show project data
    revalidatePath('/projects');
    revalidatePath(`/projects/${updatedProject.slug}`);
    revalidatePath('/admin/projects');
    revalidatePath('/');

  } catch (error) {
    console.error('Update Project Error:', error);
    return { 
      success: false, 
      message: error.code === 11000 ? 'Project with this slug already exists.' : 'Failed to update project.' 
    };
  }
  
  redirect('/admin/projects');
}

export async function deleteProject(id) {
  await dbConnect();

  try {
    const deletedProject = await Project.findByIdAndDelete(id);
    
    if (!deletedProject) {
      return { success: false, message: 'Project not found.' };
    }

    // Refresh pages that show project data
    revalidatePath('/projects');
    revalidatePath('/admin/projects');
    revalidatePath('/');

  } catch (error) {
    console.error('Delete Project Error:', error);
    return { success: false, message: 'Failed to delete project.' };
  }

  // Redirect to projects list after successful deletion
  redirect('/admin/projects');
}

export async function getAllProjects() {
  await dbConnect();

  try {
    const projects = await Project.find({}).sort({ createdAt: -1 }).lean();
    return { success: true, projects };
  } catch (error) {
    console.error('Get Projects Error:', error);
    return { success: false, projects: [] };
  }
}

export async function getProjectBySlug(slug) {
  await dbConnect();

  try {
    const project = await Project.findOne({ slug }).lean();
    return { success: true, project };
  } catch (error) {
    console.error('Get Project Error:', error);
    return { success: false, project: null };
  }
}

export async function getFeaturedProjects() {
  await dbConnect();

  try {
    const projects = await Project.find({ featured: true }).sort({ createdAt: -1 }).lean();
    return { success: true, projects };
  } catch (error) {
    console.error('Get Featured Projects Error:', error);
    return { success: false, projects: [] };
  }
}
