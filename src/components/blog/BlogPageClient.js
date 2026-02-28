'use client';

import { useState } from 'react';
import BlogCard from './BlogCard';
import BlogFilters from './BlogFilters';

/**
 * Blog Page Client — Medium-style article feed with dividers.
 */
export default function BlogPageClient({ articles }) {
  const [filteredArticles, setFilteredArticles] = useState(articles);
  const [isLoading, setIsLoading] = useState(false);

  const handleFilterChange = (tag) => {
    setIsLoading(true);
    setTimeout(() => {
      let filtered = articles;
      if (tag && tag !== 'all') {
        filtered = articles.filter((article) =>
          article.tags?.some((articleTag) => articleTag.toLowerCase().includes(tag.toLowerCase()))
        );
      }
      setFilteredArticles(filtered);
      setIsLoading(false);
    }, 150);
  };

  const handleSearch = (query) => {
    setIsLoading(true);
    setTimeout(() => {
      if (query.trim() === '') {
        setFilteredArticles(articles);
      } else {
        const searchTerm = query.toLowerCase();
        const results = articles.filter(
          (article) =>
            article.title.toLowerCase().includes(searchTerm) ||
            article.excerpt.toLowerCase().includes(searchTerm) ||
            article.content.toLowerCase().includes(searchTerm) ||
            article.tags?.some((tag) => tag.toLowerCase().includes(searchTerm))
        );
        setFilteredArticles(results);
      }
      setIsLoading(false);
    }, 150);
  };

  return (
    <>
      <BlogFilters
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        articles={articles}
      />

      {isLoading ? (
        <div className="max-w-2xl mx-auto space-y-8 py-8">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-5 sm:gap-8">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-neutral-200" />
                    <div className="h-3 w-24 bg-neutral-200 rounded" />
                  </div>
                  <div className="h-5 w-4/5 bg-neutral-200 rounded" />
                  <div className="h-4 w-full bg-neutral-100 rounded" />
                  <div className="h-4 w-3/4 bg-neutral-100 rounded" />
                  <div className="flex gap-2">
                    <div className="h-3 w-16 bg-neutral-100 rounded" />
                    <div className="h-3 w-20 bg-neutral-100 rounded" />
                  </div>
                </div>
                <div className="hidden sm:block">
                  <div className="aspect-[4/3] bg-neutral-100 rounded-sm" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="text-center py-20 max-w-md mx-auto">
          <p className="text-xl text-neutral-400 font-light">No articles found</p>
          <p className="text-neutral-400 text-sm mt-2">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <div className="divide-y divide-neutral-100">
            {filteredArticles.map((article) => (
              <div key={article._id} className="py-7 first:pt-0 last:pb-0">
                <BlogCard article={article} />
              </div>
            ))}
          </div>
          <div className="text-center mt-10 text-[13px] text-neutral-400">
            Showing {filteredArticles.length} of {articles.length} articles
          </div>
        </div>
      )}
    </>
  );
}
