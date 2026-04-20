import mongoose from 'mongoose';

const McpClientSchema = new mongoose.Schema(
  {
    clientId: { type: String, required: true, unique: true },
    clientName: { type: String, default: 'MCP Client' },
    redirectUris: [{ type: String }],
    grantTypes: [{ type: String }],
    responseTypes: [{ type: String }],
    tokenEndpointAuthMethod: { type: String, default: 'none' },
    scope: { type: String, default: '' },
  },
  { timestamps: true }
);

export default mongoose.models.McpClient || mongoose.model('McpClient', McpClientSchema);
