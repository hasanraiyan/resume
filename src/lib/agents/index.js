/**
 * Agent System Index
 *
 * Central export point for all agent-related modules.
 */

import AgentRegistry from './AgentRegistry';
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
import AIImageAgent, { aiImageAgent } from './ai/ai-image-agent';
import ChatAssistantAgent, { chatAssistantAgent } from './ai/chat-assistant-agent';
import ImageGeneratorAgent, { imageGeneratorAgent } from './ai/image-generator-agent';
import ImageEditorAgent, { imageEditorAgent } from './ai/image-editor-agent';

export { AIImageAgent, aiImageAgent };
export { ChatAssistantAgent, chatAssistantAgent };
export { ImageGeneratorAgent, imageGeneratorAgent };
export { ImageEditorAgent, imageEditorAgent };

// Auto-register agents instances into the registry for runtime execution
AgentRegistry.register(AGENT_IDS.IMAGE_ANALYZER, AIImageAgent);
AgentRegistry.register(AGENT_IDS.CHAT_ASSISTANT, ChatAssistantAgent);
AgentRegistry.register(AGENT_IDS.IMAGE_GENERATOR, ImageGeneratorAgent);
AgentRegistry.register(AGENT_IDS.IMAGE_EDITOR, ImageEditorAgent);
