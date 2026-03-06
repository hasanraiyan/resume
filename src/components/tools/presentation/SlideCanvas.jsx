import React, { memo, useState, useEffect } from 'react';
import { Loader2, XCircle } from 'lucide-react';

export const SlideCanvas = memo(({ slide }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  // Reset loaded state when imageUrl changes
  useEffect(() => {
    setImageLoaded(false);
  }, [slide?.imageUrl]);

  if (!slide) return null;

  const showLoader =
    slide.status === 'generating' || (slide.imageUrl && slide.imageUrl !== 'error' && !imageLoaded);

  return (
    <div className="w-full max-w-4xl aspect-video bg-white shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-neutral-200 relative flex items-center justify-center overflow-hidden transition-all duration-300 z-10">
      {showLoader && (
        <div className="absolute inset-0 z-20 bg-white flex flex-col items-center justify-center">
          <Loader2 className="w-6 h-6 text-black animate-spin stroke-[1.5]" />
          <div className="mt-6 flex flex-col items-center gap-2.5">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-black">
              {slide.status === 'generating' ? 'Rendering Slide' : 'Loading Image'}
            </span>
            <div className="flex gap-1.5">
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
        </div>
      )}

      {slide.imageUrl && slide.imageUrl !== 'error' ? (
        <img
          src={slide.imageUrl}
          alt="Slide canvas"
          className={`w-full h-full object-cover transition-opacity duration-300 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setImageLoaded(true)}
        />
      ) : slide.status === 'failed' || slide.imageUrl === 'error' ? (
        <div className="text-center space-y-3">
          <XCircle className="w-8 h-8 text-neutral-400 mx-auto" />
          <p className="text-black font-semibold uppercase tracking-widest text-xs">
            Failed to render
          </p>
          <p className="text-[10px] text-neutral-500 max-w-[250px] uppercase">{slide.error}</p>
        </div>
      ) : (
        slide.status !== 'generating' && (
          <div className="flex flex-col items-center gap-4 text-neutral-400">
            <Loader2 className="w-6 h-6 animate-spin text-black" />
            <span className="text-[10px] font-black uppercase tracking-widest text-black">
              Initializing
            </span>
          </div>
        )
      )}
    </div>
  );
});
SlideCanvas.displayName = 'SlideCanvas';
