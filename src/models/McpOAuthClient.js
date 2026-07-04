import mongoose from 'mongoose';

const McpOAuthClientSchema = new mongoose.Schema(
  {
    clientId: { type: String, required: true, unique: true, index: true },
    clientName: { type: String, default: 'MCP Client' },
    redirectUris: { type: [String], required: true },
    tokenEndpointAuthMethod: { type: String, default: 'none' },
  },
  { timestamps: true }
);

export default mongoose.models.McpOAuthClient ||
  mongoose.model('McpOAuthClient', McpOAuthClientSchema);
