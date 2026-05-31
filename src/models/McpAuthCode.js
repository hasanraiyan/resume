import mongoose from 'mongoose';

const McpAuthCodeSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
    },
    serverKey: {
      type: String,
      required: true,
      index: true,
    },
    clientId: {
      type: String,
      required: true,
    },
    clientName: {
      type: String,
      default: 'MCP Client',
    },
    redirectUri: {
      type: String,
      required: true,
    },
    scope: {
      type: String,
      default: '',
    },
    codeChallenge: {
      type: String,
      default: null,
    },
    codeChallengeMethod: {
      type: String,
      default: 'plain',
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
    usedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.models.McpAuthCode || mongoose.model('McpAuthCode', McpAuthCodeSchema);
