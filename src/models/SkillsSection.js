import mongoose from 'mongoose';

const SkillsSectionSchema = new mongoose.Schema(
  {
    title: { type: String, default: 'Technical Skills' },
    description: {
      type: String,
      default: 'The technology stack and tools I use to bring ideas to life',
    },
  },
  { timestamps: true }
);

SkillsSectionSchema.statics.getSettings = async function () {
  let settings = await this.findOne().lean();
  if (!settings) {
    settings = await this.create({});
    return settings.toObject();
  }
  return settings;
};

// Robust export pattern for HMR compatibility
let SkillsSection;
try {
  SkillsSection = mongoose.model('SkillsSection');
} catch (e) {
  SkillsSection = mongoose.model('SkillsSection', SkillsSectionSchema);
}

if (!SkillsSection.getSettings) {
  SkillsSection.getSettings = SkillsSectionSchema.statics.getSettings;
}

export default SkillsSection;
