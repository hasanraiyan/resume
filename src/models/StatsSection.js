/**
 * @fileoverview MongoDB model for statistics section content.
 * Stores homepage statistics section data including animated counters,
 * achievement metrics, and visual configuration for impact display.
 *
 * This model manages the statistics/achievements section with:
 * - Customizable section heading and description
 * - Animated counter statistics with icons and labels
 * - Configurable animation settings (duration, count-up effect)
 * - Rich statistical data presentation
 * - Default content seeding for portfolio showcase
 *
 * @example
 * ```js
 * import StatsSection from '@/models/StatsSection';
 * import dbConnect from '@/lib/dbConnect';
 *
 * // Get the active stats section
 * const stats = await StatsSection.findOne({ isActive: true });
 *
 * // Update section heading
 * stats.heading.title = 'Our Impact';
 * stats.heading.description = 'Measurable results that matter';
 * await stats.save();
 *
 * // Add new statistic
 * stats.stats.push({
 *   id: 5,
 *   number: '50+',
 *   label: 'Technologies Mastered',
 *   icon: 'fas fa-code',
 *   description: 'Programming languages and frameworks'
 * });
 * await stats.save();
 *
 * // Update animation settings
 * stats.animation = {
 *   countUp: true,
 *   duration: 3000  // Slower animation
 * };
 * await stats.save();
 *
 * // Seed default stats section if none exists
 * const defaultStats = await StatsSection.seedDefault();
 * ```
 */

import mongoose from 'mongoose';

/**
 * Mongoose schema for StatsSection model.
 * Stores statistics section content with animated counters, achievement metrics,
 * and visual configuration for displaying key performance indicators.
 *
 * @typedef {Object} StatsSection
 * @property {StatsHeading} heading - Section title and description configuration
 * @property {StatsItem[]} stats - Array of statistical items with numbers and labels
 * @property {StatsAnimation} animation - Animation configuration for counter effects
 * @property {boolean} [isActive=true] - Whether this stats section is currently active
 * @property {Date} createdAt - Auto-generated creation timestamp
 * @property {Date} updatedAt - Auto-generated update timestamp
 */

/**
 * @typedef {Object} StatsHeading
 * @property {string} title - Main heading text (default: 'Our Achievements')
 * @property {string} description - Subtitle/description text (default: 'Numbers that speak for themselves')
 */

/**
 * @typedef {Object} StatsItem
 * @property {number} id - Unique identifier for the statistic item
 * @property {string} number - Display number/value (e.g., '180+', '75+')
 * @property {string} label - Label describing what the number represents
 * @property {string} icon - CSS class or icon identifier (e.g., 'fas fa-project-diagram')
 * @property {string} description - Detailed explanation of the statistic
 */

/**
 * @typedef {Object} StatsAnimation
 * @property {boolean} [countUp=true] - Whether to animate counting up to the target number
 * @property {number} [duration=2000] - Animation duration in milliseconds
 */
const StatsSectionSchema = new mongoose.Schema(
  {
    heading: {
      title: {
        type: String,
        required: true,
        default: 'Our Achievements',
      },
      description: {
        type: String,
        required: true,
        default: 'Numbers that speak for themselves',
      },
    },

    stats: [
      {
        id: {
          type: Number,
          required: true,
        },
        number: {
          type: String,
          required: true,
          default: '180+',
        },
        label: {
          type: String,
          required: true,
          default: 'Projects Completed',
        },
        icon: {
          type: String,
          required: true,
          default: 'fas fa-project-diagram',
        },
        description: {
          type: String,
          required: true,
          default: 'Successfully delivered projects',
        },
      },
    ],

    animation: {
      countUp: {
        type: Boolean,
        default: true,
      },
      duration: {
        type: Number,
        default: 2000,
      },
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Static method to seed default statistics section data if none exists.
 * Creates a comprehensive stats section with sample achievement metrics
 * including projects completed, client satisfaction, awards, and experience.
 *
 * This method is typically called during application initialization or
 * when setting up the portfolio showcase for the first time. It provides
 * realistic default statistics that should be updated with actual data.
 *
 * @static
 * @async
 * @function seedDefault
 * @returns {Promise<StatsSection>} The newly created stats section with default metrics
 *
 * @example
 * ```js
 * // In application startup script
 * import StatsSection from '@/models/StatsSection';
 *
 * const stats = await StatsSection.seedDefault();
 * console.log('Stats section created with', stats.stats.length, 'statistics');
 *
 * // In API route for initial setup
 * export async function POST() {
 *   const stats = await StatsSection.seedDefault();
 *   return Response.json({
 *     success: true,
 *     message: 'Statistics section initialized',
 *     statsCount: stats.stats.length
 *   });
 * }
 *
 * // Check if stats section exists before seeding
 * const existingStats = await StatsSection.findOne({ isActive: true });
 * if (!existingStats) {
 *   await StatsSection.seedDefault();
 * }
 * ```
 */
StatsSectionSchema.statics.seedDefault = async function () {
  const defaultData = {
    heading: {
      title: 'Our Achievements',
      description: 'Numbers that speak for themselves',
    },
    stats: [
      {
        id: 1,
        number: '180+',
        label: 'Projects Completed',
        icon: 'fas fa-project-diagram',
        description: 'Successfully delivered projects',
      },
      {
        id: 2,
        number: '75+',
        label: 'Happy Clients',
        icon: 'fas fa-smile',
        description: 'Satisfied clients worldwide',
      },
      {
        id: 3,
        number: '12+',
        label: 'Awards Won',
        icon: 'fas fa-trophy',
        description: 'Industry recognition and awards',
      },
      {
        id: 4,
        number: '5+',
        label: 'Years Experience',
        icon: 'fas fa-calendar-alt',
        description: 'Years of professional experience',
      },
    ],
    animation: {
      countUp: true,
      duration: 2000,
    },
    isActive: true,
  };

  return await this.create(defaultData);
};

/**
 * Static method to retrieve the stats section settings.
 * Ensures that at least one stats section exists by seeding default data if necessary.
 *
 * @static
 * @async
 * @function getSettings
 * @returns {Promise<StatsSection>} The active stats section document
 */
StatsSectionSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ isActive: true }).lean();
  if (!settings) {
    settings = (await this.seedDefault()).toObject();
  }
  return settings;
};

const StatsSection =
  mongoose.models.StatsSection || mongoose.model('StatsSection', StatsSectionSchema);

if (!StatsSection.getSettings) {
  StatsSection.getSettings = async function () {
    let settings = await this.findOne({ isActive: true }).lean();
    if (!settings) {
      settings = (await this.seedDefault()).toObject();
    }
    return settings;
  };
}

export default StatsSection;
