import mongoose from 'mongoose';

const SkillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    displayName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 1024,
    },
    content: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      default: 'general',
      enum: ['general', 'coding', 'writing', 'data', 'research', 'design', 'devops', 'other'],
    },
    icon: {
      type: String,
      default: 'Wrench',
    },
    color: {
      type: String,
      default: 'purple-500',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    adminOnly: {
      type: Boolean,
      default: false,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    allowedTools: {
      type: [String],
      default: [],
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Skill || mongoose.model('Skill', SkillSchema);
