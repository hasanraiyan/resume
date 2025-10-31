/**
 * @fileoverview Contributor management actions for handling contributor CRUD operations and data processing.
 * Provides server-side functions for creating, updating, deleting, and retrieving contributors with serialization support.
 */

'use server';

import dbConnect from '@/lib/dbConnect';
import Contributor from '@/models/Contributor';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

/**
 * Creates a new contributor in the database with the provided form data.
 * Handles database connection, contributor creation, cache revalidation, and redirects to contributors admin page.
 *
 * @param {FormData} formData - Form data containing contributor information including name, avatar, bio, socialLinks
 * @returns {Object} Error object if creation fails, otherwise redirects to admin contributors page
 */
export async function createContributor(formData) {
  await dbConnect();

  try {
    const contributorData = {
      name: formData.get('name'),
      avatar: formData.get('avatar'),
      bio: formData.get('bio'),
      socialLinks: {
        portfolio: formData.get('portfolio'),
        linkedin: formData.get('linkedin'),
        github: formData.get('github'),
        twitter: formData.get('twitter'),
        dribbble: formData.get('dribbble'),
        behance: formData.get('behance'),
        instagram: formData.get('instagram'),
        youtube: formData.get('youtube'),
      },
    };

    const newContributor = new Contributor(contributorData);
    await newContributor.save();

    revalidatePath('/admin/contributors');
  } catch (error) {
    console.error('Create Contributor Error:', error);
    return {
      success: false,
      message:
        error.code === 11000
          ? 'Contributor with this name already exists.'
          : 'Failed to create contributor.',
    };
  }

  redirect('/admin/contributors');
}

/**
 * Updates an existing contributor in the database with the provided form data.
 * Handles database connection, contributor update, cache revalidation, and returns appropriate response.
 * Does not redirect to allow success message to show on edit page.
 *
 * @param {string} id - The MongoDB ObjectId of the contributor to update
 * @param {FormData} formData - Form data containing updated contributor information
 * @returns {Object} Success or error object with message
 */
export async function updateContributor(id, formData) {
  await dbConnect();

  try {
    const contributorData = {
      name: formData.get('name'),
      avatar: formData.get('avatar'),
      bio: formData.get('bio'),
      socialLinks: {
        portfolio: formData.get('portfolio'),
        linkedin: formData.get('linkedin'),
        github: formData.get('github'),
        twitter: formData.get('twitter'),
        dribbble: formData.get('dribbble'),
        behance: formData.get('behance'),
        instagram: formData.get('instagram'),
        youtube: formData.get('youtube'),
      },
    };

    const updatedContributor = await Contributor.findByIdAndUpdate(id, contributorData, {
      new: true,
      runValidators: true,
    });

    if (!updatedContributor) {
      return { success: false, message: 'Contributor not found.' };
    }

    revalidatePath('/admin/contributors');
    revalidatePath(`/admin/contributors/${id}/edit`);
  } catch (error) {
    console.error('Update Contributor Error:', error);
    return {
      success: false,
      message:
        error.code === 11000
          ? 'Contributor with this name already exists.'
          : 'Failed to update contributor.',
    };
  }

  // No redirect here to allow success message to show on edit page
}

/**
 * Deletes a contributor from the database by its ID.
 * Handles database connection, contributor deletion, cache revalidation, and redirects to contributors admin page.
 *
 * @param {string} id - The MongoDB ObjectId of the contributor to delete
 * @returns {Object} Error object if deletion fails, otherwise redirects to admin contributors page
 */
export async function deleteContributor(id) {
  await dbConnect();
  try {
    const deletedContributor = await Contributor.findByIdAndDelete(id);
    if (!deletedContributor) {
      return { success: false, message: 'Contributor not found.' };
    }
    revalidatePath('/admin/contributors');
  } catch (error) {
    console.error('Delete Contributor Error:', error);
    return { success: false, message: 'Failed to delete contributor.' };
  }
  redirect('/admin/contributors');
}

/**
 * Retrieves all contributors from the database, sorted by creation date in descending order.
 * Used primarily in admin interfaces for listing and managing all contributors.
 *
 * @returns {Object} Object containing success status and array of contributors, or error object
 */
export async function getAllContributors() {
  await dbConnect();

  try {
    const contributors = await Contributor.find({}).sort({ createdAt: -1 }).lean();
    return { success: true, contributors };
  } catch (error) {
    console.error('Get Contributors Error:', error);
    return { success: false, contributors: [] };
  }
}

/**
 * Retrieves a single contributor from the database by its ID.
 * Used for displaying individual contributor edit pages.
 *
 * @param {string} id - The MongoDB ObjectId of the contributor
 * @returns {Object} Object containing success status and contributor data, or error object with null contributor
 */
export async function getContributorById(id) {
  await dbConnect();

  try {
    const contributor = await Contributor.findById(id).lean();
    if (!contributor) {
      return { success: false, contributor: null };
    }
    return { success: true, contributor };
  } catch (error) {
    console.error('Get Contributor Error:', error);
    return { success: false, contributor: null };
  }
}
