'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ForSaleBadge } from '@/components/ui';

/**
 * Project Card - "Immersive Gallery"
 * Full bleed image, parallax hover, minimal typography.
 * Removes the white "card" container.
 */
export default function ProjectCard({ project }) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Link href={`/projects/${project.slug}`} className="group block cursor-none relative">
      {/* Image Container */}
      <div className="relative w-full aspect-[16/10] overflow-hidden rounded-xl bg-gray-200 mb-6">
        <div className="absolute inset-0 transition-transform duration-700 ease-out group-hover:scale-105">
          <Image
            src={project.thumbnail}
            alt={project.title}
            fill
            className={`object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
            unoptimized
          />
        </div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />

        {/* Badges */}
        {project.isForSale && <ForSaleBadge className="top-4 right-4" />}
      </div>

      {/* Minimal Meta Data */}
      <div className="flex justify-between items-baseline border-b border-black/10 pb-4 group-hover:border-black transition-colors duration-500">
        {/* Title */}
        <h3 className="text-2xl md:text-3xl font-serif italic text-black">{project.title}</h3>

        {/* Category */}
        <span className="text-xs font-mono uppercase tracking-widest text-gray-500 group-hover:text-black transition-colors">
          {project.category}
        </span>
      </div>

      {/* Hover Reveal Text (Optional detail below line) */}
      <div className="mt-2 opacity-0 -translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 text-sm text-gray-500">
        {project.description.substring(0, 60)}...
      </div>
    </Link>
  );
}
