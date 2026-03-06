/**
 * Agent System Index
 *
 * Central export point for all agent-related modules.
 */

import agentRegistry from './AgentRegistry';
import { AGENT_IDS } from '../constants/agents';

// Constants
export {
  AGENT_IDS,
  AGENT_TYPES,
  AGENT_CATEGORIES,
  DEFAULT_AGENT_CONFIGS,
  AGENT_TOOLS,
  RATE_LIMIT_DEFAULTS,
  getAllAgentIds,
  getAllAgentTypes,
  getDefaultConfig,
  getAgentTools,
  getRateLimit,
} from '../constants/agents';

// Core Classes
export { default as BaseAgent } from './BaseAgent';
export { default as AgentRegistry } from './AgentRegistry';
export { default as AgentManager } from './AgentManager';

// Agent Implementations
import AIImageAgent from './ai/ai-image-agent';
import ImageGeneratorAgent from './ai/image-generator-agent';
import ImageEditorAgent from './ai/image-editor-agent';
import ImageEmbedderAgent from './ai/image-embedder-agent';
import VisualSearchAgent from './ai/visual-search-agent';
import BlogWriterAgent from './ai/blog-writer-agent';
import PresentationAgent from './ai/presentation-agent';
import ChatAgent from './ai/chat-assistant-agent';

// Register agent classes into the registry
agentRegistry.register(AGENT_IDS.IMAGE_ANALYZER, AIImageAgent);
agentRegistry.register(AGENT_IDS.CHAT_FAST, ChatAgent);
agentRegistry.register(AGENT_IDS.CHAT_PRO, ChatAgent);
agentRegistry.register(AGENT_IDS.CHAT_THINKING, ChatAgent);
agentRegistry.register(AGENT_IDS.IMAGE_GENERATOR, ImageGeneratorAgent);
agentRegistry.register(AGENT_IDS.IMAGE_EDITOR, ImageEditorAgent);
agentRegistry.register(AGENT_IDS.IMAGE_EMBEDDER, ImageEmbedderAgent);
agentRegistry.register(AGENT_IDS.VISUAL_SEARCH, VisualSearchAgent);
agentRegistry.register(AGENT_IDS.BLOG_WRITER, BlogWriterAgent);
agentRegistry.register(AGENT_IDS.PRESENTATION_SYNTHESIZER, PresentationAgent);

export {
  AIImageAgent,
  ChatAgent,
  ImageGeneratorAgent,
  ImageEditorAgent,
  ImageEmbedderAgent,
  VisualSearchAgent,
  BlogWriterAgent,
  PresentationAgent,
};
export default agentRegistry;
