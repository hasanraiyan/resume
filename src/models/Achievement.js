import mongoose from 'mongoose';

const AchievementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    src: { type: String, required: true },
    alt: { type: String, required: true },
    type: {
      type: String,
      enum: ['achievement', 'certification'],
      default: 'achievement',
      required: true,
    },
    displayOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Robust export pattern for HMR compatibility
const Achievement = mongoose.models.Achievement || mongoose.model('Achievement', AchievementSchema);
export default Achievement;
