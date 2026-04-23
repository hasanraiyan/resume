import mongoose from 'mongoose';

const ConnectedAppSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    clientId: {
      type: String,
      required: true,
    },
    clientName: {
      type: String,
      default: 'Unknown App',
    },
    scope: {
      type: String,
      default: '',
    },
    resource: {
      type: String,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

ConnectedAppSchema.index({ userId: 1, clientId: 1 }, { unique: true });
ConnectedAppSchema.index({ createdAt: 1 });

export default mongoose.models.ConnectedApp || mongoose.model('ConnectedApp', ConnectedAppSchema);
