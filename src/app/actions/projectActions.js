/**
 * @fileoverview Project management actions for handling project CRUD operations and data processing.
 * Provides server-side functions for creating, updating, deleting, and retrieving projects with serialization support.
 */

'use server';

import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { serializeProject, serializeProjects } from '@/lib/serialize';

/**
 * Processes form data from project creation/update forms into a structured object.
 * Handles JSON parsing for complex fields like images, tags, links, and details.
 *
 * @param {FormData} formData - The form data object containing project fields
 * @returns {Object} Processed project data object with all required fields
 */
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
    isForSale: formData.get('isForSale') === 'true',
    // Parse the JSON string fields
    images: JSON.parse(formData.get('images') || '[]'),
    tags: JSON.parse(formData.get('tags') || '[]'),
    contributors: JSON.parse(formData.get('contributors') || '[]'),
    links: JSON.parse(formData.get('links') || '{}'),
    details: JSON.parse(formData.get('details') || '{}'),
  };
}

/**
 * Creates a new project in the database with the provided form data.
 * Handles database connection, project creation, cache revalidation, and redirects to projects admin page.
 *
 * @param {FormData} formData - Form data containing project information including title, slug, images, tags, etc.
 * @returns {Object} Error object if creation fails, otherwise redirects to admin projects page
 */
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

/**
 * Updates an existing project in the database with the provided form data.
 * Handles database connection, project update, cache revalidation, and returns appropriate response.
 * Does not redirect to allow success message to show on edit page.
 *
 * @param {string} id - The MongoDB ObjectId of the project to update
 * @param {FormData} formData - Form data containing updated project information
 * @returns {Object} Success or error object with message
 */
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

/**
 * Deletes a project from the database by its ID.
 * Handles database connection, project deletion, cache revalidation, and redirects to projects admin page.
 *
 * @param {string} id - The MongoDB ObjectId of the project to delete
 * @returns {Object} Error object if deletion fails, otherwise redirects to admin projects page
 */
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

/**
 * Retrieves all projects from the database, sorted by creation date in descending order.
 * Used primarily in admin interfaces for listing and managing all projects.
 * Serializes project data for client-side compatibility.
 *
 * @returns {Object} Object containing success status and array of serialized projects, or error object
 */
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

/**
 * Retrieves a single project from the database by its slug.
 * Used for displaying individual project pages and project detail views.
 * Serializes project data for client-side compatibility.
 *
 * @param {string} slug - The unique slug identifier for the project
 * @returns {Object} Object containing success status and serialized project data, or error object with null project
 */
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

/**
 * Retrieves all featured projects from the database, sorted by creation date in descending order.
 * Used for displaying featured projects on homepage, portfolio sections, or other promotional areas.
 * Serializes project data for client-side compatibility.
 *
 * @returns {Object} Object containing success status and array of serialized featured projects, or error object
 */
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
