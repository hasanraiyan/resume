'use client'

import { useState } from 'react'

export default function ProjectGallery({ images }) {
  const [activeImage, setActiveImage] = useState(0)

  if (!images || images.length === 0) return null

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="image-reveal rounded-lg overflow-hidden shadow-2xl">
        <img src={images[activeImage].url} alt={images[activeImage].alt} className="w-full h-auto" />
        {images[activeImage].caption && (
          <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4">
            <p className="text-sm text-gray-600 text-center">{images[activeImage].caption}</p>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-4 gap-3 sm:gap-4">
          {images.map((image, index) => (
            <button
              key={image.url + index} // Use a more unique key
              onClick={() => setActiveImage(index)}
              // FIX: Apply aspect-ratio to the container, not the image
              className={`relative aspect-[4/3] rounded overflow-hidden transition ring-offset-2 ${
                activeImage === index
                  ? 'ring-2 ring-black'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <img 
                src={image.url} 
                alt={image.alt}
                // FIX: Fill the container instead of fixed height
                className="absolute inset-0 w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}