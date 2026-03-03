'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';

export default function BeforeAfterSlider({ before, after, aspectRatio = '1:1' }) {
  const [sliderPos, setSliderPos] = useState(50);
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef(null);

  const handleMove = (e) => {
    if (!isResizing && e.type !== 'mousemove') return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const x = e.type.includes('touch') ? e.touches[0].pageX : e.pageX;
    const relativeX = x - rect.left;
    const position = Math.max(0, Math.min(100, (relativeX / rect.width) * 100));

    setSliderPos(position);
  };

  const handleMouseDown = () => setIsResizing(true);
  const handleMouseUp = () => setIsResizing(false);

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchend', handleMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, []);

  // Determine aspect ratio class
  const getAspectRatioClass = (ratio) => {
    const map = {
      '1:1': 'aspect-square',
      '16:9': 'aspect-video',
      '9:16': 'aspect-[9/16]',
      '4:3': 'aspect-[4/3]',
      '3:4': 'aspect-[3/4]',
    };
    return map[ratio] || 'aspect-square';
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100 ${getAspectRatioClass(aspectRatio)} select-none cursor-ew-resize`}
      onMouseMove={handleMove}
      onTouchMove={handleMove}
      onMouseDown={handleMouseDown}
      onTouchStart={handleMouseDown}
    >
      {/* After Image (Background) */}
      <div className="absolute inset-0">
        <Image src={after} alt="After" fill className="object-cover" draggable={false} />
        <div className="absolute bottom-4 right-4 bg-black/50 backdrop-blur-md text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
          After
        </div>
      </div>

      {/* Before Image (Foreground with Clip) */}
      <div
        className="absolute inset-0 z-10"
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
      >
        <Image src={before} alt="Before" fill className="object-cover" draggable={false} />
        <div className="absolute bottom-4 left-4 bg-black/50 backdrop-blur-md text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
          Before
        </div>
      </div>

      {/* Slider Line */}
      <div
        className="absolute inset-y-0 z-20 w-0.5 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)]"
        style={{ left: `${sliderPos}%` }}
      >
        {/* Slider Handle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-xl flex items-center justify-center border-2 border-neutral-200">
          <div className="flex gap-0.5">
            <i className="fas fa-chevron-left text-[10px] text-neutral-400"></i>
            <i className="fas fa-chevron-right text-[10px] text-neutral-400"></i>
          </div>
        </div>
      </div>
    </div>
  );
}
