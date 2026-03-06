import React, { memo, useState, useEffect } from 'react';
import { Loader2, XCircle, X } from 'lucide-react';

export const SlideThumbnail = memo(({ slide, index, isActive, onClick, onDelete, totalSlides }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    setImageLoaded(false);
  }, [slide?.imageUrl]);

  const showLoader =
    slide.status === 'generating' || (slide.imageUrl && slide.imageUrl !== 'error' && !imageLoaded);

  return (
    <button
      onClick={() => onClick(index)}
      className={`group relative flex flex-col gap-2 p-2 transition-all outline-none rounded-xl ${
        isActive ? 'bg-white shadow-sm ring-2 ring-black' : 'hover:bg-neutral-200/50'
      }`}
    >
      <div
        className={`w-full aspect-video rounded-lg overflow-hidden border relative ${isActive ? 'border-transparent' : 'border-neutral-200 opacity-80 group-hover:opacity-100'}`}
      >
        {showLoader && (
          <div className="absolute inset-0 z-20 bg-white flex flex-col items-center justify-center gap-1.5">
            <div className="flex gap-1">
              <span
                className="w-1 h-1 bg-black rounded-full"
                style={{ animation: 'dotPulse 1.4s ease-in-out infinite' }}
              />
              <span
                className="w-1 h-1 bg-black rounded-full"
                style={{ animation: 'dotPulse 1.4s ease-in-out 0.2s infinite' }}
              />
              <span
                className="w-1 h-1 bg-black rounded-full"
                style={{ animation: 'dotPulse 1.4s ease-in-out 0.4s infinite' }}
              />
            </div>
          </div>
        )}
        {slide.imageUrl && slide.imageUrl !== 'error' ? (
          <img
            src={slide.imageUrl}
            alt=""
            className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoad={() => setImageLoaded(true)}
          />
        ) : slide.status === 'failed' || slide.imageUrl === 'error' ? (
          <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
            <XCircle className="w-4 h-4 text-neutral-400" />
          </div>
        ) : (
          slide.status !== 'generating' && (
            <div className="w-full h-full bg-neutral-100 flex items-center justify-center">
              <Loader2 className="w-4 h-4 text-neutral-400 animate-spin" />
            </div>
          )
        )}
      </div>
      <div className="flex items-center justify-between w-full px-1">
        <span
          className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-black' : 'text-neutral-400'}`}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
        {totalSlides > 1 && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onDelete(index);
            }}
            className="opacity-0 group-hover:opacity-100 text-neutral-400 hover:text-black transition-opacity"
          >
            <X className="w-3 h-3" />
          </span>
        )}
      </div>
    </button>
  );
});
SlideThumbnail.displayName = 'SlideThumbnail';
