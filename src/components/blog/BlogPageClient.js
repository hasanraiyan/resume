'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import BlogCard from './BlogCard';
import BlogFilters from './BlogFilters';

/**
 * Blog Page Client — Medium-style article feed with dividers.
 */
export default function BlogPageClient({ articles, totalArticles, totalPages, currentPage, search, tag, allTags = [] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const updateFilters = (newTag, newSearch, newPage) => {
    const params = new URLSearchParams(searchParams);

    if (newTag && newTag !== 'all') {
      params.set('tag', newTag);
    } else {
      params.delete('tag');
    }

    if (newSearch) {
      params.set('search', newSearch);
    } else {
      params.delete('search');
    }

    if (newPage && newPage > 1) {
      params.set('page', newPage.toString());
    } else {
      params.delete('page');
    }

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  };

  const handleFilterChange = (selectedTag) => {
    updateFilters(selectedTag, search, 1);
  };

  const handleSearch = (query) => {
    updateFilters(tag, query, 1);
  };

  const handlePageChange = (newPage) => {
    updateFilters(tag, search, newPage);
  };

  return (
    <>
      <BlogFilters
        onFilterChange={handleFilterChange}
        onSearch={handleSearch}
        allTagsList={allTags}
        initialSearch={search}
        initialTag={tag}
      />

      {isPending ? (
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
      ) : articles.length === 0 ? (
        <div className="text-center py-20 max-w-md mx-auto">
          <p className="text-xl text-neutral-400 font-light">No articles found</p>
          <p className="text-neutral-400 text-sm mt-2">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          <div className="divide-y divide-neutral-100">
            {articles.map((article) => (
              <div key={article._id} className="py-7 first:pt-0 last:pb-0">
                <BlogCard article={article} />
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-neutral-100 pt-8 mt-10">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className={`text-sm font-medium transition-colors ${
                  currentPage <= 1
                    ? 'text-neutral-300 cursor-not-allowed'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                &larr; Previous
              </button>

              <div className="text-sm text-neutral-500">
                Page {currentPage} of {totalPages}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className={`text-sm font-medium transition-colors ${
                  currentPage >= totalPages
                    ? 'text-neutral-300 cursor-not-allowed'
                    : 'text-neutral-600 hover:text-black'
                }`}
              >
                Next &rarr;
              </button>
            </div>
          )}

          <div className="text-center mt-6 text-[13px] text-neutral-400">
            Showing {articles.length} of {totalArticles} articles
          </div>
        </div>
      )}
    </>
  );
}
