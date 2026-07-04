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
    const resumeUrl = about?.resume?.url;
    const resume =
      resumeUrl && resumeUrl !== '#'
        ? { text: about.resume.text || 'Download Resume', url: resumeUrl }
        : null;

    if (!name) return { text: 'No profile information found.', data: null };

    return {
      text: `Profile card shown below for ${name}${role ? `, ${role}` : ''}.`,
      data: { name, role, bio, avatarUrl, tags, socialLinks, resume },
    };
  } catch (error) {
    console.error('[Portfolio Showcase Tools] getShowcaseProfile failed:', error);
    return { error: 'Failed to retrieve profile.', text: 'Failed to retrieve profile.' };
  }
}

export async function getShowcaseResume() {
  try {
    await dbConnect();
    const about = await AboutSection.getSettings();
    const url = about?.resume?.url;

    if (!url || url === '#') {
      return { error: 'No resume is configured yet.', text: 'No resume is configured yet.' };
    }

    const text = about.resume.text || 'Download Resume';

    // Hosts like UploadThing/Cloudinary often serve files with no extension in
    // the URL path, so the frontend can't detect PDF-vs-image from the URL
    // alone — resolve the real content type here instead.
    let contentType = '';
    try {
      const headRes = await fetch(url, { method: 'HEAD' });
      contentType = headRes.headers.get('content-type') || '';
    } catch {
      // Non-fatal — the frontend falls back to a plain download link.
    }

    return {
      text: 'Resume card shown below.',
      data: { text, url, contentType },
    };
  } catch (error) {
    console.error('[Portfolio Showcase Tools] getShowcaseResume failed:', error);
    return { error: 'Failed to retrieve resume.', text: 'Failed to retrieve resume.' };
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

    const items = projects.map((p) => ({
      slug: p.slug,
      title: p.title,
      tagline: p.tagline || p.description || '',
      thumbnail: p.thumbnail || '',
      tags: (p.tags || []).map((t) => t.name || t),
      liveUrl: p.links?.live || '',
      githubUrl: p.links?.github || '',
      projectUrl: `${baseUrl}/projects/${p.slug}`,
      featured: !!p.featured,
    }));

    return {
      text: `${projects.length} project(s) shown in the carousel below. Call get_project_details with a slug from this data for more.`,
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

    return {
      text: `"${project.title}" details shown in the card below.`,
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
    const items = articles.map((a) => ({
      slug: a.slug,
      title: a.title,
      excerpt: a.excerpt || '',
      coverImage: a.coverImage || '',
      url: `${baseUrl}/blog/${a.slug}`,
    }));

    return {
      text: `${articles.length} article(s) shown in the carousel below. Call get_article_details with a slug from this data for more.`,
      data: items,
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

    return {
      text: `"${article.title}" shown in the card below. Its full content is in this tool's data for your own reference — give a 1-2 sentence takeaway, don't reproduce the article text.`,
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
      text: `Tech stack shown in the grid below (${technologies.length} item(s)).`,
      data: items,
    };
  } catch (error) {
    console.error('[Portfolio Showcase Tools] getShowcaseTechnologies failed:', error);
    return { error: 'Failed to retrieve technologies.', text: 'Failed to retrieve technologies.' };
  }
}

export async function getShowcaseAchievements() {
  try {
    await dbConnect();
    const achievements = await Achievement.find({ isActive: true })
      .sort({ displayOrder: 1 })
      .lean();

    if (achievements.length === 0) return { text: 'No achievements found.', data: [] };

    const items = achievements.map((a) => ({
      id: String(a._id),
      kind: 'achievement',
      title: a.title,
      description: a.description,
      src: a.src,
      alt: a.alt,
    }));

    return {
      text: `${items.length} achievement(s) shown below.`,
      data: items,
    };
  } catch (error) {
    console.error('[Portfolio Showcase Tools] getShowcaseAchievements failed:', error);
    return { error: 'Failed to retrieve achievements.', text: 'Failed to retrieve achievements.' };
  }
}

export async function getShowcaseCertifications() {
  try {
    await dbConnect();
    const certifications = await Certification.find({ isActive: true })
      .sort({ displayOrder: 1 })
      .lean();

    if (certifications.length === 0) return { text: 'No certifications found.', data: [] };

    const items = certifications.map((c) => ({
      id: String(c._id),
      kind: 'certification',
      title: c.name,
      description: `Issued by ${c.issuer}`,
      date: c.date,
      issuer: c.issuer,
      url: c.url,
      iconType: c.iconType,
      iconName: c.iconName,
    }));

    return {
      text: `${items.length} certification(s) shown below.`,
      data: items,
    };
  } catch (error) {
    console.error('[Portfolio Showcase Tools] getShowcaseCertifications failed:', error);
    return {
      error: 'Failed to retrieve certifications.',
      text: 'Failed to retrieve certifications.',
    };
  }
}

export async function getShowcaseTestimonials() {
  try {
    await dbConnect();
    const testimonials = await Testimonial.find({ isActive: true })
      .sort({ displayOrder: 1 })
      .lean();
    if (testimonials.length === 0) return { text: 'No testimonials found.', data: [] };

    const items = testimonials.map((t) => ({
      name: t.name,
      company: t.company,
      avatar: t.avatar || '',
      rating: t.rating,
      content: t.content,
    }));

    return {
      text: `${items.length} testimonial(s) shown below.`,
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
    async () => {
      const result = await getShowcaseResume();
      return JSON.stringify(result);
    },
    {
      name: 'get_resume',
      description:
        'Get the downloadable resume/CV link. Use whenever the user asks to see, view, download, or get your resume/CV.',
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
      const result = await getShowcaseAchievements();
      return JSON.stringify(result);
    },
    {
      name: 'get_achievements',
      description:
        "Get award/competition-style achievements with photos. Use for 'what have you achieved', 'tell me about your awards', or general 'experience' questions.",
      schema: z.object({}),
    }
  ),
  tool(
    async () => {
      const result = await getShowcaseCertifications();
      return JSON.stringify(result);
    },
    {
      name: 'get_certifications',
      description:
        "Get professional certifications (issuer, date, credential link). Use for 'what certifications do you have' or 'what courses have you completed'.",
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
    case 'get_resume':
      return '📄 Loading resume...';
    case 'get_projects':
    case 'get_project_details':
      return '🎨 Loading projects...';
    case 'get_articles':
    case 'get_article_details':
      return '📚 Fetching articles...';
    case 'get_technologies':
      return '🛠️ Loading tech stack...';
    case 'get_achievements':
      return '🏆 Loading achievements...';
    case 'get_certifications':
      return '📜 Loading certifications...';
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
    case 'get_resume':
      return [{ kind: 'resume_card', title: 'Resume', action: null, data: output.data }];
    case 'get_project_details': {
      const p = output.data;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      return [
        {
          kind: 'project_detail',
          title: p.title,
          action: null,
          data: {
            slug: p.slug,
            title: p.title,
            category: p.category,
            tagline: p.tagline,
            description: p.description,
            thumbnail: p.thumbnail,
            tags: (p.tags || []).map((t) => t.name || t),
            liveUrl: p.links?.live || '',
            githubUrl: p.links?.github || '',
            projectUrl: `${baseUrl}/projects/${p.slug}`,
          },
        },
      ];
    }
    case 'get_article_details': {
      const a = output.data;
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
      return [
        {
          kind: 'article_detail',
          title: a.title,
          action: null,
          data: {
            slug: a.slug,
            title: a.title,
            excerpt: a.excerpt,
            coverImage: a.coverImage,
            tags: a.tags || [],
            url: `${baseUrl}/blog/${a.slug}`,
          },
        },
      ];
    }
    case 'get_projects':
      return output.data.length
        ? [
            {
              kind: 'project_carousel',
              title: 'Projects',
              action: {
                type: 'link',
                url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/projects`,
                label: 'See all projects',
              },
              data: { items: output.data },
            },
          ]
        : [];
    case 'get_articles':
      return output.data.length
        ? [
            {
              kind: 'article_carousel',
              title: 'Articles',
              action: {
                type: 'link',
                url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/blog`,
                label: 'See all articles',
              },
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
    case 'get_achievements':
      return output.data.length
        ? [
            {
              kind: 'achievements_gallery',
              title: 'Achievements',
              action: null,
              data: { items: output.data },
            },
          ]
        : [];
    case 'get_certifications':
      return output.data.length
        ? [
            {
              kind: 'certifications_list',
              title: 'Certifications',
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
