// src/models/MediaAsset.js
import mongoose from 'mongoose';

const MediaAssetSchema = new mongoose.Schema(
  {
    public_id: { type: String, required: true, unique: true }, // Essential for Cloudinary API
    url: { type: String, required: true },
    secure_url: { type: String, required: true },
    filename: { type: String },
    format: { type: String },
    size: { type: Number }, // in bytes
    width: { type: Number },
    height: { type: Number },
    source: { type: String, enum: ['upload', 'pollinations', 'gemini'], default: 'upload' },
    prompt: { type: String },
    aiDescription: { type: String },
    isIndexed: { type: Boolean, default: false },
    parentAssetIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'MediaAsset' }],
  },
  { timestamps: true }
);

export default mongoose.models.MediaAsset || mongoose.model('MediaAsset', MediaAssetSchema);
