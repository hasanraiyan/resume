/**
 * Agent System Constants
 *
 * Centralized definitions for all AI agents in the system.
 * Use these constants for consistent agent identification and configuration.
 */

/**
 * Unique Agent IDs
 * Each agent must have a unique ID for tracking and configuration.
 */
export const AGENT_IDS = {
  // Media & Image Agents
  IMAGE_ANALYZER: 'image_analyzer',
  IMAGE_GENERATOR: 'image_generator',
  IMAGE_EDITOR: 'image_editor',
  IMAGE_EMBEDDER: 'image_embedder',
  VISUAL_SEARCH: 'visual_search',

  // Chat & Conversation Agents
  CHAT_FAST: 'chat_fast',
  CHAT_PRO: 'chat_pro',
  CHAT_THINKING: 'chat_thinking',
  CONTACT_FORM_ASSISTANT: 'contact_form_assistant',
  TELEGRAM_ASSISTANT: 'telegram_assistant',
  WHATSAPP_ASSISTANT: 'whatsapp_assistant',

  // Content Agents
  BLOG_WRITER: 'blog_writer',
  CODE_REPORTER: 'code_reporter',
  ISSUE_MANAGER: 'issue_manager',
  PRESENTATION_SYNTHESIZER: 'presentation_synthesizer',

  // Analytics Agents
  ANALYTICS_TRACKER: 'analytics_tracker',
  ENGAGEMENT_ANALYZER: 'engagement_analyzer',

  // Finance
  FINANCE_ASSISTANT: 'finance_assistant',

  // Tools / Apps
  APP_BUILDER: 'app_builder',

  // Integrations
};

/**
 * Agent Types
 * Categories for grouping agents by functionality.
 */
export const AGENT_TYPES = {
  MEDIA: 'media',
  CHAT: 'chat',
  CONTENT: 'content',
  ANALYTICS: 'analytics',
  UTILITY: 'utility',
};

/**
 * Agent Categories
 * More specific categorization within types.
 */

export const AGENT_CATEGORIES = {
  // Media
  IMAGE_PROCESSING: 'image_processing',
  VECTOR_EMBEDDING: 'vector_embedding',
  GENERATIVE_ART: 'generative_art',

  // Chat
  CONVERSATIONAL: 'conversational',
  TASK_ORIENTED: 'task_oriented',

  // Content
  WRITING: 'writing',
  CODE_ANALYSIS: 'code_analysis',
  PROJECT_MANAGEMENT: 'project_management',

  // Analytics
  TRACKING: 'tracking',
  INSIGHTS: 'insights',
};

/**
 * Default Agent Configurations
 * Baseline settings for each agent type.
 */
