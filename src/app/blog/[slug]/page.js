// src/app/blog/[slug]/page.js

import { getAllPublishedArticles } from '@/app/actions/articleActions';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CustomCursor from '@/components/CustomCursor';
import { Section, Badge, Button } from '@/components/ui';
import Image from 'next/image';
import SocialShare from '@/components/SocialShare';
import LikeButton from '@/components/LikeButton';

export async function generateStaticParams() {
  const { success, articles } = await getAllPublishedArticles();
  if (!success) return [];
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const { success, articles } = await getAllPublishedArticles();
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
  const { success, articles } = await getAllPublishedArticles();
  const article = articles.find((a) => a.slug === slug);

  if (!success || !article) {
    notFound();
  }

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

      <main className="pt-20 sm:pt-24 min-h-screen bg-gray-50">
        <Section className="py-12 sm:py-16 md:py-20 bg-white " containerClassName="max-w-4xl">
          <article>
            {/* --- ARTICLE HEADER --- */}
            <header className="mb-8 md:mb-12">
              <div className="mb-6">
                <Button href="/blog" variant="ghost" className="inline-flex items-center text-sm">
                  <i className="fas fa-arrow-left mr-2"></i> Back to All Articles
                </Button>
              </div>

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
                <SocialShare title={article.title} slug={article.slug} excerpt={article.excerpt} />
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
          </article>
        </Section>
      </main>

      <Footer />
    </>
  );
}
