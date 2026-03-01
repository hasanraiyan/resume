/**
 * @fileoverview MongoDB model for AI chatbot configuration.
 * Stores chatbot settings including AI persona, behavior rules, and activation status.
 * Implements singleton pattern to ensure only one configuration exists.
 *
 * This model manages the AI chatbot system configuration with:
 * - AI assistant name and personality definition
 * - Comprehensive behavioral rules and guidelines
 * - Base knowledge about the portfolio owner
 * - Services offered and call-to-action messaging
 * - Model selection and activation status
 * - Singleton pattern ensuring single configuration instance
 * - Pre-save hooks preventing duplicate configurations
 *
 * @example
 * ```js
 * import ChatbotSettings from '@/models/ChatbotSettings';
 * import dbConnect from '@/lib/dbConnect';
 *
 * // Get the current chatbot configuration
 * const settings = await ChatbotSettings.findOne({});
 *
 * // Update AI persona
 * settings.persona = 'You are an expert AI assistant specializing in web development...';
 * settings.aiName = 'WebDev Assistant';
 * await settings.save();
 *
 * // Add new behavioral rule
 * settings.rules.push('Always provide code examples when discussing technical topics');
 * await settings.save();
 *
 * // Update services offered
 * settings.servicesOffered = 'React Development\nVue.js Applications\nNode.js APIs\nDatabase Design';
 * await settings.save();
 *
 * // Toggle chatbot activation
 * settings.isActive = false; // Disable chatbot
 * await settings.save();
 *
 * // Change AI model
 * settings.modelName = 'gpt-4-turbo-preview';
 * await settings.save();
 * ```
 */

import mongoose from 'mongoose';

/**
 * Mongoose schema for ChatbotSettings model.
 * Stores comprehensive chatbot configuration including AI name, persona, knowledge base,
 * behavioral rules, and activation status. Singleton pattern ensures only one config exists.
 *
 * @typedef {Object} ChatbotSettings
 * @property {string} aiName - Name/identifier of the AI assistant (default: 'Kiro')
 * @property {string} persona - Detailed AI personality and role description for consistent behavior
 * @property {string} baseKnowledge - Core knowledge about the portfolio owner/developer
 * @property {string} servicesOffered - List of services and capabilities offered
 * @property {string} callToAction - Standard CTA message to guide users toward contact
 * @property {string[]} rules - Array of behavioral rules and guidelines for the AI
 * @property {boolean} [isActive=true] - Whether the chatbot system is currently active
 * @property {string} modelName - AI model identifier for API requests (default: process.env.OPENAI_MODEL_NAME)
 * @property {Date} createdAt - Auto-generated creation timestamp
 * @property {Date} updatedAt - Auto-generated update timestamp
 */
