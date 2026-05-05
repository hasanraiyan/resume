'use client';

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Top rule */}
      <div className="h-1 bg-black" />

      <div className="flex-1 flex items-center justify-center px-6 py-20">
        <div className="max-w-sm w-full">
          {/* Icon */}
          <div className="mb-10">
            <svg
              className="w-16 h-16 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M18.364 5.636l-12.728 12.728M5.636 5.636l12.728 12.728"
              />
            </svg>
          </div>

          <p className="text-[10px] font-bold tracking-[0.3em] uppercase text-neutral-400 mb-4">
            Connection Lost
          </p>
          <h1 className="font-['Playfair_Display'] text-4xl sm:text-5xl font-bold text-black mb-4 leading-tight">
            You&apos;re Offline
          </h1>
          <p className="text-neutral-500 leading-relaxed mb-10">
            No internet connection detected. Check your network and try again — the page will reload
            automatically once you&apos;re back online.
          </p>

          <div className="flex flex-col gap-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-black text-white px-6 py-3.5 text-xs font-bold tracking-widest uppercase hover:bg-neutral-800 transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.history.back()}
              className="w-full border border-neutral-300 text-neutral-600 px-6 py-3.5 text-xs font-bold tracking-widest uppercase hover:border-black hover:text-black transition-colors"
            >
              Go Back
            </button>
          </div>

          <div className="mt-10 pt-6 border-t border-neutral-200">
            <p className="text-xs text-neutral-400 leading-relaxed">
              <span className="font-bold text-neutral-600">Tip —</span> Previously visited pages may
              still be available from your browser cache.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
