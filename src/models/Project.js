/**
 * @fileoverview MongoDB model for portfolio projects.
 * Defines the schema for project data including metadata, links, details,
 * images, and tags. Includes text indexing for search functionality.
 *
 * This model supports a comprehensive project showcase system with:
 * - Featured project flagging for homepage display
 * - Multiple external links (live demo, GitHub, Figma, etc.)
 * - Detailed project information for case studies
 * - Image galleries with captions and alt text
 * - Technology tags with categorization
 * - Full-text search capabilities across all content fields
 *
 * @example
 * ```js
 * import Project from '@/models/Project';
 * import dbConnect from '@/lib/dbConnect';
 *
 * // Create a new project
 * const project = new Project({
 *   slug: 'ecommerce-platform',
 *   featured: true,
 *   projectNumber: '01',
 *   category: 'Web Development',
 *   title: 'E-commerce Platform',
 *   tagline: 'Full-stack online store with React & Node.js',
 *   description: 'A modern e-commerce solution with payment integration',
 *   fullDescription: 'Complete e-commerce platform built with...',
 *   thumbnail: '/images/projects/ecommerce-thumb.jpg',
 *   links: {
 *     live: 'https://shop.example.com',
 *     github: 'https://github.com/user/ecommerce',
 *     demo: 'https://demo.example.com'
 *   },
 *   details: {
 *     client: 'TechCorp Inc.',
 *     year: '2024',
 *     duration: '3 months',
 *     role: 'Full-stack Developer',
 *     challenge: 'Build scalable e-commerce platform...',
 *     solution: 'Implemented microservices architecture...',
 *     results: ['50% increase in sales', '99.9% uptime']
 *   },
 *   images: [
 *     {
 *       type: 'image',
 *       url: '/images/projects/ecommerce-1.jpg',
 *       alt: 'Homepage screenshot',
 *       caption: 'Clean, modern homepage design'
 *     }
 *   ],
 *   tags: [
 *     { name: 'React', category: 'Frontend' },
 *     { name: 'Node.js', category: 'Backend' },
 *     { name: 'MongoDB', category: 'Database' }
 *   ]
 * });
 *
 * await project.save();
 *
 * // Search projects
 * const projects = await Project.find({
 *   $text: { $search: 'React e-commerce' }
 * }).sort({ score: { $meta: 'textScore' } });
 * ```
 */

import mongoose from 'mongoose';

/**
 * Mongoose schema for Project model.
 * Stores comprehensive project information including metadata, links,
 * project details, image galleries, and categorized tags.
 *
 * @typedef {Object} Project
 * @property {string} slug - Unique URL-friendly identifier for the project
 * @property {boolean} featured - Whether project is featured on homepage (default: false)
 * @property {boolean} isForSale - Whether project is available for purchase (default: false)
 * @property {string} projectNumber - Display number for ordering projects
 * @property {string} category - Project category/type classification
 * @property {string} title - Project title/name
 * @property {string} tagline - Short, catchy tagline describing the project
 * @property {string} description - Brief description for project listings
 * @property {string} fullDescription - Detailed description for project detail pages
 * @property {string} thumbnail - Thumbnail image URL for project previews
 * @property {ProjectLinks} links - External links object containing various project URLs
 * @property {ProjectDetails} details - Detailed project information for case studies
 * @property {ProjectImage[]} images - Array of gallery images with metadata
 * @property {ProjectTag[]} tags - Array of technology/skill tags with categories
 * @property {Date} createdAt - Auto-generated creation timestamp
 * @property {Date} updatedAt - Auto-generated update timestamp
 */

/**
 * @typedef {Object} ProjectLinks
 * @property {string} [live] - Live demo/production URL
 * @property {string} [github] - GitHub repository URL
 * @property {string} [figma] - Figma design file URL
 * @property {string} [demo] - Demo or sandbox URL
 * @property {string} [sales] - Sales/purchase page URL (for projects for sale)
 */

/**
 * @typedef {Object} ProjectDetails
 * @property {string} [client] - Client or company name
 * @property {string} [year] - Project completion year
 * @property {string} [duration] - Project duration (e.g., "3 months")
 * @property {string} [role] - Developer's role in the project
 * @property {string} [challenge] - Problem or challenge addressed
 * @property {string} [solution] - Solution implemented
 * @property {string[]} [results] - Array of results/achievements
 */

/**
 * @typedef {Object} ProjectImage
 * @property {'image'|'video'} [type='image'] - Media type
 * @property {string} url - Image or video URL
 * @property {string} alt - Alt text for accessibility
 * @property {string} [caption] - Optional caption describing the image
 */

/**
 * @typedef {Object} ProjectTag
 * @property {string} name - Tag name (e.g., "React", "Node.js")
 * @property {string} category - Tag category (e.g., "Frontend", "Backend", "Database")
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