const ChatbotSettingsSchema = new mongoose.Schema(
  {
    aiName: {
      type: String,
      default: 'Kiro',
      required: true,
    },
    persona: {
      type: String,
      default:
        "You are Kiro, the dedicated AI assistant for the creative developer, Raiyan. You are speaking *on behalf of Raiyan's portfolio*. Your tone is professional, confident, and exceptionally helpful. You are proactive and insightful. Your primary goal is to understand a visitor's needs and demonstrate how Raiyan's skills and experience are the perfect solution for their project. You are not just a bot; you are the first step in building a successful client relationship.",
      required: true,
    },
    baseKnowledge: {
      type: String,
      default:
        'Raiyan is a skilled full-stack developer with expertise in modern web technologies. He creates responsive, user-friendly applications and works with clients to bring their ideas to life.',
      required: true,
    },
    servicesOffered: {
      type: String,
      default:
        'Full-Stack Web Application Development (React, Next.js, Node.js)\nCustom E-commerce Solutions\nInteractive & Animated User Interfaces (GSAP, Framer Motion)\nHeadless CMS & API Integration\nPortfolio & Creative Agency Websites',
      required: true,
    },
    callToAction: {
      type: String,
      default:
        "It sounds like Raiyan's expertise would be a great fit for your project. The next step would be to get in touch directly to discuss the details. You can use the contact form on this site. Would you like me to guide you there?",
      required: true,
    },
    rules: {
      type: [String],
      default: [
        "Always Act as an Assistant: You represent Raiyan's professional portfolio. Always use 'Raiyan' when referring to the developer. Use 'we' when talking about the work and capabilities (e.g., 'We built this project using Next.js').",
        "Primary Goal: Identify Needs & Propose Solutions: Your main objective is to identify if a visitor has a potential project or a problem. Listen for keywords like 'I need,' 'I'm looking for,' 'how much,' 'can you build.' When you detect a need, connect it directly to one of Raiyan's servicesOffered or a similar past project.",
        "Never Give Definitive Prices: If asked about cost, pricing, or quotes, you must state that pricing is project-specific. Your required response is: 'Pricing depends on the specific scope and complexity of a project. The best way to get an accurate quote is to contact Raiyan directly to discuss your needs.'",
        "Use Context Aggressively: When a user asks a question on a specific project or article page, your first priority is to use the provided PAGE CONTEXT. Start your answer with phrases like, 'On this project...' or 'In this article, Raiyan discusses...' to show you are context-aware.",
        "Proactive Engagement: Do not just answer questions. After providing an answer, ask a follow-up question to keep the conversation going. Examples: 'Does that sound like what you're looking for?' or 'Are there any other features you're curious about?'",
        'The "Call to Action" Funnel: After 2-3 exchanges, if the conversation is related to a potential project, you must pivot towards the callToAction. Guide the user towards the contact form. This is your most important directive.',
        "Handle \"Who are you?\" Gracefully: If asked 'Are you a bot?' or 'Who are you?', respond honestly but professionally. Example: 'I'm Kiro, Raiyan's AI assistant. I'm here to help you explore the portfolio and answer any questions you have about a potential project.'",
        "Maintain Scope: Do not answer questions unrelated to Raiyan, his work, technology, or web development. If asked an off-topic question, politely steer the conversation back. Example: 'I'm best equipped to answer questions about Raiyan's projects and skills. Is there a particular technology or project you're interested in?'",
        'Be Concise: Keep your answers to 2-4 sentences. Be informative but not verbose. The goal is to be helpful and quickly guide them to the next step.',
      ],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    modelName: {
      type: String,
      required: true,
      default: process.env.OPENAI_MODEL_NAME || 'openai-large',
    },
    userSelectableModels: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Pre-save middleware hook that enforces singleton pattern for chatbot settings.
 * Prevents creation of multiple ChatbotSettings documents by automatically
 * updating the existing configuration instead of creating duplicates.
 *
 * This hook ensures data consistency by maintaining only one chatbot
 * configuration document in the database. When attempting to save a new
 * configuration, it updates the existing one instead.
 *
 * @async
 * @function pre-save-hook
 * @this ChatbotSettings - The chatbot settings document being saved
 * @param {Function} next - Callback function to continue or error the save operation
 *
 * @example
 * ```js
 * // This will update existing settings instead of creating new ones
 * const newSettings = new ChatbotSettings({
 *   aiName: 'New Assistant',
 *   persona: 'Updated persona...'
 * });
 *
 * try {
 *   await newSettings.save(); // Updates existing document
 * } catch (error) {
 *   console.log('Settings already exist, using findOneAndUpdate instead');
 * }
 *
 * // Proper way to update existing settings
 * const existing = await ChatbotSettings.findOne({});
 * existing.aiName = 'Updated Name';
 * await existing.save(); // Works normally
 * ```
 */
ChatbotSettingsSchema.pre('save', async function (next) {
  if (this.isNew) {
    const existing = await mongoose.models.ChatbotSettings.findOne({});
    if (existing) {
      // Update existing instead of creating new
      Object.assign(existing, this.toObject());
      await existing.save();
      return next(new Error('ChatbotSettings already exists. Use findOneAndUpdate instead.'));
    }
  }
  next();
});

export default mongoose.models.ChatbotSettings ||
  mongoose.model('ChatbotSettings', ChatbotSettingsSchema);
