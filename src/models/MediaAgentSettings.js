import mongoose from 'mongoose';
import {
  AGENT_IDS,
  AGENT_TYPES,
  AGENT_CATEGORIES,
  DEFAULT_AGENT_CONFIGS,
} from '@/lib/constants/agents';

const AgentProfileSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    enum: Object.values(AGENT_IDS),
  },
  name: {
    type: String,
    required: true,
  },
  description: String,
  icon: String,
  type: {
    type: String,
    enum: Object.values(AGENT_TYPES),
    default: AGENT_TYPES.UTILITY,
  },
  category: {
    type: String,
    enum: Object.values(AGENT_CATEGORIES),
  },
  providerId: {
    type: String,
    default: '',
  },
  model: {
    type: String,
    default: '',
  },
  embeddingProviderId: {
    type: String,
    default: '',
  },
  embeddingModel: {
    type: String,
    default: '',
  },
  generationProviderId: {
    type: String,
    default: '',
  },
  generationModel: {
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
  tools: {
    type: [String],
    default: [],
  },
  rateLimit: {
    requests: {
      type: Number,
      default: 10,
    },
    window: {
      type: Number,
      default: 60, // seconds
    },
  },
  metadata: {
    type: Map,
    of: String,
    default: {},
  },
});

const MediaAgentSettingsSchema = new mongoose.Schema(
  {
    // Scalable list of agents
    agents: [AgentProfileSchema],

    // Global Media Settings
    qdrantCollection: {
      type: String,
      default: 'media_assets',
    },
    isProcessing: {
      type: Boolean,
      default: false,
    },
    processingStartedAt: {
      type: Date,
    },

    // Legacy support (fallbacks)
    providerId: String,
    model: String,
    generationProviderId: String,
    generationModel: String,
    embeddingProviderId: String,
    embeddingModel: String,
    persona: String,
  },
  {
    timestamps: true,
  }
);

// Singleton pattern & model initialization
MediaAgentSettingsSchema.pre('save', async function (next) {
  if (this.isNew) {
    const existing = await mongoose.models.MediaAgentSettings.findOne({});
    if (existing) {
      // If we're trying to save a new one but one already exists,
      // merge the data into the existing one.
      const data = this.toObject();
      delete data._id;
      Object.assign(existing, data);
      await existing.save();
      return next(new Error('MediaAgentSettings already exists. Use findOneAndUpdate instead.'));
    }
  }
  next();
});

// Helper to seed default agents if none exist
MediaAgentSettingsSchema.methods.ensureDefaultAgents = function () {
  const defaults = [
    {
      id: AGENT_IDS.IMAGE_ANALYZER,
      name: DEFAULT_AGENT_CONFIGS[AGENT_IDS.IMAGE_ANALYZER].name,
      description: DEFAULT_AGENT_CONFIGS[AGENT_IDS.IMAGE_ANALYZER].description,
      icon: DEFAULT_AGENT_CONFIGS[AGENT_IDS.IMAGE_ANALYZER].icon,
      type: DEFAULT_AGENT_CONFIGS[AGENT_IDS.IMAGE_ANALYZER].type,
      category: DEFAULT_AGENT_CONFIGS[AGENT_IDS.IMAGE_ANALYZER].category,
      persona: DEFAULT_AGENT_CONFIGS[AGENT_IDS.IMAGE_ANALYZER].persona,
      isActive: true,
    },
    {
      id: AGENT_IDS.IMAGE_GENERATOR,
      name: DEFAULT_AGENT_CONFIGS[AGENT_IDS.IMAGE_GENERATOR].name,
      description: DEFAULT_AGENT_CONFIGS[AGENT_IDS.IMAGE_GENERATOR].description,
      icon: DEFAULT_AGENT_CONFIGS[AGENT_IDS.IMAGE_GENERATOR].icon,
      type: DEFAULT_AGENT_CONFIGS[AGENT_IDS.IMAGE_GENERATOR].type,
      category: DEFAULT_AGENT_CONFIGS[AGENT_IDS.IMAGE_GENERATOR].category,
      persona: DEFAULT_AGENT_CONFIGS[AGENT_IDS.IMAGE_GENERATOR].persona,
      isActive: true,
    },
    {
      id: AGENT_IDS.VISUAL_SEARCH,
      name: DEFAULT_AGENT_CONFIGS[AGENT_IDS.VISUAL_SEARCH].name,
      description: DEFAULT_AGENT_CONFIGS[AGENT_IDS.VISUAL_SEARCH].description,
      icon: DEFAULT_AGENT_CONFIGS[AGENT_IDS.VISUAL_SEARCH].icon,
      type: DEFAULT_AGENT_CONFIGS[AGENT_IDS.VISUAL_SEARCH].type,
      category: DEFAULT_AGENT_CONFIGS[AGENT_IDS.VISUAL_SEARCH].category,
      isActive: true,
    },
    {
      id: AGENT_IDS.CHAT_ASSISTANT,
      name: DEFAULT_AGENT_CONFIGS[AGENT_IDS.CHAT_ASSISTANT].name,
      description: DEFAULT_AGENT_CONFIGS[AGENT_IDS.CHAT_ASSISTANT].description,
      icon: DEFAULT_AGENT_CONFIGS[AGENT_IDS.CHAT_ASSISTANT].icon,
      type: DEFAULT_AGENT_CONFIGS[AGENT_IDS.CHAT_ASSISTANT].type,
      category: DEFAULT_AGENT_CONFIGS[AGENT_IDS.CHAT_ASSISTANT].category,
      isActive: true,
    },
  ];

  defaults.forEach((def) => {
    if (!this.agents.find((a) => a.id === def.id)) {
      this.agents.push(def);
    }
  });
};

export default mongoose.models.MediaAgentSettings ||
  mongoose.model('MediaAgentSettings', MediaAgentSettingsSchema);
