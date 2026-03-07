import mongoose from 'mongoose';

const agentExecutionLogSchema = new mongoose.Schema(
  {
    agentId: {
      type: String,
      required: true,
      index: true,
    },
    providerId: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ['success', 'error'],
      required: true,
    },
    durationMs: {
      type: Number,
      required: false,
    },
    errorMessage: {
      type: String,
      required: false,
    },
  },
  { timestamps: true } // Auto-manages createdAt (which will act as our timestamp) and updatedAt
);

// Indexes for faster aggregation queries (e.g., getting counts by agentId over a date range)
agentExecutionLogSchema.index({ agentId: 1, createdAt: -1 });

export default mongoose.models.AgentExecutionLog ||
  mongoose.model('AgentExecutionLog', agentExecutionLogSchema);
