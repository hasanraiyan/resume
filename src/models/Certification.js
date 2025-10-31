/**
 * @fileoverview MongoDB model for portfolio certifications.
 * Defines the schema for professional certifications including issuer details,
 * validation links, icon information, and status management.
 *
 * This model supports dynamic certification management with:
 * - Issuer and date tracking
 * - External validation URLs
 * - Icon type and name for flexible rendering
 * - Display order for presentation control
 * - Active/inactive status for visibility
 * - Timestamps for tracking changes
 *
 * @example
 * ```js
 * import Certification from '@/models/Certification';
 *
 * // Create a new certification
 * const cert = new Certification({
 *   name: 'AWS Certified Solutions Architect',
 *   issuer: 'Amazon Web Services',
 *   date: '2023',
 *   url: 'https://aws.amazon.com/certification/',
 *   iconType: 'fa',
 *   iconName: 'faAws',
 *   displayOrder: 1,
 *   isActive: true
 * });
 *
 * await cert.save();
 *
 * // Get all active certifications sorted by display order
 * const certifications = await Certification.find({ isActive: true }).sort({ displayOrder: 1 });
 * ```
 */

import mongoose from 'mongoose';

/**
 * Mongoose schema for Certification model.
 * Stores certification information including name, issuer, date,
 * validation URL, icon details, display configuration, and status.
 *
 * @typedef {Object} Certification
 * @property {string} name - Certification name
 * @property {string} issuer - Issuing organization
 * @property {string} date - Certification date/year
 * @property {string} url - External validation/verification URL
 * @property {string} iconType - Icon library type ('fa' for FontAwesome, 'lucide' for Lucide)
 * @property {string} iconName - Icon name/key for rendering
 * @property {number} displayOrder - Order for displaying certifications (default: 0)
 * @property {boolean} isActive - Whether certification is active and visible (default: true)
 * @property {Date} createdAt - Auto-generated creation timestamp
 * @property {Date} updatedAt - Auto-generated update timestamp
 */

const CertificationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    issuer: { type: String, required: true },
    date: { type: String, required: true },
    url: { type: String, required: true },
    iconType: { type: String, required: true, enum: ['fa', 'lucide'] },
    iconName: { type: String, required: true },
    displayOrder: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// Create index for efficient querying of active certifications by display order
CertificationSchema.index({ isActive: 1, displayOrder: 1 });

export default mongoose.models.Certification ||
  mongoose.model('Certification', CertificationSchema);
