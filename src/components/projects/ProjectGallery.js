'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

// Helper function to extract YouTube video ID from URL
function getYouTubeVideoId(url) {
  if (!url || typeof url !== 'string') return null;

  try {
    // Handle youtu.be format
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) return shortMatch[1].split('?')[0]; // Remove any query params

    // Handle youtube.com/watch?v= format
    const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (longMatch) return longMatch[1].split('&')[0]; // Remove any additional params

    // Handle youtube.com/embed/ format
    const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
    if (embedMatch) return embedMatch[1].split('?')[0]; // Remove any query params

    return null;
  } catch (error) {
    console.error('Error parsing YouTube URL:', error);
    return null;
  }
}

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
  const currentItem = images[activeImage];

  // Enhanced video detection - check both type field and URL pattern
  const isVideo =
    currentItem?.type === 'video' ||
    (currentItem?.url &&
      (currentItem.url.includes('youtube.com') || currentItem.url.includes('youtu.be')));

  const videoId = isVideo ? getYouTubeVideoId(currentItem.url) : null;

  return (
    <div className="space-y-3">
      {/* Main Media with Carousel Controls */}
      <div className="relative group">
        <div className="image-reveal rounded-lg overflow-hidden shadow-2xl bg-gray-100">
          <div className="relative w-full" style={{ minHeight: '400px' }}>
            {isVideo && videoId ? (
              // YouTube Video Embed
              <div className="relative w-full aspect-video">
                <iframe
                  className="absolute inset-0 w-full h-full rounded-lg"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={currentItem.alt || 'YouTube video'}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
            ) : (
              <>
                {/* Blurred background */}
                <div
                  className="absolute inset-0 blur-sm scale-110"
                  style={{
                    backgroundImage: `url(${currentItem.url})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    filter: 'blur(8px)',
                    transform: 'scale(1.1)',
                  }}
                />
                {/* Main image */}
                <img
                  src={currentItem.url}
                  alt={currentItem.alt}
                  className="relative z-10 w-full h-full object-contain bg-transparent transition-opacity duration-300"
                  style={{ maxHeight: '600px' }}
                />
              </>
            )}

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

          {currentItem.caption && (
            <div className="bg-gray-50 px-4 py-2">
              <p className="text-sm text-gray-600 text-center">{currentItem.caption}</p>
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
              {visibleThumbnails.map((item, index) => {
                const actualIndex = thumbnailStart + index;
                // Enhanced video detection for thumbnails
                const itemIsVideo =
                  item.type === 'video' ||
                  (item.url && (item.url.includes('youtube.com') || item.url.includes('youtu.be')));
                const itemVideoId = itemIsVideo ? getYouTubeVideoId(item.url) : null;
                const thumbnailUrl =
                  itemIsVideo && itemVideoId
                    ? `https://img.youtube.com/vi/${itemVideoId}/mqdefault.jpg`
                    : item.url;

                return (
                  <button
                    key={item.url + actualIndex}
                    onClick={() => setActiveImage(actualIndex)}
                    className={`relative flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 rounded overflow-hidden transition-all duration-200 ring-offset-1 ${
                      activeImage === actualIndex
                        ? 'ring-2 ring-black scale-105'
                        : 'opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img
                      src={thumbnailUrl}
                      alt={item.alt}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    {itemIsVideo && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                        </svg>
                      </div>
                    )}
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
