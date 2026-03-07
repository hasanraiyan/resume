/**
 * @fileoverview MongoDB model for hero section content.
 * Stores homepage hero section data including heading, introduction,
 * CTAs, social links, and profile information. Implements singleton pattern.
 *
 * This model manages the homepage hero section with a comprehensive content structure:
 * - Badge text for attention-grabbing headlines
 * - Three-line animated heading system
 * - Personal introduction with name and role
 * - Primary and secondary call-to-action buttons
 * - Social media links with custom icons and ordering
 * - Profile image and experience badge
 * - Singleton pattern ensuring only one active hero section
 *
 * @example
 * ```js
 * import HeroSection from '@/models/HeroSection';
 * import dbConnect from '@/lib/dbConnect';
 *
 * // Get the active hero section
 * const hero = await HeroSection.findOne({ isActive: true });
 *
 * // Update hero content
 * hero.heading.line1 = 'Building';
 * hero.heading.line2 = 'Amazing';
 * hero.heading.line3 = 'Experiences';
 * hero.introduction.text = 'I create digital solutions that matter';
 * await hero.save();
 *
 * // Add social media link
 * hero.socialLinks.push({
 *   name: 'GitHub',
 *   url: 'https://github.com/username',
 *   icon: 'fab fa-github',
 *   order: 5
 * });
 * await hero.save();
 *
 * // Seed default hero section if none exists
 * const defaultHero = await HeroSection.seedDefault();
 * ```
 */

import mongoose from 'mongoose';

/**
 * Mongoose schema for HeroSection model.
 * Stores hero section content with badge, heading, introduction, CTAs, and profile.
 * Ensures only one active hero section exists at a time through pre-save hooks.
 *
 * @typedef {Object} HeroSection
 * @property {HeroBadge} badge - Badge text configuration displayed above heading
 * @property {HeroHeading} heading - Three-line heading configuration for animations
 * @property {HeroIntroduction} introduction - Introduction text with name and role
 * @property {HeroCTA} cta - Primary and secondary call-to-action button configuration
 * @property {HeroSocialLink[]} socialLinks - Array of social media links with icons and ordering
 * @property {HeroProfile} profile - Profile image and experience badge configuration
 * @property {boolean} isActive - Whether this hero section is currently active (default: true)
 * @property {Date} createdAt - Auto-generated creation timestamp
 * @property {Date} updatedAt - Auto-generated update timestamp
 */

/**
 * @typedef {Object} HeroBadge
 * @property {string} text - Badge text displayed above the main heading (default: 'CREATIVE DEVELOPER')
 */

/**
 * @typedef {Object} HeroHeading
 * @property {string} line1 - First line of the animated heading (default: 'Crafting')
 * @property {string} line2 - Second line of the animated heading (default: 'Digital')
 * @property {string} line3 - Third line of the animated heading (default: 'Excellence')
 */

/**
 * @typedef {Object} HeroIntroduction
 * @property {string} text - Full introduction paragraph describing the person/role
 * @property {string} name - Person's name for highlighting (default: 'John Doe')
 * @property {string} role - Professional role/title (default: 'creative developer')
 */

/**
 * @typedef {Object} HeroCTA
 * @property {HeroCTAButton} primary - Primary call-to-action button configuration
 * @property {HeroCTAButton} secondary - Secondary call-to-action button configuration
 */

/**
 * @typedef {Object} HeroCTAButton
 * @property {string} text - Button text/label
 * @property {string} link - Button link URL (can be hash link or external URL)
 */

/**
 * @typedef {Object} HeroSocialLink
 * @property {string} name - Display name of the social platform
 * @property {string} url - Full URL to the social media profile
 * @property {string} icon - CSS class or icon identifier (e.g., 'fab fa-github')
 * @property {number} [order=0] - Display order for sorting social links
 */

/**
 * @typedef {Object} HeroProfile
 * @property {HeroProfileImage} image - Profile image configuration
 * @property {HeroExperienceBadge} badge - Experience/years badge configuration
 */

/**
 * @typedef {Object} HeroProfileImage
 * @property {string} [url] - Profile image URL (optional)
 * @property {string} alt - Alt text for accessibility (default: 'Portrait')
 */

/**
 * @typedef {Object} HeroExperienceBadge
 * @property {string} value - Numeric value to display (e.g., '5+')
 * @property {string} label - Label describing what the value represents (default: 'Years Experience')
 */
