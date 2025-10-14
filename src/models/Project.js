/**
 * @fileoverview MongoDB model for portfolio projects.
 * Defines the schema for project data including metadata, links, details,
 * images, and tags. Includes text indexing for search functionality.
 */

// src/models/Project.js
import mongoose from 'mongoose';

/**
 * Mongoose schema for Project model.
 * Stores comprehensive project information including metadata, links,
 * project details, image galleries, and categorized tags.
 *
 * @typedef {Object} Project
 * @property {string} slug - Unique URL-friendly identifier
 * @property {boolean} featured - Whether project is featured on homepage
 * @property {string} projectNumber - Display number for ordering
 * @property {string} category - Project category/type
 * @property {string} title - Project title
 * @property {string} tagline - Short tagline
 * @property {string} description - Brief description
 * @property {string} fullDescription - Detailed description
 * @property {string} thumbnail - Thumbnail image URL
 * @property {Object} links - External links (live, github, figma, demo)
 * @property {Object} details - Project details (client, year, duration, role, challenge, solution, results)
 * @property {Array<Object>} images - Gallery images with URL, alt text, and captions
 * @property {Array<Object>} tags - Technology/skill tags with name and category
 * @property {Date} createdAt - Auto-generated creation timestamp
 * @property {Date} updatedAt - Auto-generated update timestamp
 */
const ProjectSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true },
    featured: { type: Boolean, default: false },
    isForSale: { type: Boolean, default: false },
    projectNumber: { type: String, required: true },
    category: { type: String, required: true },
    title: { type: String, required: true },
    tagline: { type: String, required: true },
    description: { type: String, required: true },
    fullDescription: { type: String, required: true },
    thumbnail: { type: String, required: true },
    // Project links
    links: {
      live: String,
      github: String,
      figma: String,
      demo: String,
      sales: String,
    },
    // Project details for detailed view
    details: {
      client: String,
      year: String,
      duration: String,
      role: String,
      challenge: String,
      solution: String,
      results: [String],
    },
    // You could add more models for images and tags if needed,
    // but for simplicity, we can start with embedded arrays.
    images: [
      {
        type: { type: String, enum: ['image', 'video'], default: 'image' },
        url: String,
        alt: String,
        caption: String,
      },
    ],
    tags: [
      {
        name: String,
        category: String,
      },
    ],
  },
  { timestamps: true }
);

// Create text index for full-text search
ProjectSchema.index({
  title: 'text',
  tagline: 'text',
  description: 'text',
  fullDescription: 'text',
  category: 'text',
  'tags.name': 'text',
});

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);
