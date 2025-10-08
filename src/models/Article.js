/**
 * @fileoverview MongoDB model for blog articles.
 * Defines the schema for article/blog post data with status management,
 * automatic publishing date setting, and text search indexing.
 */

import mongoose from 'mongoose';

/**
 * Mongoose schema for Article model.
 * Stores blog articles with draft/published workflow and automatic date handling.
 *
 * @typedef {Object} Article
 * @property {string} title - Article title
 * @property {string} slug - Unique URL-friendly identifier
 * @property {string} excerpt - Brief summary/excerpt
 * @property {string} coverImage - Cover image URL
 * @property {string} content - Full article content (markdown/HTML)
 * @property {string} status - Publication status (draft or published)
 * @property {Array<string>} tags - Article tags for categorization
 * @property {Date} publishedAt - Publication date (auto-set on publish)
 * @property {Date} createdAt - Auto-generated creation timestamp
 * @property {Date} updatedAt - Auto-generated update timestamp
 */
const ArticleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    excerpt: { type: String, required: true },
    coverImage: { type: String },
    content: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
      index: true,
    },
    tags: [{ type: String }],
    publishedAt: { type: Date },
  },
  { timestamps: true }
);

// Create text index for full-text search
ArticleSchema.index({
  title: 'text',
  excerpt: 'text',
  content: 'text',
  tags: 'text',
});

// Set publishedAt when status changes to published
ArticleSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

export default mongoose.models.Article || mongoose.model('Article', ArticleSchema);
