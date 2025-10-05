import mongoose from 'mongoose';

const ArticleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true, index: true },
  excerpt: { type: String, required: true },
  coverImage: { type: String },
  content: { type: String, required: true },
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft',
    index: true
  },
  tags: [{ type: String }],
  publishedAt: { type: Date },
}, { timestamps: true });

// Set publishedAt when status changes to published
ArticleSchema.pre('save', function(next) {
  if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  next();
});

export default mongoose.models.Article || mongoose.model('Article', ArticleSchema);
