'use client';

import { useAnalytics } from '@/hooks/useAnalytics';

export const AnalyticsProvider = ({ children }) => {
  const { usePageView } = useAnalytics();
  usePageView();

  return <>{children}</>;
};