const HeroSectionSchema = new mongoose.Schema(
  {
    badge: {
      text: {
        type: String,
        required: true,
        default: 'CREATIVE DEVELOPER',
      },
    },

    heading: {
      line1: {
        type: String,
        required: true,
        default: 'Crafting',
      },
      line2: {
        type: String,
        required: true,
        default: 'Digital',
      },
      line3: {
        type: String,
        required: true,
        default: 'Excellence',
      },
    },

    introduction: {
      text: {
        type: String,
        required: true,
        default:
          "I'm John Doe, a creative developer focused on building beautiful and functional digital experiences that make a difference.",
      },
      name: {
        type: String,
        required: true,
        default: 'John Doe',
      },
      role: {
        type: String,
        required: true,
        default: 'creative developer',
      },
    },

    cta: {
      primary: {
        text: {
          type: String,
          required: true,
          default: 'View My Work',
        },
        link: {
          type: String,
          required: true,
          default: '#work',
        },
      },
      secondary: {
        text: {
          type: String,
          required: true,
          default: 'Contact Me',
        },
        link: {
          type: String,
          required: true,
          default: '#contact',
        },
      },
    },

    socialLinks: [
      {
        name: {
          type: String,
          required: true,
        },
        url: {
          type: String,
          required: true,
        },
        icon: {
          type: String,
          required: true,
        },
        order: {
          type: Number,
          default: 0,
        },
      },
    ],

    profile: {
      image: {
        url: {
          type: String,
          required: false,
          default: '',
        },
        alt: {
          type: String,
          required: true,
          default: 'Portrait',
        },
      },
      badge: {
        value: {
          type: String,
          required: true,
          default: '5+',
        },
        label: {
          type: String,
          required: true,
          default: 'Years Experience',
        },
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
 * Pre-save middleware hook that ensures singleton pattern for hero sections.
 * When a hero section is activated (isActive: true), all other hero sections
 * are automatically deactivated to maintain only one active section at a time.
 *
 * This hook runs before saving and prevents multiple active hero sections,
 * ensuring data consistency and avoiding conflicts in the frontend display.
 *
 * @async
 * @function pre-save-hook
 * @this HeroSection - The hero section document being saved
 * @param {Function} next - Callback function to continue the save operation
 *
 * @example
 * ```js
 * // This will automatically deactivate other hero sections
 * const hero = await HeroSection.findOne({ isActive: false });
 * hero.isActive = true;
 * await hero.save(); // Other hero sections become inactive automatically
 * ```
 */
HeroSectionSchema.pre('save', async function (next) {
  if (this.isActive) {
    await this.constructor.updateMany({ _id: { $ne: this._id } }, { isActive: false });
  }
  next();
});

/**
 * Static method to seed default hero section data if none exists.
 * Creates a new hero section with default content and social links when
 * no active hero section is found in the database.
 *
 * This method is typically called during application initialization or
 * when setting up the portfolio for the first time. It ensures there's
 * always at least one hero section available for display.
 *
 * @static
 * @async
 * @function seedDefault
 * @returns {Promise<HeroSection>} The existing active hero section or newly created default one
 *
 * @example
 * ```js
 * // In application startup or setup script
 * import HeroSection from '@/models/HeroSection';
 *
 * const hero = await HeroSection.seedDefault();
 * console.log('Hero section ready:', hero.badge.text);
 *
 * // In API route for initial setup
 * export async function POST() {
 *   const hero = await HeroSection.seedDefault();
 *   return Response.json({ success: true, hero });
 * }
 * ```
 */
HeroSectionSchema.statics.seedDefault = async function () {
  const existingHero = await this.findOne({ isActive: true });

  if (!existingHero) {
    const defaultHero = new this({
      socialLinks: [
        {
          name: 'Dribbble',
          url: 'https://dribbble.com/yourusername',
          icon: 'fab fa-dribbble',
          order: 1,
        },
        {
          name: 'Behance',
          url: 'https://behance.net/yourusername',
          icon: 'fab fa-behance',
          order: 2,
        },
        {
          name: 'Instagram',
          url: 'https://instagram.com/yourusername',
          icon: 'fab fa-instagram',
          order: 3,
        },
        {
          name: 'LinkedIn',
          url: 'https://linkedin.com/in/yourusername',
          icon: 'fab fa-linkedin',
          order: 4,
        },
      ],
    });

    await defaultHero.save();
    return defaultHero;
  }

  return existingHero;
};

/**
 * Static method to retrieve the hero section settings.
 * Ensures that at least one hero section exists by seeding default data if necessary.
 *
 * @static
 * @async
 * @function getSettings
 * @returns {Promise<HeroSection>} The active hero section document
 */
HeroSectionSchema.statics.getSettings = async function () {
  let settings = await this.findOne({ isActive: true }).lean();
  if (!settings) {
    settings = (await this.seedDefault()).toObject();
  }
  return settings;
};

const HeroSection = mongoose.models.HeroSection || mongoose.model('HeroSection', HeroSectionSchema);

// Ensure the static method is available even if the model was previously cached
if (!HeroSection.getSettings) {
  HeroSection.getSettings = async function () {
    let settings = await this.findOne({ isActive: true }).lean();
    if (!settings) {
      settings = (await this.seedDefault()).toObject();
    }
    return settings;
  };
}

export default HeroSection;
