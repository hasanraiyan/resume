'use client';

import { useState, useEffect, useCallback } from 'react';
import { CoursifyBlockRenderer } from '@/components/coursify/reader/CoursifyBlockRenderer';
import { BlockSkeleton } from '@/components/coursify/BlockSkeleton';
import { RotateCcw } from 'lucide-react';

const MAX_AUTO_RETRIES = 3;
const RETRY_DELAY = 400;

export function SafeBlockRenderer({ content, isComplete = false }) {
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showManualRetry, setShowManualRetry] = useState(false);

  // Auto-retry when content changes or completes
  useEffect(() => {
    if (isComplete && error && retryCount < MAX_AUTO_RETRIES) {
      const timer = setTimeout(() => {
        setError(false);
        setRetryCount((prev) => prev + 1);
      }, RETRY_DELAY);
      return () => clearTimeout(timer);
    }

    if (error && retryCount >= MAX_AUTO_RETRIES) {
      setShowManualRetry(true);
    }
  }, [error, isComplete, retryCount]);

  const handleManualRetry = () => {
    setError(false);
    setRetryCount((prev) => prev + 1);
    setShowManualRetry(false);
  };

  if (error && showManualRetry) {
    return (
      <div className="my-6 rounded-2xl bg-red-50 border border-red-200 p-4 flex items-center justify-between">
        <p className="text-xs text-red-700 font-medium">Failed to render block</p>
        <button
          onClick={handleManualRetry}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-100 text-red-700 text-xs font-bold rounded-lg hover:bg-red-200 transition-all"
        >
          <RotateCcw className="w-3 h-3" />
          Retry
        </button>
      </div>
    );
  }

  if (error) {
    return <BlockSkeleton />;
  }

  return (
    <div onError={() => setError(true)}>
      <CoursifyBlockRenderer content={content} />
    </div>
  );
}