export const DEFAULT_AGENT_CONFIGS = {
  [AGENT_IDS.IMAGE_ANALYZER]: {
    name: 'Media Analyzer',
    description: 'Analyzes and indexes images with AI-generated descriptions',
    type: AGENT_TYPES.MEDIA,
    category: AGENT_CATEGORIES.IMAGE_PROCESSING,
    icon: 'Sparkles',
    defaultModel: 'gemini-1.5-flash',
    defaultProvider: 'google',
    persona:
      'You are a Professional Visual Content Analyst. Provide a highly detailed, comprehensive description of this image. For maximum semantic search (RAG) performance, include: 1. Core Subject: Exactly what is in the image. 2. Style: Is it a photo, anime, 3D render, oil painting, or sketch? 3. Composition: Foreground/background elements, lighting, and camera angle. 4. Color Palette: Dominant and accent colors. 5. Mood/Atmosphere: Vibrant, dark, futuristic, calm, etc. 6. Fine Details: Textures, materials, and any specific text or symbols visible. Aim for a rich narrative that captures the essence of the visual.',
    maxTokens: 800,
    isActive: true,
  },
  [AGENT_IDS.IMAGE_GENERATOR]: {
    name: 'Creative Studio',
    description: 'Generates images from text prompts',
    type: AGENT_TYPES.MEDIA,
    category: AGENT_CATEGORIES.GENERATIVE_ART,
    icon: 'Wand2',
    defaultModel: 'gemini-1.5-flash',
    defaultProvider: 'google',
    persona: 'You are a Creative AI. Focus on high-fidelity image generation.',
    isActive: true,
  },
  [AGENT_IDS.IMAGE_EDITOR]: {
    name: 'Image Editor',
    description: 'Edits existing images based on text instructions',
    type: AGENT_TYPES.MEDIA,
    category: AGENT_CATEGORIES.IMAGE_PROCESSING,
    icon: 'ImageEdit',
    defaultModel: 'gemini-1.5-flash',
    defaultProvider: 'google',
    persona: 'You are an AI Image Editor. Make precise edits while preserving image quality.',
    isActive: true,
  },
  [AGENT_IDS.IMAGE_EMBEDDER]: {
    name: 'Image Embedder',
    description: 'Generates vector embeddings for text and images',
    type: AGENT_TYPES.MEDIA,
    category: AGENT_CATEGORIES.VECTOR_EMBEDDING,
    icon: 'Network',
    defaultModel: 'gemini-embedding-001',
    defaultProvider: 'google',
    isActive: true,
  },
  [AGENT_IDS.VISUAL_SEARCH]: {
    name: 'Visual Search',
    description: 'Enables semantic search across visual media',
    type: AGENT_TYPES.MEDIA,
    category: AGENT_CATEGORIES.VECTOR_EMBEDDING,
    icon: 'Search',
    defaultModel: 'text-embedding-3-small',
    defaultProvider: 'openai',
    isActive: true,
  },
  [AGENT_IDS.PRESENTATION_SYNTHESIZER]: {
    name: 'Presentation Synthesizer',
    description: 'Synthesizes professional presentations with visually rich slides',
    type: AGENT_TYPES.CONTENT,
    category: AGENT_CATEGORIES.PROJECT_MANAGEMENT,
    icon: 'Presentation',
    defaultModel: 'gemini-1.5-pro',
    defaultProvider: 'google',
    persona:
      'You are an elite Presentation Synthesizer agent. Your job is to research topics thoroughly, design logically structured presentation outlines, and ultimately translate dense text into visually stunning, complete slide images.',
    isActive: true,
  },
  [AGENT_IDS.CHAT_FAST]: {
    name: 'Chat Fast',
    description: 'Fast and efficient chat (optimized for speed/cost)',
    type: AGENT_TYPES.CHAT,
    category: AGENT_CATEGORIES.CONVERSATIONAL,
    icon: 'Zap',
    defaultModel: 'gpt-4o-mini',
    defaultProvider: 'openai',
    isActive: true,
  },
  [AGENT_IDS.CHAT_PRO]: {
    name: 'Chat Pro',
    description: 'High-quality intelligent chat (optimized for accuracy)',
    type: AGENT_TYPES.CHAT,
    category: AGENT_CATEGORIES.CONVERSATIONAL,
    icon: 'Award',
    defaultModel: 'gpt-4o',
    defaultProvider: 'openai',
    isActive: true,
  },
  [AGENT_IDS.CHAT_THINKING]: {
    name: 'Chat Thinking',
    description: 'Deep reasoning chat (optimized for complex logic)',
    type: AGENT_TYPES.CHAT,
    category: AGENT_CATEGORIES.CONVERSATIONAL,
    icon: 'Brain',
    defaultModel: 'o1-preview',
    defaultProvider: 'openai',
    isActive: true,
  },
  [AGENT_IDS.CONTACT_FORM_ASSISTANT]: {
    name: 'Contact Assistant',
    description: 'Helps users create and submit contact forms',
    type: AGENT_TYPES.CHAT,
    category: AGENT_CATEGORIES.TASK_ORIENTED,
    icon: 'Mail',
    defaultModel: 'gpt-4o',
    defaultProvider: 'openai',
    isActive: true,
  },
  [AGENT_IDS.TELEGRAM_ASSISTANT]: {
    name: 'Telegram Assistant',
    description: 'Dedicated agent for handling Telegram interactions',
    type: AGENT_TYPES.CHAT,
    category: AGENT_CATEGORIES.CONVERSATIONAL,
    icon: 'Send',
    defaultModel: 'gpt-4o',
    defaultProvider: 'openai',
    persona: '', // Driven by UI configuration
    isActive: true,
  },
  [AGENT_IDS.WHATSAPP_ASSISTANT]: {
    name: 'WhatsApp Assistant',
    description: 'Dedicated agent for handling WhatsApp interactions',
    type: AGENT_TYPES.CHAT,
    category: AGENT_CATEGORIES.CONVERSATIONAL,
    icon: 'MessageCircle',
    defaultModel: 'gpt-4o',
    defaultProvider: 'openai',
    persona: '', // Driven by UI configuration
    isActive: true,
  },
  [AGENT_IDS.BLOG_WRITER]: {
    name: 'Blog Writer',
    description: 'Assists in writing and structuring blog posts',
    type: AGENT_TYPES.CONTENT,
    category: AGENT_CATEGORIES.WRITING,
    icon: 'PenTool',
    defaultModel: 'gpt-4o',
    defaultProvider: 'openai',
    isActive: true,
  },
  [AGENT_IDS.CODE_REPORTER]: {
    name: 'Code Reporter',
    description: 'Analyzes code and generates reports',
    type: AGENT_TYPES.CONTENT,
    category: AGENT_CATEGORIES.CODE_ANALYSIS,
    icon: 'FileCode',
    defaultModel: 'gpt-4o',
    defaultProvider: 'openai',
    isActive: true,
  },
  [AGENT_IDS.ISSUE_MANAGER]: {
    name: 'Issue Manager',
    description: 'Manages and tracks project issues',
    type: AGENT_TYPES.CONTENT,
    category: AGENT_CATEGORIES.PROJECT_MANAGEMENT,
    icon: 'CircleAlert',
    defaultModel: 'gpt-4o',
    defaultProvider: 'openai',
    isActive: true,
  },
  [AGENT_IDS.ANALYTICS_TRACKER]: {
    name: 'Analytics Tracker',
    description: 'Tracks and records user interactions',
    type: AGENT_TYPES.ANALYTICS,
    category: AGENT_CATEGORIES.TRACKING,
    icon: 'BarChart3',
    isActive: true,
  },
  [AGENT_IDS.ENGAGEMENT_ANALYZER]: {
    name: 'Engagement Analyzer',
    description: 'Analyzes user engagement patterns',
    type: AGENT_TYPES.ANALYTICS,
    category: AGENT_CATEGORIES.INSIGHTS,
    icon: 'TrendingUp',
    isActive: true,
  },
  [AGENT_IDS.APP_BUILDER]: {
    name: 'App Builder',
    description: 'Generates standalone HTML/JS web applications using LangGraph state.',
    type: AGENT_TYPES.CONTENT,
    category: AGENT_CATEGORIES.CODE_ANALYSIS,
    icon: 'TerminalSquare',
    defaultModel: 'gpt-4o',
    defaultProvider: 'openai',
    persona: `You are an elite App Builder agent. Your job is to generate complete, single-file HTML/JS/CSS applications. You must use modern CDNs like TailwindCSS for styling and ensure the app is fully functional and responsive. You work iteratively: first plan out the app structure, then generate the code, and finally review it for correctness.`,
    isActive: true,
  },
  [AGENT_IDS.FINANCE_ASSISTANT]: {
    name: 'Finance Assistant',
    description: 'Personal finance analyst for the MyMoney workspace',
    type: AGENT_TYPES.ANALYTICS,
    category: AGENT_CATEGORIES.INSIGHTS,
    icon: 'DollarSign',
    defaultModel: 'gpt-4o',
    defaultProvider: 'openai',
    persona: `You are a professional Finance Assistant embedded in the MyMoney personal finance application. Your role is to help users understand their finances, answer questions about their transactions, and provide insights.

KEY BEHAVIORS:
1. Be concise, professional, and helpful.
2. Always ground your answers in the user's actual financial data when available.
3. Use clear formatting: bullet points, short paragraphs, and tables when appropriate.
4. If you don't have access to specific data, say so honestly rather than making up numbers.
5. Provide actionable insights, not just raw data.
6. When discussing expenses, use the Indian Rupee (₹) format.
7. Keep responses focused and avoid unnecessary verbosity.

YOU ARE NOT a generic finance chatbot. You are a specialized assistant for THIS user's personal finances.`,
    isActive: true,
  },
};

