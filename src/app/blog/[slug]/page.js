// src/app/blog/[slug]/page.js

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getAllPublishedArticles, getArticleBySlug } from '@/app/actions/articleActions';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CustomCursor from '@/components/CustomCursor';
import { Section, Badge, Button } from '@/components/ui';
import Image from 'next/image';
import SocialShare from '@/components/SocialShare';
import LikeButton from '@/components/LikeButton';
import NewsletterForm from '@/components/NewsletterForm';

export async function generateStaticParams() {
  // Generate params for all published articles (including private ones for authenticated access)
  const { success, articles } = await getAllPublishedArticles(true);
  if (!success) return [];
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session?.user?.isAdmin;
  const { success, articles } = await getAllPublishedArticles(isAuthenticated);
  const article = articles.find((a) => a.slug === slug);

  if (!success || !article) {
    return { title: 'Article Not Found' };
  }

  return {
    title: `${article.title} | Blog`,
    description: article.excerpt,
  };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session?.user?.isAdmin;
  const { success, article } = await getArticleBySlug(slug, isAuthenticated);

  if (!success || !article) {
    notFound();
  }

  const breadcrumbs = [
    { label: 'Home', path: '/', icon: 'Home' },
    { label: 'Blog', path: '/blog', icon: 'FileText' },
    { label: article.title, icon: 'FileText' },
  ];

  const formattedDate = (dateString) => {
    if (!dateString || isNaN(new Date(dateString).getTime())) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const publishDate = formattedDate(article.publishedAt) || formattedDate(article.createdAt);

  return (
    <>
      <CustomCursor />
      <Navbar />

      <main className=" min-h-screen bg-gray-50">
        <Section
          className="py-12 sm:py-18 md:py-16 bg-white "
          containerClassName="max-w-4xl"
          breadcrumbs={breadcrumbs}
        >
          <article>
            {/* --- ARTICLE HEADER --- */}
            <header className="mb-8 md:mb-12">
              <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4 font-['Playfair_Display'] leading-tight">
                {article.title}
              </h1>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-gray-500 mb-6">
                <time dateTime={article.publishedAt || article.createdAt}>
                  Published on {publishDate}
                </time>
                {article.tags && article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="tag"
                        className="bg-blue-50 text-blue-700 font-medium"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Social Sharing and Engagement */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
                <SocialShare
                  title={article.title}
                  slug={article.slug}
                  excerpt={article.excerpt}
                  type="article"
                />
                <div className="flex items-center gap-3">
                  <LikeButton
                    type="article"
                    slug={article.slug}
                    engagementType="like"
                    initialCount={article.likes || 0}
                  />
                  <LikeButton
                    type="article"
                    slug={article.slug}
                    engagementType="clap"
                    initialCount={article.claps || 0}
                  />
                </div>
              </div>
            </header>

            {/* --- UNLISTED NOTICE --- */}
            {article.visibility === 'unlisted' && (
              <div className="mb-6 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-600 text-center">
                <i className="fas fa-link mr-2"></i>
                This article is not listed publicly and can only be accessed via direct link.
              </div>
            )}

            {/* --- COVER IMAGE --- */}
            {article.coverImage && (
              <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-100 mb-8 md:mb-12 shadow-inner">
                <Image
                  src={article.coverImage}
                  alt={article.title}
                  fill
                  className="w-full h-full object-cover"
                  priority
                />
              </div>
            )}

            {/* --- ARTICLE CONTENT --- */}
            <div className="prose prose-lg max-w-none">
              {/* Render excerpt as an intro */}
              <p className="text-lg text-gray-600 leading-relaxed border-l-4 border-gray-200 pl-4 italic">
                {article.excerpt}
              </p>
              <MarkdownRenderer content={article.content} />
            </div>

            {/* Newsletter Subscription CTA */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="max-w-2xl mx-auto text-center">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">Enjoyed this article?</h3>
                <p className="text-gray-600 mb-8">
                  Subscribe to our newsletter for more insights, projects, and updates delivered to
                  your inbox.
                </p>
                <NewsletterForm
                  source="blog"
                  placeholder="Enter your email for more great content"
                  buttonText="Subscribe Now"
                  className="newsletter-blog-form"
                />
              </div>
            </div>
          </article>
        </Section>
      </main>

      <Footer />
    </>
  );
}
