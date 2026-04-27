import mongoose from 'mongoose';

const AppConnectionSchema = new mongoose.Schema(
  {
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    appKey: {
      type: String,
      required: true,
      index: true,
    },
    channel: {
      type: String,
      required: true,
      index: true,
    },
    connectionType: {
      type: String,
      default: 'session',
      index: true,
    },
    connectionKey: {
      type: String,
      required: true,
    },
    clientId: {
      type: String,
      default: null,
    },
    clientName: {
      type: String,
      default: 'Unknown Connection',
    },
    scope: {
      type: String,
      default: '',
    },
    resource: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ['active', 'revoked'],
      default: 'active',
      index: true,
    },
    lastUsedAt: {
      type: Date,
      default: null,
    },
    revokedAt: {
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

AppConnectionSchema.index({ ownerId: 1, appKey: 1, lastUsedAt: -1 });
AppConnectionSchema.index({ ownerId: 1, connectionKey: 1 }, { unique: true });

export default mongoose.models.AppConnection ||
  mongoose.model('AppConnection', AppConnectionSchema);
