'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui'

/**
 * Project Card Component - CLEAN & MINIMAL
 * Using Next.js Link for better performance
 */
export default function ProjectCard({ project }) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  // Debug logging for image loading issues
  const handleImageLoad = () => {
    console.log(`Image loaded successfully: ${project.title}`)
    setImageLoaded(true)
  }
  
  const handleImageError = (e) => {
    console.error(`Image failed to load for ${project.title}:`, e.target.src)
    setImageError(true)
  }

  return (
    <Link 
      href={`/projects/${project.slug}`}
      className="group block hover-target"
    >
      {/* Project Image - Fixed aspect ratio */}
      <div className="relative overflow-hidden rounded-lg mb-4 sm:mb-5 image-reveal">
        <div className="aspect-[4/3] bg-gray-200 flex items-center justify-center">
          {!imageError ? (
            <img 
              src={project.thumbnail} 
              alt={project.title}
              className="w-full h-full object-cover transition-transform duration-300"
              loading="lazy"
              onLoad={handleImageLoad}
              onError={handleImageError}
              crossOrigin="anonymous"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              <i className="fas fa-image text-4xl"></i>
            </div>
          )}
          
          {/* Loading state - only show if image hasn't loaded yet */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-200 z-10">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-400"></div>
            </div>
          )}
        </div>
        
        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300"></div>
      </div>

      {/* Project Info */}
      <div>
        {/* Category */}
        <div className="text-xs font-semibold tracking-widest mb-2 text-gray-600 uppercase">
          {project.category}
        </div>
        
        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-bold mb-3 group-hover:text-gray-600 transition">
          {project.title}
        </h3>
        
        {/* Description - 2 lines max with custom truncation */}
        <p className="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed overflow-hidden" 
           style={{ 
             display: '-webkit-box',
             WebkitLineClamp: 2,
             WebkitBoxOrient: 'vertical'
           }}>
          {project.description}
        </p>
        
        {/* Tech Tags - Show only 3 */}
        <div className="flex flex-wrap gap-2">
          {project.tags.slice(0, 3).map((tag) => (
            <Badge key={tag.id} variant="tag">
              {tag.name}
            </Badge>
          ))}
          {project.tags.length > 3 && (
            <Badge variant="tag">
              +{project.tags.length - 3}
            </Badge>
          )}
        </div>
      </div>
    </Link>
  )
}