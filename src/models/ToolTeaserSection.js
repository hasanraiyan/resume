import mongoose from 'mongoose';

const ToolTeaserSectionSchema = new mongoose.Schema(
  {
    imageAiTitle: { type: String, default: 'Try My AI Artist' },
    imageAiDescription: {
      type: String,
      default:
        'Experience the same AI technology I use for my projects. Describe anything, and watch it manifest in seconds.',
    },
    imageAiPlaceholder: { type: String, default: 'A futuristic city in a glass bottle...' },
    imageAiButtonText: { type: String, default: 'Enter full AI Creative Studio' },
    imageAiButtonLink: { type: String, default: '/tools/image-ai' },
  },
  { timestamps: true }
);

ToolTeaserSectionSchema.statics.getSettings = async function () {
  let settings = await this.findOne().lean();
  if (!settings) {
    settings = await this.create({});
    return settings.toObject();
  }
  return settings;
};

// Robust export pattern for HMR compatibility
let ToolTeaserSection;
try {
  ToolTeaserSection = mongoose.model('ToolTeaserSection');
} catch (e) {
  ToolTeaserSection = mongoose.model('ToolTeaserSection', ToolTeaserSectionSchema);
}

if (!ToolTeaserSection.getSettings) {
  ToolTeaserSection.getSettings = ToolTeaserSectionSchema.statics.getSettings;
}

export default ToolTeaserSection;
