import mongoose from 'mongoose';

const McpAuditLogSchema = new mongoose.Schema(
  {
    clientId: { type: String, required: true, index: true },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    tool: { type: String, required: true },
    params: { type: mongoose.Schema.Types.Mixed, default: {} },
    success: { type: Boolean, default: true },
    errorMessage: { type: String },
    responseSize: { type: Number },
    durationMs: { type: Number },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

McpAuditLogSchema.index({ createdAt: -1 });
McpAuditLogSchema.index({ clientId: 1, createdAt: -1 });

export default mongoose.models.McpAuditLog || mongoose.model('McpAuditLog', McpAuditLogSchema);
