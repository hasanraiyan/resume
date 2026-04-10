/**
 * @fileoverview MongoDB model for user/admin accounts.
 * Stores user profile information, social links, skills, and resume data.
 *
 * This model manages user accounts and profiles with:
 * - Personal information and role-based access control
 * - Social media links for professional networking
 * - Skills tracking with categories and proficiency levels
 * - Resume management with update tracking
 * - Avatar/profile image storage
 * - Integration with NextAuth.js for authentication
 *
 * @example
 * ```js
 * import User from '@/models/User';
 * import dbConnect from '@/lib/dbConnect';
 *
 * // Create new user account
 * const user = new User({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   role: 'admin',
 *   bio: 'Full-stack developer passionate about creating amazing web experiences',
 *   avatar: 'https://example.com/avatar.jpg',
 *   socialLinks: {
 *     github: 'https://github.com/johndoe',
 *     linkedin: 'https://linkedin.com/in/johndoe',
 *     twitter: 'https://twitter.com/johndoe',
 *     dribbble: 'https://dribbble.com/johndoe'
 *   },
 *   skills: [
 *     { name: 'React', category: 'Frontend', proficiency: 9 },
 *     { name: 'Node.js', category: 'Backend', proficiency: 8 },
 *     { name: 'MongoDB', category: 'Database', proficiency: 7 },
 *     { name: 'TypeScript', category: 'Language', proficiency: 8 }
 *   ],
 *   resume: {
 *     url: 'https://example.com/resume.pdf',
 *     lastUpdated: new Date()
 *   }
 * });
 *
 * await user.save();
 *
 * // Find user by email
 * const existingUser = await User.findOne({ email: 'john@example.com' });
 *
 * // Update user skills
 * existingUser.skills.push({
 *   name: 'Next.js',
 *   category: 'Frontend',
 *   proficiency: 9
 * });
 * await existingUser.save();
 *
 * // Update resume
 * existingUser.resume = {
 *   url: 'https://example.com/new-resume.pdf',
 *   lastUpdated: new Date()
 * };
 * await existingUser.save();
 * ```
 */

import mongoose from 'mongoose';

/**
 * Mongoose schema for User model.
 * Stores comprehensive user profile information including personal details,
 * social links, skills with proficiency levels, and resume management.
 *
 * @typedef {Object} User
 * @property {string} name - User's full name (required)
 * @property {string} email - Unique email address for authentication (required)
 * @property {string} role - User role for access control (e.g., 'admin', 'editor')
 * @property {string} [bio] - User biography/description (optional)
 * @property {string} [avatar] - Avatar/profile image URL (optional)
 * @property {UserSocialLinks} socialLinks - Social media profile links object
 * @property {UserSkill[]} skills - Array of user skills with categories and proficiency
 * @property {UserResume} [resume] - Resume document information (optional)
 * @property {Date} createdAt - Auto-generated creation timestamp
 * @property {Date} updatedAt - Auto-generated update timestamp
 */

/**
 * @typedef {Object} UserSocialLinks
 * @property {string} [github] - GitHub profile URL
 * @property {string} [linkedin] - LinkedIn profile URL
 * @property {string} [twitter] - Twitter profile URL
 * @property {string} [dribbble] - Dribbble portfolio URL
 * @property {string} [behance] - Behance portfolio URL
 */

/**
 * @typedef {Object} UserSkill
 * @property {string} name - Name of the skill/technology
 * @property {string} category - Skill category (e.g., 'Frontend', 'Backend', 'Database')
 * @property {number} [proficiency] - Proficiency level from 1-10 (optional)
 */

/**
 * @typedef {Object} UserResume
 * @property {string} [url] - URL to resume document
 * @property {Date} [lastUpdated] - Date when resume was last updated
 */
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String }, // Added for user credentials login
    role: { type: String, default: 'user' }, // Changed to default 'user' instead of required
    bio: { type: String },
    avatar: { type: String },
    socialLinks: {
      github: String,
      linkedin: String,
      twitter: String,
      dribbble: String,
      behance: String,
    },
    skills: [
      {
        name: String,
        category: String,
        proficiency: { type: Number, min: 1, max: 10 },
      },
    ],
    resume: {
      url: String,
      lastUpdated: Date,
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model('User', UserSchema);
