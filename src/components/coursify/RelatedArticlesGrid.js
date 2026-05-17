'use client';

import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/utils/classNames';

export function RelatedArticlesGrid({ articles, variant = 'grid' }) {
  if (!articles || articles.length === 0) {
    return null;
  }

  if (variant === 'list') {
    return (
      <div className="pt-4 border-t-2 border-[#d4e6de]">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#f0f5f2] border border-[#d4e6de]">
            <Sparkles className="w-4 h-4 text-[#1f644e]" />
          </div>
          <h2 className="text-lg font-bold text-[#1e3a34]">Explore Related Topics</h2>
        </div>

        <div className="space-y-3">
          {articles.map((article, idx) => (
            <Link
              key={article.slug}
              href={`/coursify/r/${article.slug}`}
              className="group flex items-start gap-4 p-4 rounded-lg border border-[#e5e3d8] hover:border-[#1f644e] hover:bg-[#fcfbf5] transition-all duration-200"
            >
              {/* Index Circle */}
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#f0f5f2] border border-[#d4e6de] flex items-center justify-center">
                <span className="text-xs font-bold text-[#1f644e]">{idx + 1}</span>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-[#1e3a34] group-hover:text-[#1f644e] transition-colors line-clamp-2">
                  {article.title}
                </p>
                {article.snippet && (
                  <p className="text-xs text-[#7c8e88] line-clamp-2 mt-1.5 leading-relaxed">
                    {article.snippet}
                  </p>
                )}
              </div>

              {/* Arrow */}
              <div className="flex-shrink-0 pt-0.5">
                <ArrowRight className="w-4 h-4 text-[#b5c4be] group-hover:text-[#1f644e] group-hover:translate-x-1 transition-all duration-200" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    );
  }

  // Grid variant (default)
  return (
    <div className="mt-16 pt-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-[#f0f5f2] border border-[#d4e6de]">
          <Sparkles className="w-4 h-4 text-[#1f644e]" />
        </div>
        <h3 className="text-base font-bold text-[#1e3a34]">Related Reading</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {articles.map((article) => (
          <Link
            key={article.slug}
            href={`/coursify/r/${article.slug}`}
            className="group relative p-5 rounded-xl border border-[#e5e3d8] hover:border-[#1f644e] bg-white hover:bg-[#fcfbf5] transition-all duration-200 overflow-hidden"
          >
            {/* Accent bar */}
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#1f644e] to-[#1f644e]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

            {/* Content */}
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-sm text-[#1e3a34] group-hover:text-[#1f644e] transition-colors line-clamp-1 flex-1">
                  {article.title}
                </h4>
                <div className="flex-shrink-0 pt-0.5">
                  <ArrowRight className="w-3.5 h-3.5 text-[#b5c4be] group-hover:text-[#1f644e] group-hover:translate-x-0.5 transition-all duration-200" />
                </div>
              </div>

              {article.snippet && (
                <p className="text-xs text-[#7c8e88] line-clamp-2 leading-relaxed">
                  {article.snippet}
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
