'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

export default function ProjectGallery({ images }) {
  const [activeImage, setActiveImage] = useState(0);
  const [thumbnailStart, setThumbnailStart] = useState(0);
  const thumbnailRef = useRef(null);

  const THUMBNAILS_TO_SHOW = 6; // Show 6 thumbnails at once

  const nextImage = useCallback(() => {
    setActiveImage((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const prevImage = useCallback(() => {
    setActiveImage((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const nextThumbnails = () => {
    if (thumbnailStart + THUMBNAILS_TO_SHOW < images.length) {
      setThumbnailStart((prev) => prev + 1);
    }
  };

  const prevThumbnails = () => {
    if (thumbnailStart > 0) {
      setThumbnailStart((prev) => prev - 1);
    }
  };

  // Auto-scroll thumbnails to keep active image visible
  useEffect(() => {
    if (activeImage < thumbnailStart) {
      setThumbnailStart(activeImage);
    } else if (activeImage >= thumbnailStart + THUMBNAILS_TO_SHOW) {
      setThumbnailStart(activeImage - THUMBNAILS_TO_SHOW + 1);
    }
  }, [activeImage, thumbnailStart]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.key === 'ArrowLeft') prevImage();
      if (e.key === 'ArrowRight') nextImage();
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nextImage, prevImage]);

  if (!images || images.length === 0) return null;

  const visibleThumbnails = images.slice(thumbnailStart, thumbnailStart + THUMBNAILS_TO_SHOW);

  return (
    <div className="space-y-3">
      {/* Main Image with Carousel Controls */}
      <div className="relative group">
        <div className="image-reveal rounded-lg overflow-hidden shadow-2xl bg-gray-100">
          <div className="relative w-full min-h-[400px] max-h-[600px]">
            {/* Blurred background */}
            <div
              className="absolute inset-0 blur-sm scale-110"
              style={{
                backgroundImage: `url(${images[activeImage].url})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                filter: 'blur(8px)',
                transform: 'scale(1.1)',
              }}
            />
            {/* Main image */}
            <img
              src={images[activeImage].url}
              alt={images[activeImage].alt}
              className="relative z-10 w-full h-full object-contain bg-transparent transition-opacity duration-300"
              style={{ maxHeight: '600px' }}
            />

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 backdrop-blur-sm z-20"
                  aria-label="Previous image"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100 backdrop-blur-sm z-20"
                  aria-label="Next image"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </>
            )}

            {/* Image Counter */}
            {images.length > 1 && (
              <div className="absolute bottom-4 right-4 bg-black/40 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm z-20">
                {activeImage + 1} / {images.length}
              </div>
            )}
          </div>

          {images[activeImage].caption && (
            <div className="bg-gray-50 px-4 py-2">
              <p className="text-sm text-gray-600 text-center">{images[activeImage].caption}</p>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail Carousel */}
      {images.length > 1 && (
        <div className="relative">
          <div className="flex items-center gap-2">
            {/* Previous thumbnails button */}
            {thumbnailStart > 0 && (
              <button
                onClick={prevThumbnails}
                className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                aria-label="Previous thumbnails"
              >
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
            )}

            {/* thumbnails */}
            <div className="flex gap-2 overflow-hidden" ref={thumbnailRef}>
              {visibleThumbnails.map((image, index) => {
                const actualIndex = thumbnailStart + index;
                return (
                  <button
                    key={image.url + actualIndex}
                    onClick={() => setActiveImage(actualIndex)}
                    className={`relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded overflow-hidden transition-all duration-200 ring-offset-1 ${
                      activeImage === actualIndex
                        ? 'ring-2 ring-black scale-105'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={image.url}
                      alt={image.alt}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </button>
                );
              })}
            </div>

            {/* Next thumbnails button */}
            {thumbnailStart + THUMBNAILS_TO_SHOW < images.length && (
              <button
                onClick={nextThumbnails}
                className="flex-shrink-0 p-1 hover:bg-gray-100 rounded transition-colors"
                aria-label="Next thumbnails"
              >
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Thumbnail indicators */}
          {images.length > THUMBNAILS_TO_SHOW && (
            <div className="flex justify-center mt-2 gap-1">
              {Array.from({ length: Math.ceil(images.length / THUMBNAILS_TO_SHOW) }).map(
                (_, index) => (
                  <button
                    key={index}
                    onClick={() => setThumbnailStart(index * THUMBNAILS_TO_SHOW)}
                    className={`w-1.5 h-1.5 rounded-full transition-colors ${
                      Math.floor(thumbnailStart / THUMBNAILS_TO_SHOW) === index
                        ? 'bg-black'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                )
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
