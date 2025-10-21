// src/components/AnalyticsProvider.js
'use client';

import { createContext, useContext, useEffect } from 'react';
import { getAnalytics } from '@/lib/analytics';
import { useSession } from 'next-auth/react';

const AnalyticsContext = createContext();

/**
 * Custom hook to access the analytics context.
 *
 * @returns {Object} Analytics context object containing the analytics instance
 * @throws {Error} When used outside of an AnalyticsProvider
 */
export function useAnalyticsContext() {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error('useAnalyticsContext must be used within an AnalyticsProvider');
  }
  return context;
}

/**
 * React context provider that initializes and manages analytics tracking.
 *
 * This provider sets up the analytics system, handles user session integration,
 * and ensures proper cleanup of analytics events on page unload. It safely
 * handles cases where the session provider might not be available.
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render
 * @returns {JSX.Element} Provider component wrapping children
 */
export default function AnalyticsProvider({ children }) {
  // Safely handle useSession - it might not be available if SessionProvider isn't in the component tree
  let session = null;
  let status = 'unauthenticated';

  try {
    const sessionData = useSession();
    session = sessionData?.data;
    status = sessionData?.status || 'unauthenticated';
  } catch (error) {
    // useSession failed - likely because we're not in a SessionProvider context
    console.warn('AnalyticsProvider: useSession not available, running without session context');
  }

  useEffect(() => {
    // Initialize analytics tracker
    console.log('=== ANALYTICS PROVIDER DEBUG ===');
    console.log('Initializing analytics tracker...');

    const analytics = getAnalytics();
    console.log('Analytics instance created:', !!analytics);
    console.log('Analytics enabled:', analytics.isEnabled);
    console.log('Session ID:', analytics.sessionId);

    // Set user role if session is available and loaded
    if (status !== 'loading' && session?.user) {
      analytics.setUser(session.user);
    }

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
  }, []); // Only run once on mount

  useEffect(() => {
    // This effect runs whenever the session status changes (if available)
    if (status !== 'loading') {
      const analytics = getAnalytics();
      analytics.setUser(session?.user);
    }
  }, [status, session]);

  const value = {
    analytics: getAnalytics(),
  };

  return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}
