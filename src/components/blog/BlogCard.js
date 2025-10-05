
'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui'

/**
 * Blog Card Component - Redesigned for a vertical list view (Medium-inspired)
 */
export default function BlogCard({ article }) {
  const formattedDate = (dateString) => {
    if (!dateString || isNaN(new Date(dateString).getTime())) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const publishDate = formattedDate(article.publishedAt) || formattedDate(article.createdAt);

  return (
    <article>
      <Link href={`/blog/${article.slug}`} className="group block hover-target">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 sm:gap-8 items-start">
          {/* Main Content */}
          <div className="sm:col-span-3">
            <time className="text-xs font-semibold tracking-widest text-gray-500 uppercase" dateTime={article.publishedAt || article.createdAt}>
              {publishDate}
            </time>
            <h3 className="text-2xl sm:text-3xl font-bold my-3 text-black group-hover:text-gray-700 transition font-['Playfair_Display']">
              {article.title}
            </h3>
            <p className="text-base text-gray-600 mb-4 leading-relaxed line-clamp-3">
              {article.excerpt}
            </p>
            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {article.tags.slice(0, 3).map((tag, index) => (
                  <Badge key={index} variant="tag" className="bg-blue-50 text-blue-700">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Image */}
          <div className="sm:col-span-1">
            <div className="aspect-square relative overflow-hidden rounded-lg bg-gray-100 image-reveal">
              <Image
                src={article.coverImage || '/placeholder-image.jpg'}
                alt={article.title}
                fill
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 -z-10">
                <i className="fas fa-newspaper text-3xl text-gray-300"></i>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </article>
  )
}