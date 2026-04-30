// src/app/blog/[slug]/page.js

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getAllPublishedArticles, getArticleBySlug } from '@/app/actions/articleActions';
import { getSiteConfig } from '@/app/actions/siteActions';
import MarkdownRenderer from '@/components/custom-ui/MarkdownRenderer';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Image from 'next/image';
import Link from 'next/link';
import SocialShare from '@/components/SocialShare';
import LikeButton from '@/components/LikeButton';
import NewsletterForm from '@/components/NewsletterForm';
import ReadingProgressBar from '@/components/blog/ReadingProgressBar';
import { getBaseUrl } from '@/lib/mcp/oauth';

export async function generateStaticParams() {
  // Pass empty options to get default limit, or a high limit if there are many articles
  const { success, articles } = await getAllPublishedArticles(true, { limit: 1000 });
  if (!success) return [];
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session?.user?.isAdmin;
  // Use getArticleBySlug directly to avoid fetching all articles
  const { success, article } = await getArticleBySlug(slug, isAuthenticated);

  if (!success || !article) {
    return { title: 'Article Not Found' };
  }

  return {
    title: `${article.title} | Blog`,
    description: article.excerpt,
    alternates: {
      canonical: `/blog/${article.slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.excerpt,
      type: 'article',
      url: `${getBaseUrl()}/blog/${article.slug}`,
      images: article.coverImage ? [{ url: article.coverImage, alt: article.title }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: article.coverImage ? [article.coverImage] : [],
    },
  };
}

export default async function ArticlePage({ params }) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session?.user?.isAdmin;
  const [{ success, article }, siteConfig] = await Promise.all([
    getArticleBySlug(slug, isAuthenticated),
    getSiteConfig(),
  ]);

  if (!success || !article) {
    notFound();
  }

  // Fetch related articles
  // Get a few recent published articles
  const { articles: allArticles } = await getAllPublishedArticles(isAuthenticated, { limit: 4 });
  const relatedArticles = allArticles?.filter((a) => a.slug !== article.slug).slice(0, 3) || [];

  const formatDate = (dateString) => {
    if (!dateString || isNaN(new Date(dateString).getTime())) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const estimateReadTime = (content) => {
    if (!content) return '1 min read';
    const words = content.trim().split(/\s+/).length;
    const minutes = Math.max(1, Math.ceil(words / 265));
    return `${minutes} min read`;
  };

  const publishDate = formatDate(article.publishedAt) || formatDate(article.createdAt);
  const readTime = estimateReadTime(article.content);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: article.title,
    description: article.excerpt,
    image: article.coverImage ? [article.coverImage] : [],
    datePublished: article.publishedAt || article.createdAt,
    dateModified: article.updatedAt || article.publishedAt || article.createdAt,
    wordCount: article.content ? article.content.trim().split(/\s+/).length : 0,
    articleSection: article.tags && article.tags.length > 0 ? article.tags[0] : 'Technology',
    author: {
      '@type': 'Person',
      name: 'Raiyan Hasan',
      url: getBaseUrl(),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar siteConfig={siteConfig} />
      <ReadingProgressBar />

      <main className="min-h-screen bg-white">
        {/* ── Cover Image (full-bleed) ── */}
        {article.coverImage && (
          <div className="relative w-full h-[480px] overflow-hidden bg-neutral-100 flex items-center justify-center">
            <Image
              src={article.coverImage.trimStart()}
              alt={article.title}
              width={1200}
              height={480}
              className="w-full h-full object-cover object-center"
              priority
              unoptimized={article.coverImage?.includes('utfs.io')}
            />
          </div>
        )}

        {/* ── Article Content ── */}
        <article className="max-w-6xl mx-auto px-5 sm:px-6 pt-10 pb-16">
          {/* Header */}
          <header className="mb-8">
            <h1
              className="text-[32px] sm:text-[40px] lg:text-[44px] font-bold text-neutral-900 leading-[1.15] tracking-tight mb-5"
              style={{ fontFamily: "'Georgia', 'Noto Serif', serif" }}
            >
              {article.title}
            </h1>

            {/* Subtitle / Excerpt */}
            <p
              className="text-lg sm:text-xl text-neutral-500 leading-relaxed mb-6"
              style={{ fontFamily: "'Georgia', 'Noto Serif', serif" }}
            >
              {article.excerpt}
            </p>

            {/* Author block */}
            <div className="flex items-center gap-3 pb-6 border-b border-neutral-100">
              <div className="w-11 h-11 rounded-full bg-neutral-900 flex items-center justify-center shrink-0">
                <span className="text-sm font-bold text-white">R</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-neutral-900">Raiyan Hasan</span>
                </div>
                <div className="flex items-center gap-2 text-[13px] text-neutral-400">
                  <time dateTime={article.publishedAt || article.createdAt}>{publishDate}</time>
                  <span>·</span>
                  <span>{readTime}</span>
                </div>
              </div>

              {/* Share + Engagement */}
              <div className="flex items-center gap-2">
                <SocialShare
                  title={article.title}
                  slug={article.slug}
                  excerpt={article.excerpt}
                  type="article"
                />
              </div>
            </div>

            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {article.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex px-3 py-1 rounded-full bg-neutral-100 text-neutral-600 text-[12px] font-medium"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </header>

          {/* Unlisted notice */}
          {article.visibility === 'unlisted' && (
            <div className="mb-8 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700 text-center">
              🔗 This article is not listed publicly and can only be accessed via direct link.
            </div>
          )}

          {/* ── Article Body ── */}
          <div className="article-body">
            <MarkdownRenderer content={article.content} />
          </div>

          {/* ── Engagement Bar ── */}
          <div className="flex items-center justify-between mt-12 pt-6 border-t border-neutral-100">
            <div className="flex items-center gap-4">
              <LikeButton
                type="article"
                slug={article.slug}
                engagementType="clap"
                initialCount={article.claps || 0}
              />
              <LikeButton
                type="article"
                slug={article.slug}
                engagementType="like"
                initialCount={article.likes || 0}
              />
            </div>
            <SocialShare
              title={article.title}
              slug={article.slug}
              excerpt={article.excerpt}
              type="article"
            />
          </div>

          {/* ── Newsletter CTA ── */}
          <div className="mt-14 p-8 bg-neutral-50 rounded-2xl text-center">
            <h3
              className="text-2xl font-bold text-neutral-900 mb-2"
              style={{ fontFamily: "'Georgia', 'Noto Serif', serif" }}
            >
              Enjoyed this article?
            </h3>
            <p className="text-neutral-500 text-sm mb-6 max-w-md mx-auto">
              Subscribe to get notified when new articles are published — no spam, ever.
            </p>
            <NewsletterForm
              source="blog"
              placeholder="Your email address"
              buttonText="Subscribe"
              className="newsletter-blog-form"
            />
          </div>

          {/* ── More from Raiyan ── */}
          {relatedArticles.length > 0 && (
            <div className="mt-16 pt-10 border-t border-neutral-100">
              <h3 className="text-lg font-bold text-neutral-900 mb-6">More from Raiyan Hasan</h3>
              <div className="space-y-6">
                {relatedArticles.map((related) => (
                  <Link key={related.slug} href={`/blog/${related.slug}`} className="group block">
                    <div className="grid grid-cols-[1fr_100px] gap-4 items-start">
                      <div className="min-w-0">
                        <h4
                          className="text-base font-bold text-neutral-900 leading-snug mb-1 group-hover:text-neutral-600 transition-colors"
                          style={{ fontFamily: "'Georgia', 'Noto Serif', serif" }}
                        >
                          {related.title}
                        </h4>
                        <p className="text-[13px] text-neutral-400 line-clamp-2">
                          {related.excerpt}
                        </p>
                        <div className="flex items-center gap-2 text-[12px] text-neutral-400 mt-2">
                          <time>
                            {new Date(related.publishedAt || related.createdAt).toLocaleDateString(
                              'en-US',
                              {
                                month: 'short',
                                day: 'numeric',
                              }
                            )}
                          </time>
                          <span>·</span>
                          <span>
                            {Math.max(
                              1,
                              Math.ceil((related.content?.trim().split(/\s+/).length || 0) / 265)
                            )}{' '}
                            min read
                          </span>
                        </div>
                      </div>
                      {related.coverImage && (
                        <div className="aspect-square relative overflow-hidden rounded-sm bg-neutral-100">
                          <Image
                            src={related.coverImage.trimStart()}
                            alt={related.title}
                            fill
                            className="object-cover"
                            loading="lazy"
                            unoptimized={related.coverImage?.includes('utfs.io')}
                          />
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
      </main>

      <Footer />
    </>
  );
}
