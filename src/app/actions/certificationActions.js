/**
 * @fileoverview Certification management actions for handling certification CRUD operations.
 * Provides server-side functions for creating, updating, deleting, and retrieving certifications.
 */

'use server';

import dbConnect from '@/lib/dbConnect';
import Certification from '@/models/Certification';
import { revalidatePath } from 'next/cache';
import { serializeForClient } from '@/lib/serialize';

/**
 * Retrieves all certifications from the database, sorted by display order.
 * @returns {Array} Array of serialized certification objects
 */
export async function getAllCertifications() {
  try {
    await dbConnect();
    const certifications = await Certification.find({}).sort({ displayOrder: 1 });
    return serializeForClient(certifications);
  } catch (error) {
    console.error('Error fetching certifications:', error);
    throw new Error('Failed to fetch certifications');
  }
}

/**
 * Creates a new certification in the database with the provided form data.
 * @param {FormData} formData - Form data containing certification information
 * @returns {Object} Success message or error
 */
export async function createCertification(formData) {
  try {
    await dbConnect();

    const certificationData = Object.fromEntries(formData.entries());
    console.log('🔍 [CREATE CERTIFICATION] Form data received:', certificationData);

    const certification = new Certification(certificationData);
    await certification.save();

    revalidatePath('/admin/certifications');
    revalidatePath('/');

    return { success: true, message: 'Certification created successfully' };
  } catch (error) {
    console.error('Error creating certification:', error);
    return { success: false, message: 'Failed to create certification' };
  }
}

/**
 * Updates an existing certification in the database.
 * @param {string} id - Certification ID to update
 * @param {FormData} formData - Updated form data
 * @returns {Object} Success message or error
 */
export async function updateCertification(id, formData) {
  try {
    await dbConnect();

    const certificationData = Object.fromEntries(formData.entries());
    console.log('🔍 [UPDATE CERTIFICATION] Updating certification:', id, certificationData);

    await Certification.findByIdAndUpdate(id, certificationData);

    revalidatePath('/admin/certifications');
    revalidatePath('/');

    return { success: true, message: 'Certification updated successfully' };
  } catch (error) {
    console.error('Error updating certification:', error);
    return { success: false, message: 'Failed to update certification' };
  }
}

/**
 * Deletes a certification from the database.
 * @param {string} id - Certification ID to delete
 * @returns {Object} Success message or error
 */
export async function deleteCertification(id) {
  try {
    await dbConnect();

    console.log('🗑️ [DELETE CERTIFICATION] Deleting certification:', id);
    await Certification.findByIdAndDelete(id);

    revalidatePath('/admin/certifications');
    revalidatePath('/');

    return { success: true, message: 'Certification deleted successfully' };
  } catch (error) {
    console.error('Error deleting certification:', error);
    return { success: false, message: 'Failed to delete certification' };
  }
}

/**
 * Retrieves a single certification by ID.
 * @param {string} id - Certification ID
 * @returns {Object} Serialized certification object or null
 */
export async function getCertificationById(id) {
  try {
    await dbConnect();
    const certification = await Certification.findById(id);
    return certification ? serializeForClient(certification) : null;
  } catch (error) {
    console.error('Error fetching certification:', error);
    return null;
  }
}
