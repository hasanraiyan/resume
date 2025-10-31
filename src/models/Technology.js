/**
 * @fileoverview MongoDB model for portfolio technologies.
 * Defines the schema for technology stack items including icon information,
 * display configuration, and status management.
 *
 * This model supports dynamic technology management with:
 * - Icon type and name for flexible icon rendering
 * - Display order for presentation control
 * - Active/inactive status for visibility
 * - Timestamps for tracking changes
 *
 * @example
 * ```js
 * import Technology from '@/models/Technology';
 *
 * // Create a new technology
 * const tech = new Technology({
 *   name: 'React',
 *   iconType: 'fa',
 *   iconName: 'faReact',
 *   displayOrder: 1,
 *   isActive: true
 * });
 *
 * await tech.save();
 *
 * // Get all active technologies sorted by display order
 * const technologies = await Technology.find({ isActive: true }).sort({ displayOrder: 1 });
 * ```
 */

import mongoose from 'mongoose';

/**
 * Mongoose schema for Technology model.
 * Stores technology information including name, icon details,
 * display configuration, and status.
 *
 * @typedef {Object} Technology
 * @property {string} name - Technology name
 * @property {string} iconType - Icon library type ('fa' for FontAwesome, 'lucide' for Lucide)
 * @property {string} iconName - Icon name/key for rendering
 * @property {number} displayOrder - Order for displaying technologies (default: 0)
 * @property {boolean} isActive - Whether technology is active and visible (default: true)
 * @property {Date} createdAt - Auto-generated creation timestamp
 * @property {Date} updatedAt - Auto-generated update timestamp
 */

const TechnologySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    iconType: { type: String, required: true, enum: ['fa', 'lucide'] },
    iconName: { type: String, required: true },
    displayOrder: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// Create index for efficient querying of active technologies by display order
TechnologySchema.index({ isActive: 1, displayOrder: 1 });

export default mongoose.models.Technology || mongoose.model('Technology', TechnologySchema);
