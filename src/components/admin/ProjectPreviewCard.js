'use client';

import Image from 'next/image';
import { Badge } from '@/components/ui';

export default function ProjectPreviewCard({ project }) {
  const { title, category, description, tags, thumbnail } = project;

  return (
    <div className="group block border-2 border-dashed border-neutral-300 rounded-lg p-4 bg-neutral-50">
      <div className="relative overflow-hidden rounded-lg mb-4 aspect-[4/3] bg-neutral-200">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={title || 'Project thumbnail'}
            fill
            className="object-cover"
            // Add a key to force re-render when src changes, preventing stale images
            key={thumbnail}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-neutral-400">
            <i className="fas fa-image text-4xl"></i>
          </div>
        )}
        {project.isForSale && (
          <div className="absolute top-2 right-2">
            <Badge variant="success" className="bg-green-600 text-white text-xs font-bold">
              FOR SALE
            </Badge>
          </div>
        )}
      </div>

      <div>
        <div className="text-xs font-semibold tracking-widest mb-2 text-neutral-500 uppercase">
          {category || 'Category'}
        </div>
        <h3 className="text-xl font-bold mb-3 text-black">{title || 'Project Title'}</h3>
        <p className="text-sm text-neutral-600 mb-4 leading-relaxed line-clamp-2">
          {description ||
            'This is a short description of the project. It gives a brief overview of the work.'}
        </p>
        <div className="flex flex-wrap gap-2">
          {tags?.length > 0 && tags[0]?.name ? (
            tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="tag">
                {tag.name}
              </Badge>
            ))
          ) : (
            <>
              <Badge variant="tag">Tech 1</Badge>
              <Badge variant="tag">Tech 2</Badge>
              <Badge variant="tag">Tech 3</Badge>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
