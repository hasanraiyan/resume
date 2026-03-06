import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingScreen({ title, subtitle }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center relative bg-neutral-50 overflow-hidden w-full">
      <div
        className="absolute inset-0 z-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />
      <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none bg-gradient-to-b from-transparent via-black to-transparent w-full h-[20%] animate-scanline" />
      <div className="relative z-10 text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-white border-2 border-black rounded-2xl flex items-center justify-center mb-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <Loader2 className="w-6 h-6 text-black animate-spin" />
        </div>
        <h3 className="text-2xl font-semibold tracking-tighter text-black mb-2 uppercase">
          {title}
        </h3>
        <p className="text-neutral-500 text-sm max-w-sm tracking-wide">{subtitle}</p>
      </div>
    </div>
  );
}
