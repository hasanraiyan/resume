// src/components/AnalyticsProvider.js
'use client';

import { createContext, useContext, useEffect } from 'react';
import { getAnalytics } from '@/lib/analytics';

const AnalyticsContext = createContext();

export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
}

export default function AnalyticsProvider({ children }) {
  useEffect(() => {
    // Initialize analytics tracker
    console.log('=== ANALYTICS PROVIDER DEBUG ===');
    console.log('Initializing analytics tracker...');

    const analytics = getAnalytics();
    console.log('Analytics instance created:', !!analytics);
    console.log('Analytics enabled:', analytics.isEnabled);
    console.log('Session ID:', analytics.sessionId);

    // Flush events when page is about to unload
    const handleBeforeUnload = () => {
      console.log('Page unloading, flushing analytics...');
      const analytics = getAnalytics();
      analytics.flush();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      console.log('AnalyticsProvider cleanup, final flush...');
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Final flush of any remaining events
      const analytics = getAnalytics();
      analytics.flush();
    };
  }, []);

  const value = {
    analytics: getAnalytics()
  };

  return (
    <AnalyticsContext.Provider value={value}>
      {children}
    </AnalyticsContext.Provider>
  );
}