/**
 * Agent Tools Mapping
 * Defines which tools each agent has access to.
 */
export const AGENT_TOOLS = {
  [AGENT_IDS.IMAGE_ANALYZER]: ['vision', 'tagging', 'description'],
  [AGENT_IDS.IMAGE_GENERATOR]: ['image_generation', 'variation'],
  [AGENT_IDS.IMAGE_EDITOR]: ['image_editing', 'inpainting', 'outpainting'],
  [AGENT_IDS.IMAGE_EMBEDDER]: ['text_embedding', 'image_embedding'],
  [AGENT_IDS.VISUAL_SEARCH]: ['vector_search', 'similarity_match'],
  [AGENT_IDS.CHAT_FAST]: ['conversation', 'tool_use', 'generative_ui'],
  [AGENT_IDS.CHAT_PRO]: ['conversation', 'tool_use', 'generative_ui'],
  [AGENT_IDS.CHAT_THINKING]: ['conversation', 'tool_use', 'generative_ui'],
  [AGENT_IDS.CONTACT_FORM_ASSISTANT]: ['form_handling', 'validation', 'submission'],
  [AGENT_IDS.TELEGRAM_ASSISTANT]: [], // Tools configured dynamically via UI
  [AGENT_IDS.WHATSAPP_ASSISTANT]: [], // Tools configured dynamically via UI
  [AGENT_IDS.BLOG_WRITER]: ['writing', 'editing', 'seo_optimization'],
  [AGENT_IDS.CODE_REPORTER]: ['code_analysis', 'documentation', 'reporting'],
  [AGENT_IDS.ISSUE_MANAGER]: ['issue_tracking', 'template_generation', 'assignment'],
  [AGENT_IDS.PRESENTATION_SYNTHESIZER]: ['research', 'outline_generation', 'slide_synthesis'],
  [AGENT_IDS.ANALYTICS_TRACKER]: ['event_tracking', 'session_management'],
  [AGENT_IDS.ENGAGEMENT_ANALYZER]: ['pattern_recognition', 'insights_generation'],
  [AGENT_IDS.APP_BUILDER]: ['planning', 'html_generation', 'code_review'],
  [AGENT_IDS.FINANCE_ASSISTANT]: ['conversation'],
};

