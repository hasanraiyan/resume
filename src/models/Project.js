// src/models/Project.js
import mongoose from 'mongoose';

const ProjectSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  featured: { type: Boolean, default: false },
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
    demo: String
  },
  // Project details for detailed view
  details: {
    client: String,
    year: String,
    duration: String,
    role: String,
    challenge: String,
    solution: String,
    results: [String]
  },
  // You could add more models for images and tags if needed,
  // but for simplicity, we can start with embedded arrays.
  images: [{
    url: String,
    alt: String,
    caption: String,
  }],
  tags: [{
    name: String,
    category: String,
  }],
}, { timestamps: true });

// Create text index for full-text search
ProjectSchema.index({
  title: 'text',
  tagline: 'text',
  description: 'text',
  fullDescription: 'text',
  category: 'text',
  'tags.name': 'text'
});

export default mongoose.models.Project || mongoose.model('Project', ProjectSchema);
