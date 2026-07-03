'use client';

import { useEffect } from 'react';
import useFluidCursor from '@/hooks/useFluidCursor';

export default function FluidCursorCanvas() {
  useEffect(() => {
    const cleanup = useFluidCursor();
    return () => {
      if (cleanup) cleanup();
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 pointer-events-none">
      <canvas id="fluid" className="fixed top-0 left-0 w-full h-full pointer-events-none" />
    </div>
  );
}
