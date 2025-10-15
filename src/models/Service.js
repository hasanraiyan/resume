/**
 * @fileoverview MongoDB model for portfolio services.
 * Defines the schema for service offerings including icons, descriptions,
 * and display configuration for the services section.
 *
 * This model supports a comprehensive services management system with:
 * - Icon representation using Font Awesome classes
 * - Display order for organizing services presentation
 * - Active/inactive status for service visibility control
 * - Timestamps for tracking creation and updates
 *
 * @example
 * ```js
 * import Service from '@/models/Service';
 * import dbConnect from '@/lib/dbConnect';
 *
 * // Create a new service
 * const service = new Service({
 *   title: 'Web Development',
 *   description: 'Custom websites and web applications built with modern technologies',
 *   icon: 'fas fa-code',
 *   displayOrder: 1,
 *   isActive: true
 * });
 *
 * await service.save();
 *
 * // Get all active services sorted by display order
 * const services = await Service.find({ isActive: true }).sort({ displayOrder: 1 });
 * ```
 */

import mongoose from 'mongoose';

/**
 * Mongoose schema for Service model.
 * Stores service information including title, description, icon,
 * display configuration, and status.
 *
 * @typedef {Object} Service
 * @property {string} title - Service title/name
 * @property {string} description - Detailed description of the service offered
 * @property {string} icon - Font Awesome icon class (e.g., "fas fa-code")
 * @property {number} displayOrder - Order for displaying services (default: 0)
 * @property {boolean} isActive - Whether service is active and visible (default: true)
 * @property {Date} createdAt - Auto-generated creation timestamp
 * @property {Date} updatedAt - Auto-generated update timestamp
 */

const ServiceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    icon: { type: String, required: true }, // Font Awesome class, e.g., "fas fa-code"
    displayOrder: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// Create index for efficient querying of active services by display order
ServiceSchema.index({ isActive: 1, displayOrder: 1 });

export default mongoose.models.Service || mongoose.model('Service', ServiceSchema);
