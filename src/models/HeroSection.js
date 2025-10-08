/**
 * @fileoverview MongoDB model for hero section content.
 * Stores homepage hero section data including heading, introduction,
 * CTAs, social links, and profile information. Implements singleton pattern.
 */

import mongoose from 'mongoose';

/**
 * Mongoose schema for HeroSection model.
 * Stores hero section content with badge, heading, introduction, CTAs, and profile.
 * Ensures only one active hero section exists at a time.
 *
 * @typedef {Object} HeroSection
 * @property {Object} badge - Badge text displayed above heading
 * @property {Object} heading - Three-line heading configuration
 * @property {Object} introduction - Introduction text with name and role
 * @property {Object} cta - Primary and secondary call-to-action buttons
 * @property {Array<Object>} socialLinks - Social media links with icons and ordering
 * @property {Object} profile - Profile image and experience badge
 * @property {boolean} isActive - Whether this hero section is active
 * @property {Date} createdAt - Auto-generated creation timestamp
 * @property {Date} updatedAt - Auto-generated update timestamp
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
 * Pre-save hook to ensure only one active hero section exists.
 * Deactivates all other hero sections when a new one is activated.
 */
HeroSectionSchema.pre('save', async function (next) {
  if (this.isActive) {
    await this.constructor.updateMany({ _id: { $ne: this._id } }, { isActive: false });
  }
  next();
});

/**
 * Seeds default hero section data if none exists.
 * Creates a new hero section with default social links.
 *
 * @static
 * @function seedDefault
 * @returns {Promise<HeroSection>} The existing or newly created hero section
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

export default mongoose.models.HeroSection || mongoose.model('HeroSection', HeroSectionSchema);
