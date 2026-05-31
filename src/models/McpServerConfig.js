import mongoose from 'mongoose';

const McpServerConfigSchema = new mongoose.Schema(
  {
    serverKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    isEnabled: {
      type: Boolean,
      default: true,
    },
    disabledTools: {
      type: [String],
      default: [],
    },
    allowedScopes: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

export default mongoose.models.McpServerConfig ||
  mongoose.model('McpServerConfig', McpServerConfigSchema);
