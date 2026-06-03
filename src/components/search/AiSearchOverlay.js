'use client';

import { useEffect, useState } from 'react';
import Script from 'next/script';

export default function AiSearchOverlay({ isOpen, onClose }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Load Google Gen App Builder Client Script */}
      <Script
        src="https://cloud.google.com/ai/gen-app-builder/client?hl=en_US"
        strategy="afterInteractive"
      />

      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-start justify-center pt-20 px-4 transition-all duration-300"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl p-6 flex flex-col relative border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute right-6 top-6 text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all duration-200"
            aria-label="Close search"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          <div className="mb-4 pr-10">
            <h3 className="text-xl font-bold text-gray-900 tracking-tight">AI Search</h3>
            <p className="text-sm text-gray-500 mt-1">
              Ask anything or search across projects, articles, and courses.
            </p>
          </div>

          <div className="relative mt-2">
            <input
              id="searchWidgetTrigger"
              type="text"
              placeholder="Type your search query here..."
              className="w-full pl-5 pr-12 py-4 text-lg bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              autoFocus
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>

          {/* Render the custom gen-search-widget element on client side */}
          {mounted && (
            <gen-search-widget
              configId="fe23bab7-1bc5-495f-86ad-4dd05e54700f"
              triggerId="searchWidgetTrigger"
            />
          )}
        </div>
      </div>
    </>
  );
}
