/**
 * @fileoverview Tools + generative UI block builder for the full-screen Portfolio Showcase agent.
 * Kept separate from portfolio-tools.js/chatbot-utils.js (which back the existing popover chat
 * agent) so the two agents' toolsets can diverge without regressing each other. Every query here
 * filters published/public/active content explicitly — the legacy tools in chatbot-utils.js are
 * missing several of these filters.
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import dbConnect from '@/lib/dbConnect';
import Project from '@/models/Project';
import Article from '@/models/Article';
import Technology from '@/models/Technology';
import Achievement from '@/models/Achievement';
import Certification from '@/models/Certification';
import Testimonial from '@/models/Testimonial';
import HeroSection from '@/models/HeroSection';
import AboutSection from '@/models/AboutSection';
import { searchPortfolio, submitContactForm } from './chatbot-utils';

// =================================================================================
// TOOL EXECUTION FUNCTIONS
// =================================================================================

export async function getShowcaseProfile() {
  try {
    await dbConnect();
    const [hero, about, technologies] = await Promise.all([
      HeroSection.getSettings(),
      AboutSection.getSettings(),
      Technology.find({ isActive: true }).sort({ displayOrder: 1 }).lean(),
    ]);

    const name = hero?.introduction?.name || '';
    const role = hero?.introduction?.role || '';
    const bio = about?.bio?.paragraphs?.[0] || hero?.introduction?.text || '';
    const avatarUrl = hero?.profile?.image?.url || '';
    const tags = (technologies || []).map((t) => t.name);
    const socialLinks = (hero?.socialLinks || [])
      .slice()
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((l) => ({ name: l.name, url: l.url, icon: l.icon }));

    if (!name) return { text: 'No profile information found.', data: null };

    return {
      text: `${name}${role ? `, ${role}` : ''}. ${bio}`,
      data: { name, role, bio, avatarUrl, tags, socialLinks },
    };
  } catch (error) {
    console.error('[Portfolio Showcase Tools] getShowcaseProfile failed:', error);
    return { error: 'Failed to retrieve profile.', text: 'Failed to retrieve profile.' };
  }
}

export async function getShowcaseProjects({ featured, category, limit = 12 } = {}) {
  try {
    await dbConnect();
    const query = { status: 'published', visibility: 'public' };
    if (typeof featured === 'boolean') query.featured = featured;
    if (category) query.category = category;

    const projects = await Project.find(query)
      .select('title slug tagline description thumbnail category tags links featured')
      .sort({ featured: -1, createdAt: -1 })
      .limit(limit)
      .lean();

    if (projects.length === 0) return { text: 'No published projects found.', data: [] };

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const markdownList = projects
      .map(
        (p, i) =>
          `${i + 1}. **[${p.title}](${baseUrl}/projects/${p.slug})** - ${p.tagline || p.description || ''}`
      )
      .join('\n');

    const items = projects.map((p) => ({
      slug: p.slug,
      title: p.title,
      tagline: p.tagline || p.description || '',
      thumbnail: p.thumbnail || '',
      tags: (p.tags || []).map((t) => t.name || t),
      liveUrl: p.links?.live || '',
      githubUrl: p.links?.github || '',
      featured: !!p.featured,
    }));

    return {
      text: `Here are the published projects:\n\n${markdownList}\n\nUse getProjectDetails with a specific slug for more.`,
      data: items,
    };
  } catch (error) {
    console.error('[Portfolio Showcase Tools] getShowcaseProjects failed:', error);
    return { error: 'Failed to retrieve projects.', text: 'Failed to retrieve projects.' };
  }
}

export async function getShowcaseProjectDetails(slug) {
  try {
    await dbConnect();
    const project = await Project.findOne({
      slug,
      status: 'published',
      visibility: 'public',
    }).lean();
    if (!project) return { error: 'Project not found.', text: 'That project could not be found.' };

    const tags = project.tags?.map((t) => t.name || t).join(', ') || 'No tags';
    const liveUrl = project.links?.live ? `[View Live Demo](${project.links.live}) 🔗` : '';
    const githubUrl = project.links?.github
      ? `[GitHub Repository](${project.links.github}) 💻`
      : '';
    const links = [liveUrl, githubUrl].filter(Boolean).join(' | ');
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';

    return {
      text: `**${project.title}**\n\n**Category:** ${project.category || 'Not specified'}\n**Tagline:** ${project.tagline || ''}\n\n**Description:**\n${project.description || ''}\n\n**Tags:** ${tags}\n\n**Links:** ${links || 'No external links'}\n\n**[View Project →](${baseUrl}/projects/${project.slug})**`,
      data: project,
    };
  } catch (error) {
    console.error('[Portfolio Showcase Tools] getShowcaseProjectDetails failed:', error);
    return {
      error: 'Failed to retrieve project details.',
      text: 'Failed to retrieve project details.',
    };
  }
}

export async function getShowcaseArticles() {
  try {
    await dbConnect();
    const articles = await Article.find({ status: 'published', visibility: 'public' })
      .select('title slug excerpt coverImage publishedAt')
      .sort({ publishedAt: -1 })
      .lean();

    if (articles.length === 0) return { text: 'No published articles found.', data: [] };

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    const markdownList = articles
      .map((a, i) => `${i + 1}. **[${a.title}](${baseUrl}/blog/${a.slug})** - ${a.excerpt || ''}`)
      .join('\n');

    return {
      text: `Here are the published articles:\n\n${markdownList}`,
      data: articles,
    };
  } catch (error) {
    console.error('[Portfolio Showcase Tools] getShowcaseArticles failed:', error);
    return { error: 'Failed to retrieve articles.', text: 'Failed to retrieve articles.' };
  }
}

export async function getShowcaseArticleDetails(slug) {
  try {
    await dbConnect();
    const article = await Article.findOne({
      slug,
      status: 'published',
      visibility: 'public',
    }).lean();
    if (!article) return { error: 'Article not found.', text: 'That article could not be found.' };

    const tags = article.tags?.join(', ') || 'No tags';
    const contentPreview =
      article.content?.length > 3000
        ? article.content.substring(0, 3000) +
          '\n\n*[Content truncated — read the full article at the link below.]*'
        : article.content;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    return {
      text: `**${article.title}**\n\n${contentPreview}\n\n**Tags:** ${tags}\n\n**[Read Full Article →](${baseUrl}/blog/${article.slug})**`,
      data: article,
    };
  } catch (error) {
    console.error('[Portfolio Showcase Tools] getShowcaseArticleDetails failed:', error);
    return {
      error: 'Failed to retrieve article details.',
      text: 'Failed to retrieve article details.',
    };
  }
}

export async function getShowcaseTechnologies() {
  try {
    await dbConnect();
    const technologies = await Technology.find({ isActive: true }).sort({ displayOrder: 1 }).lean();
    if (technologies.length === 0) return { text: 'No technologies configured.', data: [] };

    const items = technologies.map((t) => ({
      name: t.name,
      iconType: t.iconType,
      iconName: t.iconName,
    }));

    return {
      text: `Tech stack: ${technologies.map((t) => t.name).join(', ')}.`,
      data: items,
    };
  } catch (error) {
    console.error('[Portfolio Showcase Tools] getShowcaseTechnologies failed:', error);
    return { error: 'Failed to retrieve technologies.', text: 'Failed to retrieve technologies.' };
  }
}

export async function getShowcaseMilestones() {
  try {
    await dbConnect();
    const [achievements, certifications] = await Promise.all([
      Achievement.find({ isActive: true }).sort({ displayOrder: 1 }).lean(),
      Certification.find({ isActive: true }).sort({ displayOrder: 1 }).lean(),
    ]);

    const items = [
      ...achievements.map((a) => ({
        id: String(a._id),
        kind: 'achievement',
        title: a.title,
        description: a.description,
        date: a.createdAt,
        issuer: null,
        url: null,
        src: a.src,
        alt: a.alt,
        displayOrder: a.displayOrder ?? 0,
      })),
      ...certifications.map((c) => ({
        id: String(c._id),
        kind: 'certification',
        title: c.name,
        description: `Issued by ${c.issuer}`,
        date: c.date,
        issuer: c.issuer,
        url: c.url,
        src: null,
        alt: null,
        iconType: c.iconType,
        iconName: c.iconName,
        displayOrder: c.displayOrder ?? 0,
      })),
    ].sort((x, y) => x.displayOrder - y.displayOrder);

    if (items.length === 0) return { text: 'No achievements or certifications found.', data: [] };

    const summary = items
      .map((it, i) => `${i + 1}. [${it.kind}] ${it.title}${it.date ? ` (${it.date})` : ''}`)
      .join('\n');

    return {
      text: `Here are the milestones (achievements & certifications):\n\n${summary}`,
      data: items,
    };
  } catch (error) {
    console.error('[Portfolio Showcase Tools] getShowcaseMilestones failed:', error);
    return { error: 'Failed to retrieve milestones.', text: 'Failed to retrieve milestones.' };
  }
}

export async function getShowcaseTestimonials() {
  try {
    await dbConnect();
    const testimonials = await Testimonial.find({ isActive: true })
      .sort({ displayOrder: 1 })
      .lean();
    if (testimonials.length === 0) return { text: 'No testimonials found.', data: [] };

    const summary = testimonials
      .map((t, i) => `${i + 1}. ${t.name} (${t.company}): "${t.content}"`)
      .join('\n');

    const items = testimonials.map((t) => ({
      name: t.name,
      company: t.company,
      avatar: t.avatar || '',
      rating: t.rating,
      content: t.content,
    }));

    return {
      text: `Here's what people say:\n\n${summary}`,
      data: items,
    };
  } catch (error) {
    console.error('[Portfolio Showcase Tools] getShowcaseTestimonials failed:', error);
    return { error: 'Failed to retrieve testimonials.', text: 'Failed to retrieve testimonials.' };
  }
}

// =================================================================================
// LANGCHAIN TOOL DEFINITIONS
// =================================================================================

export const portfolioShowcaseTools = [
  tool(
    async () => {
      const result = await getShowcaseProfile();
      return JSON.stringify(result);
    },
    {
      name: 'get_profile',
      description:
        "Get the portfolio owner's core identity: name, role, short bio, profile photo, and top skills. ALWAYS call this first when the user asks who you are, to tell them about yourself, or wants to know about the person behind this portfolio.",
      schema: z.object({}),
    }
  ),
  tool(
    async ({ featured, category, limit }) => {
      const result = await getShowcaseProjects({ featured, category, limit });
      return JSON.stringify(result);
    },
    {
      name: 'get_projects',
      description:
        "Get published, publicly-visible projects. Use for questions like 'what have you built?' or 'show me your projects'. Optionally filter by featured or category.",
      schema: z.object({
        featured: z.boolean().optional().describe('Only return featured projects if true.'),
        category: z.string().optional().describe('Filter by project category.'),
        limit: z.number().optional().describe('Max number of projects to return (default 12).'),
      }),
    }
  ),
  tool(
    async ({ slug }) => {
      const result = await getShowcaseProjectDetails(slug);
      return JSON.stringify(result);
    },
    {
      name: 'get_project_details',
      description: 'Get full details for a single published project by its slug.',
      schema: z.object({
        slug: z.string().describe('The URL-friendly slug of the project.'),
      }),
    }
  ),
  tool(
    async () => {
      const result = await getShowcaseArticles();
      return JSON.stringify(result);
    },
    {
      name: 'get_articles',
      description:
        "Get published, publicly-visible blog articles. Use for 'what have you written?'.",
      schema: z.object({}),
    }
  ),
  tool(
    async ({ slug }) => {
      const result = await getShowcaseArticleDetails(slug);
      return JSON.stringify(result);
    },
    {
      name: 'get_article_details',
      description: 'Get the full content of a single published article by its slug.',
      schema: z.object({
        slug: z.string().describe('The URL-friendly slug of the article.'),
      }),
    }
  ),
  tool(
    async () => {
      const result = await getShowcaseTechnologies();
      return JSON.stringify(result);
    },
    {
      name: 'get_technologies',
      description:
        "Get the active tech stack/skills list. Use for 'what's your tech stack?' or 'what are your skills?'.",
      schema: z.object({}),
    }
  ),
  tool(
    async () => {
      const result = await getShowcaseMilestones();
      return JSON.stringify(result);
    },
    {
      name: 'get_milestones',
      description:
        "Get a chronological list of achievements and certifications. Use for 'tell me about your experience', 'what have you achieved', or 'what certifications do you have'.",
      schema: z.object({}),
    }
  ),
  tool(
    async () => {
      const result = await getShowcaseTestimonials();
      return JSON.stringify(result);
    },
    {
      name: 'get_testimonials',
      description:
        "Get client/collaborator testimonials. Use for 'what do people say about your work?'.",
      schema: z.object({}),
    }
  ),
  tool(
    async ({ query }) => {
      const result = await searchPortfolio(query);
      return typeof result === 'string' ? result : JSON.stringify(result);
    },
    {
      name: 'search_portfolio',
      description:
        'Fuzzy search across projects and articles by keyword or technology (e.g. "React", "e-commerce", "AI").',
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
      name: 'submit_contact_form',
      description:
        'Submits a contact form once name, email, project type, and message have been gathered from the user.',
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

// =================================================================================
// STATUS MESSAGES
// =================================================================================

export function getPortfolioToolStatusMessage(toolName) {
  switch (toolName) {
    case 'get_profile':
      return '👋 Loading profile...';
    case 'get_projects':
    case 'get_project_details':
      return '🎨 Loading projects...';
    case 'get_articles':
    case 'get_article_details':
      return '📚 Fetching articles...';
    case 'get_technologies':
      return '🛠️ Loading tech stack...';
    case 'get_milestones':
      return '🏆 Loading achievements...';
    case 'get_testimonials':
      return '💬 Loading testimonials...';
    case 'search_portfolio':
      return '🔎 Searching...';
    case 'submit_contact_form':
      return '📝 Submitting contact form...';
    default:
      return '🤔 Thinking...';
  }
}

// =================================================================================
// GENERATIVE UI BLOCK BUILDER
// =================================================================================

/**
 * Maps a completed tool's parsed output into zero or more generative UI blocks.
 * `output` is the already-JSON.parsed tool result (the `{text, data}` shape above).
 */
export function buildPortfolioUiBlocks(toolName, output) {
  if (!output || output.error || !output.data) return [];

  switch (toolName) {
    case 'get_profile':
      return [{ kind: 'profile_card', title: 'About', action: null, data: output.data }];
    case 'get_projects':
      return output.data.length
        ? [
            {
              kind: 'project_carousel',
              title: 'Projects',
              action: null,
              data: { items: output.data },
            },
          ]
        : [];
    case 'get_technologies':
      return output.data.length
        ? [
            {
              kind: 'skills_grid',
              title: 'Skills & Tech Stack',
              action: null,
              data: { items: output.data },
            },
          ]
        : [];
    case 'get_milestones':
      return output.data.length
        ? [
            {
              kind: 'milestone_timeline',
              title: 'Experience & Certifications',
              action: null,
              data: { items: output.data },
            },
          ]
        : [];
    case 'get_testimonials':
      return output.data.length
        ? [
            {
              kind: 'testimonials',
              title: 'Testimonials',
              action: null,
              data: { items: output.data },
            },
          ]
        : [];
    case 'submit_contact_form':
      return output.data?.success
        ? [{ kind: 'contact_card', title: 'Message Sent', action: null, data: output.data }]
        : [];
    default:
      return [];
  }
}
