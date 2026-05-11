import mongoose from 'mongoose';

const DeviceAuthSchema = new mongoose.Schema(
  {
    deviceCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    userCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'authorized', 'denied', 'expired'],
      default: 'pending',
    },
    ownerId: {
      type: String,
      default: null,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // TTL index
    },
    lastCheckedAt: {
      type: Date,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.models.DeviceAuth || mongoose.model('DeviceAuth', DeviceAuthSchema);
