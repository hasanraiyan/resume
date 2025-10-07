import { getAllPublishedArticles } from '@/app/actions/articleActions';
import Project from '@/models/Project';
import dbConnect from '@/lib/dbConnect';

export default async function sitemap() {
  await dbConnect();

  const baseUrl = 'https://hasanraiyan.vercel.app'; // Replace with your actual domain

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
  const { success: articlesSuccess, articles } = await getAllPublishedArticles();

  const articleEntries =
    articlesSuccess && articles
      ? articles.map((article) => ({
          url: `${baseUrl}/blog/${article.slug}`,
          lastModified: new Date(article.publishedAt || article.createdAt),
          changeFrequency: 'monthly',
          priority: 0.7,
        }))
      : [];

  // Fetch projects
  const projects = await Project.find({}).lean();
  const projectEntries = projects.map((project) => ({
    url: `${baseUrl}/projects/${project.slug}`,
    lastModified: new Date(project.updatedAt || project.createdAt),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticPages, ...articleEntries, ...projectEntries];
}
