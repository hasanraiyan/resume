// src/app/blog/page.js

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getAllPublishedArticles } from '@/app/actions/articleActions';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CustomCursor from '@/components/CustomCursor';
import BlogPageClient from '@/components/blog/BlogPageClient';

export const metadata = {
  title: 'Blog — Raiyan Hasan',
  description:
    'Tutorials, insights, and thoughts on modern web development, performance optimization, and design.',
  alternates: {
    canonical: '/blog',
  },
};

export default async function BlogPage({ searchParams }) {
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session?.user?.isAdmin;

  // Await searchParams in Next.js 15
  const resolvedSearchParams = await searchParams;
  const page = parseInt(resolvedSearchParams?.page || '1', 10);
  const search = resolvedSearchParams?.search || '';
  const tag = resolvedSearchParams?.tag || 'all';
  const limit = 10;

  const { success, articles, totalArticles, totalPages, currentPage, allTags } = await getAllPublishedArticles(
    isAuthenticated,
    { page, limit, search, tag }
  );

  if (!success) {
    return (
      <>
        <CustomCursor />
        <Navbar />
        <main className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-neutral-500 text-lg">Failed to load articles. Please try again.</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <CustomCursor />
      <Navbar />

      <main className="min-h-screen bg-white">
        <div className="max-w-3xl mx-auto px-5 sm:px-6 py-12 sm:py-16">
          {/* Page header */}
          <header className="text-center mb-12">
            <h1
              className="text-4xl sm:text-5xl font-bold text-neutral-900 mb-3"
              style={{ fontFamily: "'Georgia', 'Noto Serif', serif" }}
            >
              Blog
            </h1>
            <p className="text-neutral-500 text-base max-w-lg mx-auto">
              Thoughts, tutorials, and insights on web development and design.
            </p>
          </header>

          {articles.length === 0 && !search && tag === 'all' ? (
            <div className="text-center py-20">
              <p className="text-neutral-400 text-lg">No articles published yet.</p>
              <p className="text-neutral-400 mt-2 text-sm">Check back soon for new content!</p>
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
