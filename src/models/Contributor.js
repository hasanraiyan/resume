/**
 * @fileoverview MongoDB model for project contributors.
 * Defines the schema for contributor profiles including personal info,
 * avatar, bio, and social media links.
 *
 * This model supports flexible contributor management with:
 * - Reusable contributor profiles across multiple projects
 * - Extensible social media links
 * - Avatar image storage
 * - Search indexing for admin lookup
 *
 * @example
 * ```js
 * import Contributor from '@/models/Contributor';
 *
 * // Create a new contributor
 * const contributor = new Contributor({
 *   name: "John Doe",
 *   avatar: "https://example.com/avatar.jpg",
 *   bio: "Full-stack developer with 5+ years experience",
 *   socialLinks: {
 *     portfolio: "https://johndoe.dev",
 *     linkedin: "https://linkedin.com/in/johndoe",
 *     github: "https://github.com/johndoe"
 *   }
 * });
 *
 * await contributor.save();
 *
 * // Search contributors
 * const contributors = await Contributor.find({
 *   $text: { $search: 'John Doe' }
 * });
 * ```
 */

import mongoose from 'mongoose';

/**
 * Mongoose schema for Contributor model.
 * Stores contributor profile information for use across multiple projects.
 *
 * @typedef {Object} Contributor
 * @property {string} name - Full name of the contributor
 * @property {string} avatar - Avatar image URL
 * @property {string} [bio] - Short biography or description
 * @property {SocialLinks} [socialLinks] - Object containing various social media links
 * @property {Date} createdAt - Auto-generated creation timestamp
 * @property {Date} updatedAt - Auto-generated update timestamp
 */

/**
 * @typedef {Object} SocialLinks
 * @property {string} [portfolio] - Personal portfolio website
 * @property {string} [linkedin] - LinkedIn profile URL
 * @property {string} [github] - GitHub profile URL
 * @property {string} [twitter] - Twitter/X profile URL
 * @property {string} [dribbble] - Dribbble portfolio URL
 * @property {string} [behance] - Behance portfolio URL
 * @property {string} [instagram] - Instagram profile URL
 * @property {string} [youtube] - YouTube channel URL
 */
const ContributorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    avatar: { type: String, required: true },
    bio: { type: String, trim: true },
    socialLinks: {
      portfolio: String,
      linkedin: String,
      github: String,
      twitter: String,
      dribbble: String,
      behance: String,
      instagram: String,
      youtube: String,
    },
  },
  { timestamps: true }
);

// Create text index for search functionality
ContributorSchema.index({
  name: 'text',
  bio: 'text',
});

export default mongoose.models.Contributor || mongoose.model('Contributor', ContributorSchema);
