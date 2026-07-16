'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button, Card, Section } from '@/components/custom-ui';

export default function LatestArticles({ articles = [] }) {
  if (!articles.length) return null;

  return (
    <Section
      id="technical-writing"
      title="Technical writing and notes"
      description="Recent posts, build notes, and ideas from my developer workflow."
      centered={true}
      className="bg-white"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {articles.map((article) => (
          <Card
            key={article._id || article.id || article.slug}
            variant="bordered"
            interactive={true}
            className="flex h-full flex-col overflow-hidden hover:-translate-y-1 hover:shadow-xl"
          >
            {article.coverImage && (
              <Link href={`/blog/${article.slug}`} className="block overflow-hidden">
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="h-44 w-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </Link>
            )}
            <div className="flex flex-1 flex-col p-6">
              <div className="mb-3 flex flex-wrap gap-2">
                {(article.tags || []).slice(0, 2).map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h3 className="mb-3 text-xl font-bold leading-tight">
                <Link href={`/blog/${article.slug}`} className="hover:opacity-70 transition">
                  {article.title}
                </Link>
              </h3>
              <p className="mb-5 line-clamp-3 text-sm leading-relaxed text-gray-600">
                {article.excerpt}
              </p>
              <Link
                href={`/blog/${article.slug}`}
                className="mt-auto inline-flex items-center gap-2 text-sm font-bold hover:gap-3 transition-all"
              >
                Read post <ArrowRight size={16} />
              </Link>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Button href="/blog" variant="secondary" className="px-8 py-4">
          View All Articles <i className="fas fa-arrow-right ml-3"></i>
        </Button>
      </div>
    </Section>
  );
}
