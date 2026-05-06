'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

function getYouTubeVideoId(url) {
  if (!url || typeof url !== 'string') return null;
  try {
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
    if (shortMatch) return shortMatch[1].split('?')[0];
    const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
    if (longMatch) return longMatch[1].split('&')[0];
    const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/);
    if (embedMatch) return embedMatch[1].split('?')[0];
    return null;
  } catch {
    return null;
  }
}

const pad = (n) => String(n).padStart(2, '0');

export default function ProjectGallery({ images }) {
  const [activeImage, setActiveImage] = useState(0);
  const [thumbnailStart, setThumbnailStart] = useState(0);
  const thumbnailRef = useRef(null);
  const THUMBNAILS_TO_SHOW = 6;

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

  useEffect(() => {
    if (activeImage < thumbnailStart) {
      setThumbnailStart(activeImage);
    } else if (activeImage >= thumbnailStart + THUMBNAILS_TO_SHOW) {
      setThumbnailStart(activeImage - THUMBNAILS_TO_SHOW + 1);
    }
  }, [activeImage, thumbnailStart]);

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

  const isVideo =
    currentItem?.type === 'video' ||
    (currentItem?.url &&
      (currentItem.url.includes('youtube.com') || currentItem.url.includes('youtu.be')));
  const videoId = isVideo ? getYouTubeVideoId(currentItem.url) : null;

  return (
    <div>
      {/* Header bar */}
      <div className="flex items-center justify-between py-2">
        <div className="flex items-center gap-3">
          <span className="font-mono text-[10px] tracking-[0.25em] text-gray-300 uppercase select-none">
            {isVideo ? 'Video' : 'Image'}
          </span>
          {images.length > 1 && (
            <>
              <span className="inline-block w-px h-3 bg-gray-200" />
              <span className="font-mono text-[10px] tracking-[0.18em] text-gray-400 select-none">
                {pad(activeImage + 1)}
                <span className="text-gray-300 mx-1.5">—</span>
                {pad(images.length)}
              </span>
            </>
          )}
        </div>

        {images.length > 1 && (
          <div className="flex items-center gap-0">
            <button
              onClick={prevImage}
              className="group px-2.5 py-1 transition-colors hover:bg-gray-50 border border-transparent hover:border-gray-200 cursor-pointer"
              aria-label="Previous image"
            >
              <svg
                className="w-3 h-3 text-gray-400 transition-colors group-hover:text-gray-800"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextImage}
              className="group px-2.5 py-1 transition-colors hover:bg-gray-50 border border-transparent hover:border-gray-200 cursor-pointer"
              aria-label="Next image"
            >
              <svg
                className="w-3 h-3 text-gray-400 transition-colors group-hover:text-gray-800"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Main viewer */}
      <div
        className="relative bg-[#0a0a0a] w-full overflow-hidden"
        style={{ height: images.length > 1 ? '420px' : '300px' }}
      >
        {isVideo && videoId ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full h-full">
              <iframe
                className="absolute inset-0 w-full h-full"
                src={`https://www.youtube.com/embed/${videoId}`}
                title={currentItem.alt || 'YouTube video'}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            </div>
          </div>
        ) : (
          <img
            src={currentItem.url}
            alt={currentItem.alt}
            className="absolute inset-0 w-full h-full"
            style={{ objectFit: 'contain' }}
          />
        )}

        {/* Viewfinder corner markers */}
        <div className="absolute top-4 left-4 w-5 h-5 border-t border-l border-white/15 pointer-events-none" />
        <div className="absolute top-4 right-4 w-5 h-5 border-t border-r border-white/15 pointer-events-none" />
        <div className="absolute bottom-4 left-4 w-5 h-5 border-b border-l border-white/15 pointer-events-none" />
        <div className="absolute bottom-4 right-4 w-5 h-5 border-b border-r border-white/15 pointer-events-none" />
      </div>

      {/* Caption — photo credit style */}
      {currentItem.caption && (
        <div className="py-2 border-b border-gray-200">
          <p className="font-mono text-[10px] tracking-[0.15em] text-gray-400 uppercase">
            <span className="mr-1.5 text-gray-300">↳</span>
            {currentItem.caption}
          </p>
        </div>
      )}

      {/* Filmstrip */}
      {images.length > 1 && (
        <div className="mt-3">
          <div
            className="flex items-stretch border border-gray-200 overflow-hidden"
            style={{ height: '90px' }}
          >
            {/* Prev page */}
            <button
              onClick={prevThumbnails}
              disabled={thumbnailStart === 0}
              className="flex-shrink-0 w-7 flex items-center justify-center border-r border-gray-200 hover:bg-gray-50 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              aria-label="Previous thumbnails"
            >
              <svg
                className="w-2.5 h-2.5 text-gray-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            {/* Thumbnail cells */}
            <div className="flex flex-1 overflow-hidden items-stretch" ref={thumbnailRef}>
              {visibleThumbnails.map((item, index) => {
                const actualIndex = thumbnailStart + index;
                const itemIsVideo =
                  item.type === 'video' ||
                  (item.url && (item.url.includes('youtube.com') || item.url.includes('youtu.be')));
                const itemVideoId = itemIsVideo ? getYouTubeVideoId(item.url) : null;
                const thumbnailUrl =
                  itemIsVideo && itemVideoId
                    ? `https://img.youtube.com/vi/${itemVideoId}/mqdefault.jpg`
                    : item.url;
                const isActive = activeImage === actualIndex;

                return (
                  <button
                    key={item.url + actualIndex}
                    onClick={() => setActiveImage(actualIndex)}
                    className={`relative flex-shrink-0 h-full overflow-hidden transition-opacity duration-150 ${
                      index < visibleThumbnails.length - 1 ? 'border-r border-gray-200' : ''
                    } ${isActive ? 'opacity-100' : 'opacity-35 hover:opacity-65'}`}
                    style={{ aspectRatio: '4/3' }}
                    aria-label={`View image ${actualIndex + 1}`}
                  >
                    <img
                      src={thumbnailUrl}
                      alt={item.alt}
                      className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* Active indicator — top edge bar */}
                    {isActive && <div className="absolute top-0 left-0 right-0 h-[2px] bg-black" />}

                    {/* Video play indicator */}
                    {itemIsVideo && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-6 h-6 bg-white/90 flex items-center justify-center">
                          <svg
                            className="w-2.5 h-2.5 text-black ml-0.5"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Frame number */}
                    <div
                      className={`absolute bottom-0 left-0 px-1 py-0.5 ${isActive ? 'bg-black' : 'bg-black/50'}`}
                    >
                      <span className="font-mono text-[8px] text-white tracking-widest leading-none">
                        {pad(actualIndex + 1)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Next page */}
            <button
              onClick={nextThumbnails}
              disabled={thumbnailStart + THUMBNAILS_TO_SHOW >= images.length}
              className="flex-shrink-0 w-7 flex items-center justify-center border-l border-gray-200 hover:bg-gray-50 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              aria-label="Next thumbnails"
            >
              <svg
                className="w-2.5 h-2.5 text-gray-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Page indicators — horizontal dashes */}
          {images.length > THUMBNAILS_TO_SHOW && (
            <div className="flex justify-center items-center mt-3 gap-2">
              {Array.from({ length: Math.ceil(images.length / THUMBNAILS_TO_SHOW) }).map(
                (_, index) => {
                  const isCurrentPage = Math.floor(thumbnailStart / THUMBNAILS_TO_SHOW) === index;
                  return (
                    <button
                      key={index}
                      onClick={() => setThumbnailStart(index * THUMBNAILS_TO_SHOW)}
                      className="py-1.5 flex items-center"
                      aria-label={`Thumbnail page ${index + 1}`}
                    >
                      <span
                        className={`block h-px transition-all duration-200 ${
                          isCurrentPage ? 'w-5 bg-black' : 'w-2.5 bg-gray-300 hover:bg-gray-500'
                        }`}
                      />
                    </button>
                  );
                }
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
