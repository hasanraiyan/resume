/**
 * @fileoverview AI Context Builder for chatbot system.
 * Fetches and aggregates data from various database sources to build
 * dynamic context for the AI chatbot, including identity, projects, and articles.
 */

import { unstable_cache } from 'next/cache';
import dbConnect from '../../dbConnect';
import HeroSection from '../../../models/HeroSection';
import AboutSection from '../../../models/AboutSection';
import Project from '../../../models/Project';
import Article from '../../../models/Article';
import ChatbotSettings from '../../../models/ChatbotSettings';

/**
 * Retrieves core identity information from the hero section.
 */
export async function getCoreIdentity() {
  try {
    await dbConnect();
    const heroSection = await HeroSection.findOne({});
    if (!heroSection) {
      return { name: '', role: '', introduction: '' };
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
 */
export async function getArticleOverview() {
  try {
    await dbConnect();
    const articles = await Article.find({ status: 'published' }).limit(10).lean();
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
 * Refactored to remove deprecated model and provider fields.
 */
export async function getChatbotSettings() {
  try {
    await dbConnect();
    const settings = await ChatbotSettings.findOne({});

    if (!settings) {
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
    };
  } catch (error) {
    console.error('Error fetching chatbot settings:', error);
    return { isActive: false };
  }
}

/**
 * Builds the complete dynamic context for the AI chatbot.
 */
export const buildDynamicContext = unstable_cache(
  async () => {
    try {
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
    revalidate: 3600,
  }
);
