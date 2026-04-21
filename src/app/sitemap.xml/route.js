import { getAllPublishedArticles } from '@/app/actions/articleActions';
import Project from '@/models/Project';
import dbConnect from '@/lib/dbConnect';
import { getBaseUrl } from '@/lib/mcp/oauth';

export async function GET() {
  await dbConnect();

  const baseUrl = getBaseUrl();

  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 1,
    },
    {
      url: `${baseUrl}/projects`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  // Fetch published articles
  const { success: articlesSuccess, articles } = await getAllPublishedArticles(false, {
    limit: 1000,
  });

  const articleEntries =
    articlesSuccess && articles
      ? articles.map((article) => ({
          url: `${baseUrl}/blog/${article.slug}`,
          lastModified: new Date(article.publishedAt || article.createdAt),
          changeFrequency: 'monthly',
          priority: 0.7,
        }))
      : [];

  // Fetch published and public projects
  const projects = await Project.find({
    status: 'published',
    visibility: 'public',
  }).lean();

  const projectEntries = projects.map((project) => ({
    url: `${baseUrl}/projects/${project.slug}`,
    lastModified: new Date(project.updatedAt || project.createdAt),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const allEntries = [...staticPages, ...articleEntries, ...projectEntries];

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allEntries
    .map((entry) => {
      return `
    <url>
      <loc>${entry.url}</loc>
      <lastmod>${entry.lastModified.toISOString()}</lastmod>
      <changefreq>${entry.changeFrequency}</changefreq>
      <priority>${entry.priority}</priority>
    </url>
  `;
    })
    .join('')}
</urlset>`;

  return new Response(sitemapXml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
