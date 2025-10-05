import { useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '@/lib/analytics';

export const useAnalytics = () => {
  const pathname = usePathname();

  const usePageView = () => {
    useEffect(() => {
      trackEvent('pageView', pathname);
    }, [pathname]);
  };

  const useEvent = (eventName) => {
    return useCallback(() => {
      trackEvent(eventName, pathname);
    }, [eventName, pathname]);
  };

  return { usePageView, useEvent };
};