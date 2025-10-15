/**
 * @fileoverview Service management actions for handling service CRUD operations.
 * Provides server-side functions for creating, updating, deleting, and retrieving services.
 */

'use server';

import dbConnect from '@/lib/dbConnect';
import Service from '@/models/Service';
import { revalidatePath } from 'next/cache';
import { serializeForClient } from '@/lib/serialize';

/**
 * Creates a new service in the database with the provided form data.
 * Handles database connection, service creation, and cache revalidation.
 *
 * @param {FormData} formData - Form data containing service information
 * @returns {Object} Error object if creation fails, otherwise returns success
 */
export async function createService(formData) {
  try {
    await dbConnect();

    // Additional safety: ensure no slug field exists in the data
    const cleanServiceData = { ...serviceData };
    delete cleanServiceData.slug;

    const newService = new Service({
      ...cleanServiceData,
      isActive: cleanServiceData.isActive === 'on',
    });

    await newService.save();

    return { success: true };
  } catch (error) {
    return { error: error.message || 'Failed to create service' };
  }
}

/**
 * Retrieves all active services from the database, sorted by display order.
 * Used for displaying services on the frontend.
 *
 * @returns {Array} Array of serialized active services
 */
export async function getActiveServices() {
  try {
    await dbConnect();
    const services = await Service.find({ isActive: true }).sort({ displayOrder: 1 }).lean();

    const serializedServices = services.map(serializeForClient);

    return serializedServices;
  } catch (error) {
    return [];
  }
}

/**
 * Retrieves all services from the database for admin management, sorted by display order.
 *
 * @returns {Array} Array of serialized services for admin display
 */
export async function getAllServices() {
  try {
    await dbConnect();
    const services = await Service.find({}).sort({ displayOrder: 1 }).lean();

    const serializedServices = services.map(serializeForClient);

    return serializedServices;
  } catch (error) {
    return [];
  }
}

/**
 * Updates an existing service in the database with the provided form data.
 * Handles database connection, service update, and cache revalidation.
 *
 * @param {string} id - The service ID to update
 * @param {FormData} formData - Form data containing updated service information
 * @returns {Object} Error object if update fails, otherwise returns success
 */
export async function updateService(id, formData) {
  try {
    await dbConnect();

    // Additional safety: ensure no slug field exists in the data
    const cleanServiceData = { ...serviceData };
    delete cleanServiceData.slug;

    await Service.findByIdAndUpdate(id, {
      ...cleanServiceData,
      isActive: cleanServiceData.isActive === 'on',
    });

    return { success: true };
  } catch (error) {
    return { error: error.message || 'Failed to update service' };
  }
}

/**
 * Deletes a service from the database.
 * Handles database connection, service deletion, and cache revalidation.
 *
 * @param {string} id - The service ID to delete
 * @returns {Object} Error object if deletion fails, otherwise returns success
 */
export async function deleteService(id) {
  try {
    await dbConnect();
    await Service.findByIdAndDelete(id);

    return { success: true };
  } catch (error) {
    return { error: error.message || 'Failed to delete service' };
  }
}
