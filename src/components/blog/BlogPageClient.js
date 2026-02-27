// src/components/blog/BlogPageClient.js

'use client';

import { useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import BlogCard from './BlogCard';
import BlogFilters from './BlogFilters';
import { BlogCardSkeleton } from '@/components/Skeleton';

export default function BlogPageClient({ articles }) {
  const [filteredArticles, setFilteredArticles] = useState(articles);
  const [isLoading, setIsLoading] = useState(false);

  // Cleanup on component mount to ensure fresh state
  useEffect(() => {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    ScrollTrigger.refresh();
  }, []);

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());

    const timer = setTimeout(() => {
      const list = document.querySelector('.articles-list');
      if (list && list.children.length > 0) {
        gsap.set(list.children, { opacity: 1, y: 0 });
        gsap.from(list.children, {
          opacity: 0,
          y: 50,
          duration: 0.8,
          stagger: 0.1,
          scrollTrigger: {
            trigger: list,
            start: 'top 85%',
            toggleActions: 'play none none reverse',
            refreshPriority: -1,
          },
        });
      }
      ScrollTrigger.refresh();
    }, 100);

    return () => {
      clearTimeout(timer);
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, [filteredArticles]);

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
    }, 300);
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
    }, 300);
  };

  return (
    <>
      <BlogFilters onFilterChange={handleFilterChange} onSearch={handleSearch} />

      {isLoading ? (
        <div className="py-8">
          <BlogCardSkeleton />
        </div>
      ) : filteredArticles.length === 0 ? (
        <div className="text-center py-20">
          <i className="fas fa-search text-5xl text-gray-300 mb-4"></i>
          <p className="text-xl text-gray-600">No articles found</p>
          <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
        </div>
      ) : (
        <>
          <div
            key={filteredArticles.length}
            className="articles-list max-w-4xl mx-auto space-y-12 sm:space-y-16"
          >
            {filteredArticles.map((article) => (
              <BlogCard key={article._id} article={article} />
            ))}
          </div>
          <div className="text-center mt-12 sm:mt-16 text-sm text-gray-600">
            Showing <span className="font-semibold">{filteredArticles.length}</span> of{' '}
            <span className="font-semibold">{articles.length}</span> articles
          </div>
        </>
      )}
    </>
  );
}
