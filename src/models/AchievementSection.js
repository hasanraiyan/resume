import mongoose from 'mongoose';

const AchievementSectionSchema = new mongoose.Schema(
  {
    achievementTitle: { type: String, default: 'Achievements' },
    achievementDescription: { type: String, default: 'Milestones that inspire' },
    certificationTitle: { type: String, default: 'Certifications' },
    certificationDescription: {
      type: String,
      default: 'Continuous learning & professional growth',
    },
  },
  { timestamps: true }
);

AchievementSectionSchema.statics.getSettings = async function () {
  let settings = await this.findOne().lean();
  if (!settings) {
    settings = await this.create({});
    return settings.toObject();
  }
  return settings;
};

// Robust export pattern for HMR compatibility
let AchievementSection;
try {
  AchievementSection = mongoose.model('AchievementSection');
} catch (e) {
  AchievementSection = mongoose.model('AchievementSection', AchievementSectionSchema);
}

if (!AchievementSection.getSettings) {
  AchievementSection.getSettings = AchievementSectionSchema.statics.getSettings;
}

export default AchievementSection;
