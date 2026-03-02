import mongoose from 'mongoose';

const McpServerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'sse',
      enum: ['sse', 'stdio'],
    },
    url: {
      type: String,
      required: true,
      trim: true,
    },
    icon: {
      type: String,
      default: 'Server',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    color: {
      type: String,
      default: 'blue-500',
    },
    adminOnly: {
      type: Boolean,
      default: false,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.McpServer || mongoose.model('McpServer', McpServerSchema);
