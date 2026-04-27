import mongoose from 'mongoose';

const McpAuthCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  clientId: { type: String, required: true },
  ownerId: { type: String, required: true, index: true },
  connectionId: { type: String, required: true, index: true },
  redirectUri: { type: String, required: true },
  codeChallenge: { type: String, required: true },
  codeChallengeMethod: { type: String, default: 'S256' },
  scope: { type: String, default: '' },
  state: { type: String },
  resource: { type: String },
  expiresAt: { type: Date, required: true },
});

McpAuthCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.models.McpAuthCode || mongoose.model('McpAuthCode', McpAuthCodeSchema);
