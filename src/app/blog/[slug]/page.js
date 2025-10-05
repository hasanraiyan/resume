import { getAllPublishedArticles } from '@/app/actions/articleActions';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';
import { notFound } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CustomCursor from '@/components/CustomCursor';
import { Section } from '@/components/ui';

export async function generateStaticParams() {
  const { success, articles } = await getAllPublishedArticles();

  if (!success) {
    return [];
  }

  return articles.map((article) => ({
    slug: article.slug,
  }));
}

export async function generateMetadata({ params }) {
  // Await params in Next.js 15
  const { slug } = await params;

  const { success, articles } = await getAllPublishedArticles();
  const article = articles.find(a => a.slug === slug);

  if (!success || !article) {
    return {
      title: 'Article Not Found',
    };
  }

  return {
    title: `${article.title} | Blog`,
    description: article.excerpt,
  };
}

export default async function ArticlePage({ params }) {
  // Await params in Next.js 15
  const { slug } = await params;

  const { success, articles } = await getAllPublishedArticles();
  const article = articles.find(a => a.slug === slug);

  if (!success || !article) {
    notFound();
  }

  return (
    <>
      <CustomCursor />
      <Navbar />

      <main className="pt-20 sm:pt-24 min-h-screen">
        <Section className="py-12 sm:py-16 md:py-20">
          <article className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {article.coverImage && (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={article.coverImage}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-8 lg:p-12">
                <header className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <time className="text-sm text-gray-500">
                      {article.publishedAt && !isNaN(new Date(article.publishedAt).getTime())
                        ? new Date(article.publishedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                        : new Date(article.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })
                      }
                    </time>
                  </div>

                  <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                    {article.title}
                  </h1>

                  {article.tags && article.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {article.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <p className="text-xl text-gray-600 leading-relaxed">
                    {article.excerpt}
                  </p>
                </header>

                <div className="prose prose-lg max-w-none">
                  <MarkdownRenderer content={article.content} />
                </div>

                <footer className="mt-12 pt-8 border-t border-gray-200">
                  <div className="text-sm text-gray-500">
                    Published on {article.publishedAt && !isNaN(new Date(article.publishedAt).getTime())
                      ? new Date(article.publishedAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : new Date(article.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                    }
                  </div>
                </footer>
              </div>
            </div>
          </article>
        </Section>
      </main>

      <Footer />
    </>
  );
}
