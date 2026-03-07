import mongoose from 'mongoose';

const TestimonialSectionSchema = new mongoose.Schema(
  {
    title: { type: String, default: 'Client Testimonials' },
    description: { type: String, default: 'What my clients say about working with me' },
  },
  { timestamps: true }
);

TestimonialSectionSchema.statics.getSettings = async function () {
  let settings = await this.findOne().lean();
  if (!settings) {
    settings = await this.create({});
    return settings.toObject();
  }
  return settings;
};

// Robust export pattern for HMR compatibility
let TestimonialSection;
try {
  TestimonialSection = mongoose.model('TestimonialSection');
} catch (e) {
  TestimonialSection = mongoose.model('TestimonialSection', TestimonialSectionSchema);
}

if (!TestimonialSection.getSettings) {
  TestimonialSection.getSettings = TestimonialSectionSchema.statics.getSettings;
}

export default TestimonialSection;
