import mongoose from 'mongoose';

const ServiceSectionSchema = new mongoose.Schema(
  {
    title: { type: String, default: 'My Services' },
    description: { type: String, default: 'Specialized solutions for your digital needs' },
  },
  { timestamps: true }
);

ServiceSectionSchema.statics.getSettings = async function () {
  let settings = await this.findOne().lean();
  if (!settings) {
    settings = await this.create({});
    return settings.toObject();
  }
  return settings;
};

// Robust export pattern for HMR compatibility
let ServiceSection;
try {
  ServiceSection = mongoose.model('ServiceSection');
} catch (e) {
  ServiceSection = mongoose.model('ServiceSection', ServiceSectionSchema);
}

if (!ServiceSection.getSettings) {
  ServiceSection.getSettings = ServiceSectionSchema.statics.getSettings;
}

export default ServiceSection;
