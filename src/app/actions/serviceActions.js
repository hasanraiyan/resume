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

    // Convert FormData to plain object for processing
    const serviceData = Object.fromEntries(formData.entries());
    console.log('🔍 [CREATE SERVICE] Form data received:', serviceData);

    // Additional safety: ensure no slug field exists in the data
    const cleanServiceData = { ...serviceData };
    delete cleanServiceData.slug;
    console.log('🧹 [CREATE SERVICE] Cleaned data:', cleanServiceData);

    const newService = new Service({
      ...cleanServiceData,
      isActive: cleanServiceData.isActive === 'on',
    });

    await newService.save();
    console.log('✅ [CREATE SERVICE] Service created successfully');

    // Revalidate the admin services page to show the new service
    revalidatePath('/admin/services');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('❌ [CREATE SERVICE] Error:', error);
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

    // Simple serialization similar to API route
    const serializedServices = services.map((service) => ({
      ...service,
      _id: service._id.toString(),
      id: service._id.toString(),
    }));

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
    console.log('🔗 [GET ALL SERVICES] Connecting to DB...');
    await dbConnect();
    console.log('📡 [GET ALL SERVICES] DB connected, fetching services...');
    const services = await Service.find({}).sort({ displayOrder: 1 }).lean();
    console.log('📊 [GET ALL SERVICES] Raw services from DB:', services.length);

    const serializedServices = services.map((service) => serializeForClient(service));
    console.log('🔄 [GET ALL SERVICES] Serialized services:', serializedServices.length);

    return serializedServices;
  } catch (error) {
    console.error('❌ [GET ALL SERVICES] Error:', error);
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

    // Convert FormData to plain object for processing
    const serviceData = Object.fromEntries(formData.entries());
    console.log('🔍 [UPDATE SERVICE] Form data received for ID:', id, serviceData);

    // Additional safety: ensure no slug field exists in the data
    const cleanServiceData = { ...serviceData };
    delete cleanServiceData.slug;
    console.log('🧹 [UPDATE SERVICE] Cleaned data:', cleanServiceData);

    await Service.findByIdAndUpdate(id, {
      ...cleanServiceData,
      isActive: cleanServiceData.isActive === 'on',
    });
    console.log('✅ [UPDATE SERVICE] Service updated successfully for ID:', id);

    // Revalidate the admin services page to show the updated service
    revalidatePath('/admin/services');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    console.error('❌ [UPDATE SERVICE] Error for ID:', id, error);
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

    // Revalidate the admin services page to remove the deleted service
    revalidatePath('/admin/services');
    revalidatePath('/');

    return { success: true };
  } catch (error) {
    return { error: error.message || 'Failed to delete service' };
  }
}
