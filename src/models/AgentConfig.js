import mongoose from 'mongoose';
import { AGENT_IDS } from '@/lib/constants/agents';

/**
 * AgentConfig Schema
 *
 * Centralized per-agent configuration preferences.
 * Instances of `BaseAgent` read their specific settings (e.g., `model`, `persona`) from this table upon initialization.
 */
const AgentConfigSchema = new mongoose.Schema(
  {
    agentId: {
      type: String,
      required: true,
      unique: true,
      enum: Object.values(AGENT_IDS),
    },
    providerId: {
      type: String,
      default: '',
    },
    model: {
      type: String,
      default: '',
    },
    summaryProviderId: {
      type: String,
      default: '',
    },
    summaryModel: {
      type: String,
      default: '',
    },
    persona: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Allows disabling/enabling default tools dynamically
    tools: {
      type: [String],
      default: [],
    },
    // Allows assigning specific MCP servers to the agent
    activeMCPs: {
      type: [String],
      default: [],
    },
    // Allows assigning specific Skills to the agent
    activeSkills: {
      type: [String],
      default: [],
    },
    // Optional Override settings
    rateLimitSettings: {
      requests: { type: Number },
      window: { type: Number },
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.AgentConfig || mongoose.model('AgentConfig', AgentConfigSchema);
