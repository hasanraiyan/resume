'use client';

import { useEffect, useState } from 'react';
import useFluidCursor from '@/hooks/useFluidCursor';

export default function FluidCursorCanvas() {
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // On mobile / touch devices, scrolling triggers touchmove/touchstart
    // which paints bright neon fluid blobs across the screen, washing out chat text.
    const isTouch =
      typeof window !== 'undefined' &&
      (window.matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window);
    setIsTouchDevice(isTouch);

    if (isTouch) return;

    const cleanup = useFluidCursor();
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  if (isTouchDevice) return null;

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none opacity-50">
      <canvas id="fluid" className="fixed top-0 left-0 w-full h-full pointer-events-none" />
    </div>
  );
}
