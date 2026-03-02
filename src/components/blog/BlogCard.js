'use client';

import Link from 'next/link';
import Image from 'next/image';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faHandsClapping } from '@fortawesome/free-solid-svg-icons';

/**
 * Blog Card Component — Medium-inspired vertical list layout.
 * Clean typography, estimated read time, subtle hover animations.
 */
export default function BlogCard({ article }) {
  const formatDate = (dateString) => {
    if (!dateString || isNaN(new Date(dateString).getTime())) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
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

  return (
    <article className="group">
      <Link href={`/blog/${article.slug}`} className="block">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-5 sm:gap-8 items-start">
          {/* Text content */}
          <div className="min-w-0">
            {/* Author row */}
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-6 h-6 rounded-full bg-neutral-900 flex items-center justify-center shrink-0">
                <span className="text-[10px] font-bold text-white leading-none">R</span>
              </div>
              <span className="text-[13px] font-medium text-neutral-700">Raiyan Hasan</span>
            </div>

            {/* Title */}
            <h3
              className="text-xl sm:text-[22px] font-bold text-neutral-900 leading-snug mb-1.5 group-hover:text-neutral-600 transition-colors duration-200"
              style={{ fontFamily: "'Georgia', 'Noto Serif', serif" }}
            >
              {article.title}
            </h3>

            {/* Excerpt */}
            <p className="text-[15px] text-neutral-500 leading-relaxed line-clamp-2 mb-3">
              {article.excerpt}
            </p>

            {/* Meta row: date · read time · tags */}
            <div className="flex items-center gap-2 flex-wrap text-[13px] text-neutral-400">
              <time dateTime={article.publishedAt || article.createdAt}>{publishDate}</time>
              <span>·</span>
              <span>{readTime}</span>

              {article.tags && article.tags.length > 0 && (
                <>
                  <span>·</span>
                  <span className="inline-flex px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-500 text-[11px] font-medium">
                    {article.tags[0]}
                  </span>
                </>
              )}

              {(article.claps > 0 || article.likes > 0) && (
                <>
                  <span>·</span>
                  {article.claps > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <FontAwesomeIcon
                        icon={faHandsClapping}
                        className="w-3.5 h-3.5 text-neutral-400"
                      />
                      {article.claps}
                    </span>
                  )}
                  {article.likes > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <FontAwesomeIcon icon={faHeart} className="w-3.5 h-3.5 text-neutral-400" />
                      {article.likes}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Thumbnail */}
          <div className="hidden sm:block">
            <div className="aspect-[4/3] relative overflow-hidden rounded-sm bg-neutral-100">
              {article.coverImage ? (
                <Image
                  src={article.coverImage.trimStart()}
                  alt={article.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="lazy"
                  unoptimized={article.coverImage?.includes('utfs.io')}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-neutral-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                    />
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </article>
  );
}
