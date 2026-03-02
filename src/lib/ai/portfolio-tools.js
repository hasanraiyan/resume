import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import {
  listAllProjects,
  getProjectDetails,
  listAllArticles,
  getArticleDetails,
  searchPortfolio,
  submitContactForm,
} from '../chatbot-utils';

export const portfolioTools = [
  tool(
    async () => {
      const result = await listAllProjects();
      return typeof result === 'string' ? result : JSON.stringify(result);
    },
    {
      name: 'listAllProjects',
      description:
        "Get a list of all available project titles, their slugs, and short descriptions. Use this when the user asks a general question like 'What projects have you worked on?' or 'Show me your portfolio'.",
      schema: z.object({}),
    }
  ),
  tool(
    async ({ slug }) => {
      const result = await getProjectDetails(slug);
      return typeof result === 'string' ? result : JSON.stringify(result);
    },
    {
      name: 'getProjectDetails',
      description:
        'Get the complete, detailed information for a single project using its unique slug. Use this only after you know the specific slug.',
      schema: z.object({
        slug: z
          .string()
          .describe('The URL-friendly slug of the project (e.g., "luxury-fashion-store").'),
      }),
    }
  ),
  tool(
    async () => {
      const result = await listAllArticles();
      return typeof result === 'string' ? result : JSON.stringify(result);
    },
    {
      name: 'listAllArticles',
      description:
        "Get a list of all published article titles, their slugs, and excerpts. Use this when the user asks a general question like 'What have you written about?' or 'Show me your blog posts'.",
      schema: z.object({}),
    }
  ),
  tool(
    async ({ slug }) => {
      const result = await getArticleDetails(slug);
      return typeof result === 'string' ? result : JSON.stringify(result);
    },
    {
      name: 'getArticleDetails',
      description:
        'Get the full content and details for a single article using its unique slug. Use this when a user asks to read a specific article that you know the slug for.',
      schema: z.object({
        slug: z.string().describe('The URL-friendly slug of the article.'),
      }),
    }
  ),
  tool(
    async ({ query }) => {
      const result = await searchPortfolio(query);
      return typeof result === 'string' ? result : JSON.stringify(result);
    },
    {
      name: 'searchPortfolio',
      description:
        'Performs an intelligent, fuzzy search for projects or articles using specific keywords (e.g., "React", "e-commerce", "AI"). Use this for topic-based questions or when the user is looking for experience with a certain technology.',
      schema: z.object({
        query: z.string().describe('The search term or keyword.'),
      }),
    }
  ),
  tool(
    async (payload) => {
      const result = await submitContactForm(payload);
      return typeof result === 'string' ? result : JSON.stringify(result);
    },
    {
      name: 'submitContactForm',
      description:
        'Submits a contact form with the information you have gathered from the user. Call this tool when you have enough context to populate the fields.',
      schema: z.object({
        name: z.string().describe("The user's name."),
        email: z.string().describe("The user's email address."),
        projectType: z
          .enum([
            'web-design',
            'web-development',
            'mobile-app',
            'branding',
            'ui-ux',
            'consulting',
            'ecommerce',
            'cms-development',
            'seo-optimization',
            'api-integration',
            'database-design',
            'maintenance',
            'redesign',
            'landing-page',
            'portfolio',
            'blog',
            'other',
          ])
          .describe('The type of project.'),
        message: z.string().describe("The user's message/request."),
      }),
    }
  ),
];
