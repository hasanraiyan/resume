import mongoose from 'mongoose';

const McpOAuthCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    clientId: { type: String, required: true },
    redirectUri: { type: String, required: true },
    resource: { type: String, required: true },
    scope: { type: String, default: '' },
    codeChallenge: { type: String, required: true },
    codeChallengeMethod: { type: String, default: 'S256' },
    ownerId: { type: String, required: true },
    consumedAt: { type: Date, default: null },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Authorization codes are single-use and short-lived; let Mongo reap them automatically.
McpOAuthCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.McpOAuthCode || mongoose.model('McpOAuthCode', McpOAuthCodeSchema);
