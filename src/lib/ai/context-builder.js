/**
 * @fileoverview AI Context Builder for chatbot system.
 * Fetches and aggregates data from various database sources to build
 * dynamic context for the AI chatbot, including identity, projects, and articles.
 *
 * This module is crucial for providing the AI chatbot with up-to-date information
 * about the portfolio owner, their projects, articles, and chatbot configuration.
 * All context data is fetched dynamically from the database to ensure the AI
 * always has current information.
 *
 * @example
 * ```js
 * import { buildDynamicContext } from '@/lib/ai/context-builder';
 *
 * // Build complete context for chatbot
 * const context = await buildDynamicContext();
 * console.log(context.coreIdentity.name); // Portfolio owner's name
 * console.log(context.chatbotSettings.aiName); // AI assistant name
 * ```
 */

import { unstable_cache } from 'next/cache';
import dbConnect from '../dbConnect';
import HeroSection from '../../models/HeroSection';
import AboutSection from '../../models/AboutSection';
import Project from '../../models/Project';
import Article from '../../models/Article';
import ChatbotSettings from '../../models/ChatbotSettings';

/**
 * Retrieves core identity information from the hero section.
 * Provides fallback defaults if database query fails.
 *
 * @async
 * @function getCoreIdentity
 * @returns {Promise<{name: string, role: string, introduction: string}>} Core identity object
 */
export async function getCoreIdentity() {
  try {
    await dbConnect();

    const heroSection = await HeroSection.findOne({});
    if (!heroSection) {
      return {
        name: '',
        role: '',
        introduction: '',
      };
    }

    return {
      name: heroSection.name || '',
      role: heroSection.role || '',
      introduction: heroSection.introduction || '',
    };
  } catch (error) {
    console.error('Error fetching core identity:', error);
    return { name: '', role: '', introduction: '' };
  }
}

/**
 * Retrieves the about section summary/bio from the database.
 *
 * @async
 * @function getAboutSummary
 * @returns {Promise<string>} Bio/summary text or default fallback
 */
export async function getAboutSummary() {
  try {
    await dbConnect();

    const aboutSection = await AboutSection.findOne({});
    if (!aboutSection) return '';
    return aboutSection.bio || '';
  } catch (error) {
    console.error('Error fetching about summary:', error);
    return '';
  }
}

/**
 * Generates an overview of all projects for AI context.
 * Fetches up to 20 projects and creates a summary string.
 *
 * @async
 * @function getProjectOverview
 * @returns {Promise<string>} Formatted project overview text
 */
export async function getProjectOverview() {
  try {
    await dbConnect();

    const projects = await Project.find({}).limit(20).lean();

    if (!projects || projects.length === 0) return '';

    const projectSummaries = projects.map((project) => {
      return `${project.title} - ${project.category} project${project.description ? ': ' + project.description.substring(0, 100) + '...' : ''}`;
    });

    return `Projects overview: ${projectSummaries.join(', ')}.`;
  } catch (error) {
    console.error('Error fetching project overview:', error);
    return '';
  }
}

/**
 * Generates an overview of all articles for AI context.
 * Fetches up to 10 articles and creates a summary string.
 *
 * @async
 * @function getArticleOverview
 * @returns {Promise<string>} Formatted article overview text
 */
export async function getArticleOverview() {
  try {
    await dbConnect();

    const articles = await Article.find({}).limit(10).lean();

    if (!articles || articles.length === 0) return '';

    const articleSummaries = articles.map((article) => {
      return `${article.title}${article.excerpt ? ': ' + article.excerpt.substring(0, 100) + '...' : ''}`;
    });

    return `Articles written: ${articleSummaries.join(', ')}.`;
  } catch (error) {
    console.error('Error fetching article overview:', error);
    return '';
  }
}

/**
 * Retrieves chatbot configuration settings from the database.
 * Includes AI name, persona, rules, and activation status.
 *
 * @async
 * @function getChatbotSettings
 * @returns {Promise<Object>} Chatbot settings object with defaults if not found
 */
export async function getChatbotSettings() {
  try {
    await dbConnect();

    const settings = await ChatbotSettings.findOne({});

    if (!settings) {
      // Return default settings if none exist
      return {
        aiName: '',
        persona: '',
        baseKnowledge: '',
        servicesOffered: '',
        callToAction: '',
        rules: [],
        isActive: false,
      };
    }

    // Migration helper for legacy string model settings
    const migrateSlot = (slotData, defaultValue = '') => {
      if (typeof slotData === 'string') {
        return { providerId: 'default-openai', model: slotData || defaultValue };
      }
      return slotData || { providerId: '', model: '' };
    };

    return {
      aiName: settings.aiName,
      persona: settings.persona,
      baseKnowledge: settings.baseKnowledge,
      servicesOffered: settings.servicesOffered,
      callToAction: settings.callToAction,
      suggestedPrompts: settings.suggestedPrompts || [],
      welcomeMessage: settings.welcomeMessage,
      rules: settings.rules,
      isActive: settings.isActive,
      // CRITICAL: These fields are required for the Multi-Provider Hub to work.
      // Without these, the Chat API cannot find your custom Base URLs.
      modelName: migrateSlot(settings.modelName),
      fastModel: migrateSlot(settings.fastModel),
      thinkingModel: migrateSlot(settings.thinkingModel),
      proModel: migrateSlot(settings.proModel),
      providers: settings.providers || [],
    };
  } catch (error) {
    console.error('Error fetching chatbot settings:', error);
    // Return empty or minimal structure on error to avoid breaking the app,
    // but try to avoid hardcoded personas here if possible.
    return {
      isActive: false,
    };
  }
}

/**
 * Builds the complete dynamic context for the AI chatbot.
 * Fetches all context components in parallel for optimal performance.
 *
 * @async
 * @function buildDynamicContext
 * @returns {Promise<Object>} Complete context object containing all chatbot data
 * @throws {Error} If context building fails
 */
export const buildDynamicContext = unstable_cache(
  async () => {
    try {
      // Fetch all context data in parallel
      const [coreIdentity, aboutSummary, projectOverview, articleOverview, chatbotSettings] =
        await Promise.all([
          getCoreIdentity(),
          getAboutSummary(),
          getProjectOverview(),
          getArticleOverview(),
          getChatbotSettings(),
        ]);

      return {
        coreIdentity,
        aboutSummary,
        projectOverview,
        articleOverview,
        chatbotSettings,
      };
    } catch (error) {
      console.error('Error building dynamic context:', error);
      throw error;
    }
  },
  ['ai-dynamic-context'],
  {
    tags: ['ai-context', 'chatbot-settings', 'projects', 'articles', 'hero', 'about'],
    revalidate: 3600, // Revalidate every hour fallback
  }
);
