import mongoose from 'mongoose';

const AnalyticsSchema = new mongoose.Schema({
  eventType: { type: String, required: true },
  path: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  sessionId: { type: String, required: true },
}, { timestamps: true });

export default mongoose.models.Analytics || mongoose.model('Analytics', AnalyticsSchema);