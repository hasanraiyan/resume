// src/app/blog/page.js

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getAllPublishedArticles } from '@/app/actions/articleActions';
import { getSiteConfig } from '@/app/actions/siteActions';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Breadcrumb from '@/components/custom-ui/Breadcrumb';
import BlogPageClient from '@/components/blog/BlogPageClient';

export const metadata = {
  title: 'Blog — Raiyan Hasan',
  description:
    'Tutorials, insights, and thoughts on modern web development, performance optimization, and design.',
  alternates: {
    canonical: '/blog',
  },
};

const breadcrumbs = [
  { label: 'Home', path: '/', icon: 'Home' },
  { label: 'Blog', icon: 'FileText' },
];

export default async function BlogPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session?.user?.isAdmin;

  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams?.page || '1', 10);
  const search = resolvedSearchParams?.search || '';
  const tag = resolvedSearchParams?.tag || 'all';
  const limit = 10;

  const [{ success, articles, totalArticles, totalPages, currentPage, allTags }, siteConfig] =
    await Promise.all([
      getAllPublishedArticles(isAuthenticated, { page, limit, search, tag }),
      getSiteConfig(),
    ]);

  if (!success) {
    return (
      <>
        <Navbar siteConfig={siteConfig} />
        <main className="min-h-screen flex items-center justify-center bg-white">
          <p className="text-neutral-500">Failed to load articles. Please try again.</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar siteConfig={siteConfig} />

      <main className="min-h-screen bg-white">
        {/* ── Editorial Header ── */}
        <div className="border-b border-neutral-200">
          <div className="border-b border-neutral-100">
            <div className="max-w-3xl mx-auto px-5 sm:px-6 py-3">
              <Breadcrumb breadcrumbs={breadcrumbs} />
            </div>
          </div>
          <div className="max-w-3xl mx-auto px-5 sm:px-6 py-12 sm:py-16">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
              <div>
                <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-neutral-400 mb-3">
                  Writing
                </p>
                <h1 className="font-['Playfair_Display'] text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-black">
                  Blog
                </h1>
                <p className="text-lg text-neutral-500 mt-3">
                  Thoughts, tutorials, and insights on web development and design.
                </p>
              </div>
              {totalArticles > 0 && (
                <span className="text-sm font-semibold text-neutral-400 shrink-0 pb-1">
                  {totalArticles} article{totalArticles !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ── Content ── */}
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-12 sm:py-16">
          {articles.length === 0 && !search && tag === 'all' ? (
            <div className="py-20 text-center">
              <p className="text-neutral-400 text-lg">No articles published yet.</p>
              <p className="text-neutral-400 mt-2 text-sm">Check back soon for new content.</p>
            </div>
          ) : (
            <BlogPageClient
              articles={articles}
              totalArticles={totalArticles}
              totalPages={totalPages}
              currentPage={currentPage}
              search={search}
              tag={tag}
              allTags={allTags}
            />
          )}
        </div>
      </main>

      <Footer />
    </>
  );
}
