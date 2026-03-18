/**
 * @fileoverview Technology management actions for handling technology CRUD operations.
 * Provides server-side functions for creating, updating, deleting, and retrieving technologies.
 */

'use server';

import dbConnect from '@/lib/dbConnect';
import Technology from '@/models/Technology';
import { revalidatePath } from 'next/cache';
import { serializeForClient } from '@/lib/serialize';
import { verifyAdminAction } from '@/lib/auth/admin';

/**
 * Retrieves all technologies from the database, sorted by display order.
 * @returns {Array} Array of serialized technology objects
 */
export async function getAllTechnologies() {
  try {
    await dbConnect();
    const technologies = await Technology.find({}).sort({ displayOrder: 1 }).lean();
    return serializeForClient(technologies);
  } catch (error) {
    console.error('Error fetching technologies:', error);
    throw new Error('Failed to fetch technologies');
  }
}

/**
 * Creates a new technology in the database with the provided form data.
 * @param {FormData} formData - Form data containing technology information
 * @returns {Object} Success message or error
 */
export async function createTechnology(formData) {
  try {
    await verifyAdminAction();
    await dbConnect();

    const technologyData = Object.fromEntries(formData.entries());
    console.log('🔍 [CREATE TECHNOLOGY] Form data received:', technologyData);

    const technology = new Technology(technologyData);
    await technology.save();

    revalidatePath('/admin/technologies');
    revalidatePath('/');

    return { success: true, message: 'Technology created successfully' };
  } catch (error) {
    console.error('Error creating technology:', error);
    return { success: false, message: 'Failed to create technology' };
  }
}

/**
 * Updates an existing technology in the database.
 * @param {string} id - Technology ID to update
 * @param {FormData} formData - Updated form data
 * @returns {Object} Success message or error
 */
export async function updateTechnology(id, formData) {
  try {
    await verifyAdminAction();
    await dbConnect();

    const technologyData = Object.fromEntries(formData.entries());
    console.log('🔍 [UPDATE TECHNOLOGY] Updating technology:', id, technologyData);

    await Technology.findByIdAndUpdate(id, technologyData);

    revalidatePath('/admin/technologies');
    revalidatePath('/');

    return { success: true, message: 'Technology updated successfully' };
  } catch (error) {
    console.error('Error updating technology:', error);
    return { success: false, message: 'Failed to update technology' };
  }
}

/**
 * Deletes a technology from the database.
 * @param {string} id - Technology ID to delete
 * @returns {Object} Success message or error
 */
export async function deleteTechnology(id) {
  try {
    await verifyAdminAction();
    await dbConnect();

    console.log('🗑️ [DELETE TECHNOLOGY] Deleting technology:', id);
    await Technology.findByIdAndDelete(id);

    revalidatePath('/admin/technologies');
    revalidatePath('/');

    return { success: true, message: 'Technology deleted successfully' };
  } catch (error) {
    console.error('Error deleting technology:', error);
    return { success: false, message: 'Failed to delete technology' };
  }
}

/**
 * Retrieves a single technology by ID.
 * @param {string} id - Technology ID
 * @returns {Object} Serialized technology object or null
 */
export async function getTechnologyById(id) {
  try {
    await verifyAdminAction();
    await dbConnect();
    const technology = await Technology.findById(id);
    return technology ? serializeForClient(technology) : null;
  } catch (error) {
    console.error('Error fetching technology:', error);
    return null;
  }
}
