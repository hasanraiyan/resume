/**
 * @fileoverview MongoDB model for user/admin accounts.
 * Stores user profile information, social links, skills, and resume data.
 */

// src/models/User.js
import mongoose from 'mongoose';

/**
 * Mongoose schema for User model.
 * Stores user profile with social links, skills, and resume information.
 *
 * @typedef {Object} User
 * @property {string} name - User's full name
 * @property {string} email - Unique email address
 * @property {string} role - User role (e.g., admin, editor)
 * @property {string} bio - User biography
 * @property {string} avatar - Avatar image URL
 * @property {Object} socialLinks - Social media profile links
 * @property {Array<Object>} skills - User skills with categories and proficiency levels
 * @property {Object} resume - Resume URL and last update date
 * @property {Date} createdAt - Auto-generated creation timestamp
 * @property {Date} updatedAt - Auto-generated update timestamp
 */
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    role: { type: String, required: true },
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