/**
 * Rate Limit Defaults
 * Default rate limits per agent (requests per minute).
 */
export const RATE_LIMIT_DEFAULTS = {
  [AGENT_IDS.IMAGE_ANALYZER]: { requests: 10, window: 60 },
  [AGENT_IDS.IMAGE_GENERATOR]: { requests: 5, window: 60 },
  [AGENT_IDS.IMAGE_EDITOR]: { requests: 5, window: 60 },
  [AGENT_IDS.IMAGE_EMBEDDER]: { requests: 20, window: 60 },
  [AGENT_IDS.VISUAL_SEARCH]: { requests: 30, window: 60 },
  [AGENT_IDS.CHAT_FAST]: { requests: 20, window: 60 },
  [AGENT_IDS.CHAT_PRO]: { requests: 10, window: 60 },
  [AGENT_IDS.CHAT_THINKING]: { requests: 5, window: 60 },
  [AGENT_IDS.CONTACT_FORM_ASSISTANT]: { requests: 10, window: 60 },
  [AGENT_IDS.TELEGRAM_ASSISTANT]: { requests: 20, window: 60 },
  [AGENT_IDS.WHATSAPP_ASSISTANT]: { requests: 20, window: 60 },
  [AGENT_IDS.BLOG_WRITER]: { requests: 10, window: 60 },
  [AGENT_IDS.CODE_REPORTER]: { requests: 10, window: 60 },
  [AGENT_IDS.ISSUE_MANAGER]: { requests: 15, window: 60 },
  [AGENT_IDS.PRESENTATION_SYNTHESIZER]: { requests: 5, window: 60 },
  [AGENT_IDS.ANALYTICS_TRACKER]: { requests: 100, window: 60 },
  [AGENT_IDS.ENGAGEMENT_ANALYZER]: { requests: 30, window: 60 },
  [AGENT_IDS.APP_BUILDER]: { requests: 10, window: 60 },
  [AGENT_IDS.FINANCE_ASSISTANT]: { requests: 10, window: 60 },
};

/**
 * Helper to get all agent IDs
 */
export const getAllAgentIds = () => Object.values(AGENT_IDS);

/**
 * Helper to get all agent types
 */
export const getAllAgentTypes = () => Object.values(AGENT_TYPES);

/**
 * Helper to get default config for an agent
 */
export const getDefaultConfig = (agentId) => DEFAULT_AGENT_CONFIGS[agentId] || null;

/**
 * Helper to get tools for an agent
 */
export const getAgentTools = (agentId) => AGENT_TOOLS[agentId] || [];

/**
 * Helper to get rate limit for an agent
 */
export const getRateLimit = (agentId) =>
  RATE_LIMIT_DEFAULTS[agentId] || { requests: 10, window: 60 };
