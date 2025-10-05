'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

/**
 * Blog Card Component - Matches ProjectCard design
 */
export default function BlogCard({ article }) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const handleImageLoad = () => {
    setImageLoaded(true)
  }

  const handleImageError = (e) => {
    setImageError(true)
  }

  return (
    <Link
      href={`/blog/${article.slug}`}
      className="group block hover-target"
    >
      {/* Article Image - Fixed aspect ratio */}
      <div className="relative overflow-hidden rounded-lg mb-4 sm:mb-5 image-reveal">
        <div className="aspect-[4/3] bg-gray-200 flex items-center justify-center">
          {!imageError ? (
            <Image
              src={article.coverImage || '/placeholder-image.jpg'}
              alt={article.title}
              fill
              className={`w-full h-full object-cover transition-all duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
              onLoad={handleImageLoad}
              onError={handleImageError}
              unoptimized={true}
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <i className="fas fa-newspaper text-4xl"></i>
            </div>
          )}

          {/* Loading state */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-400"></div>
            </div>
          )}
        </div>

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-all duration-300"></div>
      </div>

      {/* Article Info */}
      <div>
        {/* Date */}
        <div className="text-xs font-semibold tracking-widest mb-2 text-gray-600 uppercase">
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
        </div>

        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-bold mb-3 group-hover:text-gray-600 transition">
          {article.title}
        </h3>

        {/* Excerpt - 2 lines max */}
        <p className="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed overflow-hidden"
           style={{
             display: '-webkit-box',
             WebkitLineClamp: 2,
             WebkitBoxOrient: 'vertical'
           }}>
          {article.excerpt}
        </p>

        {/* Tags - Show only 3 */}
        {article.tags && article.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {article.tags.slice(0, 3).map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {tag}
              </span>
            ))}
            {article.tags.length > 3 && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                +{article.tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  )
}
