/**
 * @fileoverview MongoDB model for blog articles.
 * Defines the schema for article/blog post data with status management,
 * automatic publishing date setting, and text search indexing.
 *
 * This model supports a complete blog/article workflow with draft and published
 * states, automatic publication date setting, and full-text search capabilities.
 * Essential for content management systems and blog functionality.
 *
 * @example
 * ```js
 * import Article from '@/models/Article';
 *
 * // Create a new draft article
 * const article = new Article({
 *   title: 'My Blog Post',
 *   slug: 'my-blog-post',
 *   excerpt: 'A brief summary...',
 *   content: 'Full article content...',
 *   tags: ['javascript', 'web-development']
 * });
 * await article.save();
 *
 * // Publish the article
 * article.status = 'published';
 * await article.save(); // publishedAt will be set automatically
 * ```
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
 * @property {string} visibility - Article visibility (public, private, or unlisted, default: public)
 * @property {Array<string>} tags - Article tags for categorization
 * @property {number} likes - Number of likes received (default: 0)
 * @property {number} claps - Number of claps received (default: 0)
 * @property {number} views - Number of views received (default: 0)
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
    visibility: {
      type: String,
      enum: ['public', 'private', 'unlisted'],
      default: 'public',
      index: true,
    },
    tags: [{ type: String }],
    likes: { type: Number, default: 0 },
    claps: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
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

// Create compound index for blog listing queries (status + publishedAt)
ArticleSchema.index({
  status: 1,
  visibility: 1,
  publishedAt: -1,
});

// Set publishedAt when status changes to published
ArticleSchema.pre('save', function (next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

export default mongoose.models.Article || mongoose.model('Article', ArticleSchema);
