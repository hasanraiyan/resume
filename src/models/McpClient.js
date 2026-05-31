import mongoose from 'mongoose';

const McpClientSchema = new mongoose.Schema(
  {
    clientId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    clientName: {
      type: String,
      default: 'MCP Client',
    },
    redirectUris: {
      type: [String],
      default: [],
    },
    grantTypes: {
      type: [String],
      default: ['authorization_code'],
    },
    responseTypes: {
      type: [String],
      default: ['code'],
    },
    scope: {
      type: String,
      default: '',
    },
    tokenEndpointAuthMethod: {
      type: String,
      default: 'none',
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true }
);

export default mongoose.models.McpClient || mongoose.model('McpClient', McpClientSchema);
