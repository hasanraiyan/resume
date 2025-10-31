/**
 * @fileoverview MongoDB model for portfolio skills.
 * Defines the schema for technical skills including proficiency levels,
 * display configuration, and status management.
 *
 * This model supports dynamic skills management with:
 * - Proficiency level tracking (0-100)
 * - Display order for presentation control
 * - Active/inactive status for visibility
 * - Timestamps for tracking changes
 *
 * @example
 * ```js
 * import Skill from '@/models/Skill';
 *
 * // Create a new skill
 * const skill = new Skill({
 *   name: 'JavaScript',
 *   level: 95,
 *   displayOrder: 1,
 *   isActive: true
 * });
 *
 * await skill.save();
 *
 * // Get all active skills sorted by display order
 * const skills = await Skill.find({ isActive: true }).sort({ displayOrder: 1 });
 * ```
 */

import mongoose from 'mongoose';

/**
 * Mongoose schema for Skill model.
 * Stores skill information including name, proficiency level,
 * icon, display configuration, and status.
 *
 * @typedef {Object} Skill
 * @property {string} name - Skill name
 * @property {number} level - Proficiency level (0-100)
 * @property {string} [iconType] - Icon library type ('fa' for FontAwesome, 'lucide' for Lucide)
 * @property {string} [icon] - Icon name/key for rendering
 * @property {number} displayOrder - Order for displaying skills (default: 0)
 * @property {boolean} isActive - Whether skill is active and visible (default: true)
 * @property {Date} createdAt - Auto-generated creation timestamp
 * @property {Date} updatedAt - Auto-generated update timestamp
 */

const SkillSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    level: { type: Number, required: true, min: 0, max: 100 },
    iconType: { type: String, default: 'fa', enum: ['fa', 'lucide'] }, // Icon library type
    icon: { type: String, default: '' }, // Icon name/key
    displayOrder: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

// Create index for efficient querying of active skills by display order
SkillSchema.index({ isActive: 1, displayOrder: 1 });

export default mongoose.models.Skill || mongoose.model('Skill', SkillSchema);
