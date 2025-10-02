// src/models/User.js
import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
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
    behance: String
  },
  skills: [{
    name: String,
    category: String,
    proficiency: { type: Number, min: 1, max: 10 }
  }],
  resume: {
    url: String,
    lastUpdated: Date
  }
}, { timestamps: true });

export default mongoose.models.User || mongoose.model('User', UserSchema);
