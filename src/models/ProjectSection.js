import mongoose from 'mongoose';

const ProjectSectionSchema = new mongoose.Schema(
  {
    title: { type: String, default: 'Featured Works' },
    description: { type: String, default: 'A curated selection of my best projects' },
    viewAllText: { type: String, default: 'View All Projects' },
    viewAllLink: { type: String, default: '/projects' },
  },
  { timestamps: true }
);

ProjectSectionSchema.statics.getSettings = async function () {
  let settings = await this.findOne().lean();
  if (!settings) {
    settings = await this.create({});
    return settings.toObject();
  }
  return settings;
};

// Robust export pattern for HMR compatibility
let ProjectSection;
try {
  ProjectSection = mongoose.model('ProjectSection');
} catch (e) {
  ProjectSection = mongoose.model('ProjectSection', ProjectSectionSchema);
}

if (!ProjectSection.getSettings) {
  ProjectSection.getSettings = ProjectSectionSchema.statics.getSettings;
}

export default ProjectSection;
