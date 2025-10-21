// src/app/blog/page.js

import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getAllPublishedArticles } from '@/app/actions/articleActions';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CustomCursor from '@/components/CustomCursor';
import { Section } from '@/components/ui';
import BlogPageClient from '@/components/blog/BlogPageClient';

export default async function BlogPage() {
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session?.user?.isAdmin;
  const { success, articles } = await getAllPublishedArticles(isAuthenticated);

  if (!success) {
    return (
      <>
        <CustomCursor />
        <Navbar />
        <main className=" min-h-screen">
          <Section
            title="Error"
            description="Failed to load articles. Please try again."
            centered={true}
            className="py-12 sm:py-16 md:py-20"
          />
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <CustomCursor />
      <Navbar />

      <main className=" min-h-screen">
        <Section
          title="From the Blog"
          description="Thoughts, insights, and tutorials on web development, design, and technology."
          centered={true}
          className="py-12 sm:py-16 md:py-20"
        >
          {articles.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-500 text-lg">No articles published yet.</div>
              <p className="text-gray-400 mt-2">Check back soon for new content!</p>
            </div>
          ) : (
            <BlogPageClient articles={articles} />
          )}
        </Section>
      </main>

      <Footer />
    </>
  );
}
