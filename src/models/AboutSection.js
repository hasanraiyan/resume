/**
 * @fileoverview MongoDB model for about section content.
 * Stores about section data including biography, resume link, and feature highlights.
 *
 * This model manages the "About Me" section content with:
 * - Customizable section title and biography paragraphs
 * - Resume download functionality with custom button text
 * - Feature highlights with icons, titles, and descriptions
 * - Active/inactive state management for content control
 * - Default content seeding for initial setup
 *
 * @example
 * ```js
 * import AboutSection from '@/models/AboutSection';
 * import dbConnect from '@/lib/dbConnect';
 *
 * // Get the active about section
 * const about = await AboutSection.findOne({ isActive: true });
 *
 * // Update biography
 * about.bio.paragraphs.push('New paragraph about recent achievements...');
 * await about.save();
 *
 * // Add new feature highlight
 * about.features.push({
 *   id: 5,
 *   icon: 'fas fa-award',
 *   title: 'Award Winning',
 *   description: 'Recognized for excellence in design and development'
 * });
 * await about.save();
 *
 * // Update resume link
 * about.resume = {
 *   text: 'Download CV',
 *   url: 'https://example.com/resume.pdf'
 * };
 * await about.save();
 *
 * // Seed default about section if none exists
 * const defaultAbout = await AboutSection.seedDefault();
 * ```
 */

import mongoose from 'mongoose';

/**
 * Mongoose schema for AboutSection model.
 * Stores about section content with bio paragraphs, resume link, and features.
 * Supports rich content management for the about page section.
 *
 * @typedef {Object} AboutSection
 * @property {string} sectionTitle - Section heading text (default: 'About Me')
 * @property {AboutBio} bio - Biography configuration with multiple paragraphs
 * @property {AboutResume} resume - Resume download button configuration
 * @property {AboutFeature[]} features - Array of feature highlights with icons and descriptions
 * @property {boolean} [isActive=true] - Whether this about section is currently active
 * @property {Date} createdAt - Auto-generated creation timestamp
 * @property {Date} updatedAt - Auto-generated update timestamp
 */

/**
 * @typedef {Object} AboutBio
 * @property {string[]} paragraphs - Array of biography paragraphs for rich content
 */

/**
 * @typedef {Object} AboutResume
 * @property {string} text - Button text for resume download (default: 'Download Resume')
 * @property {string} url - URL to resume file (default: '#')
 */

/**
 * @typedef {Object} AboutFeature
 * @property {number} id - Unique identifier for the feature
 * @property {string} icon - CSS class or icon identifier (e.g., 'fas fa-lightbulb')
 * @property {string} title - Feature title/heading
 * @property {string} description - Detailed description of the feature
 */
const AboutSectionSchema = new mongoose.Schema(
  {
    sectionTitle: {
      type: String,
      required: true,
      default: 'About Me',
    },

    bio: {
      paragraphs: [
        {
          type: String,
          required: true,
          default:
            "I'm a passionate creative developer with a love for crafting exceptional digital experiences. My journey in design and development has been driven by curiosity and a constant desire to learn.",
        },
      ],
    },

    resume: {
      text: {
        type: String,
        required: true,
        default: 'Download Resume',
      },
      url: {
        type: String,
        required: true,
        default: '#',
      },
    },

    features: [
      {
        id: {
          type: Number,
          required: true,
        },
        icon: {
          type: String,
          required: true,
          default: 'fas fa-lightbulb',
        },
        title: {
          type: String,
          required: true,
          default: 'Creative',
        },
        description: {
          type: String,
          required: true,
          default: 'Innovative solutions for complex problems',
        },
      },
    ],

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
 * Static method to seed default about section data if none exists.
 * Creates a comprehensive about section with sample biography, resume link,
 * and feature highlights for initial portfolio setup.
 *
 * This method is typically called during application initialization or
 * when setting up the portfolio for the first time. It provides rich
 * default content that can be customized through the admin interface.
 *
 * @static
 * @async
 * @function seedDefault
 * @returns {Promise<AboutSection>} The newly created about section with default content
 *
 * @example
 * ```js
 * // In application startup script
 * import AboutSection from '@/models/AboutSection';
 *
 * const about = await AboutSection.seedDefault();
 * console.log('About section created with', about.features.length, 'features');
 *
 * // In API route for initial setup
 * export async function POST() {
 *   const about = await AboutSection.seedDefault();
 *   return Response.json({
 *     success: true,
 *     message: 'About section initialized',
 *     about: about.sectionTitle
 *   });
 * }
 *
 * // Check if about section exists before seeding
 * const existingAbout = await AboutSection.findOne({ isActive: true });
 * if (!existingAbout) {
 *   await AboutSection.seedDefault();
 * }
 * ```
 */
AboutSectionSchema.statics.seedDefault = async function () {
  const defaultData = {
    sectionTitle: 'About Me',
    bio: {
      paragraphs: [
        "I'm a passionate creative developer with a love for crafting exceptional digital experiences. My journey in design and development has been driven by curiosity and a constant desire to learn.",
        'With expertise spanning from concept to execution, I bring ideas to life through clean code, thoughtful design, and attention to detail that makes every project unique.',
        "When I'm not coding, you'll find me exploring new design trends, experimenting with new technologies, or enjoying a good cup of coffee while sketching new ideas.",
      ],
    },
    resume: {
      text: 'Download Resume',
      url: '#',
    },
    features: [
      {
        id: 1,
        icon: 'fas fa-lightbulb',
        title: 'Creative',
        description: 'Innovative solutions for complex problems',
      },
      {
        id: 2,
        icon: 'fas fa-rocket',
        title: 'Fast',
        description: 'Optimized performance and quick delivery',
      },
      {
        id: 3,
        icon: 'fas fa-mobile-alt',
        title: 'Responsive',
        description: 'Works perfectly on all devices',
      },
      {
        id: 4,
        icon: 'fas fa-code',
        title: 'Clean Code',
        description: 'Maintainable and scalable solutions',
      },
    ],
    isActive: true,
  };

  return await this.create(defaultData);
};

/**
 * Static method to retrieve the about section settings.
 * Ensures that at least one about section exists by seeding default data if necessary.
 *
 * @static
 * @async
 * @function getSettings
 * @returns {Promise<AboutSection>} The active about section document
 */
AboutSectionSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ isActive: true }).lean();
  if (!settings) {
    settings = (await this.seedDefault()).toObject();
  }
  return settings;
};

const AboutSection =
  mongoose.models.AboutSection || mongoose.model('AboutSection', AboutSectionSchema);

if (!AboutSection.getSettings) {
  AboutSection.getSettings = async function () {
    let settings = await this.findOne({ isActive: true }).lean();
    if (!settings) {
      settings = (await this.seedDefault()).toObject();
    }
    return settings;
  };
}

export default AboutSection;
