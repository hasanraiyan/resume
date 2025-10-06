'use client';

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import getAnalytics from '@/lib/analytics';

/**
 * Custom hook for proactive chatbot engagement based on user behavior
 * Monitors time on page and scroll depth to trigger contextual messages
 */
export function useProactiveTriggers({ 
  onTrigger, 
  isOpen, 
  isEnabled = true 
}) {
  const pathname = usePathname();
  const hasTriggeredRef = useRef(false);
  const timeOnPageTimerRef = useRef(null);
  const scrollListenerRef = useRef(null);
  const analyticsRef = useRef(null);

  useEffect(() => {
    if (!isEnabled || isOpen) {
      return;
    }

    // Get analytics instance
    analyticsRef.current = getAnalytics();

    // Reset trigger when path changes
    hasTriggeredRef.current = false;

    // Clear any existing timers
    if (timeOnPageTimerRef.current) {
      clearTimeout(timeOnPageTimerRef.current);
    }

    // Time-based trigger configurations by route
    const timeBasedTriggers = {
      '/projects': {
        delay: 15000, // 15 seconds
        message: "I see you're exploring Raiyan's work. Are you looking for a specific type of project or technology?",
        eventName: 'projects_page_time_trigger'
      },
      '/': {
        delay: 20000, // 20 seconds
        message: "Hi! I'm here to help you learn more about Raiyan's work and experience. What interests you most?",
        eventName: 'home_page_time_trigger'
      },
      '/contact': {
        delay: 10000, // 10 seconds
        message: "Need help with anything before reaching out? I can provide more details about Raiyan's services and past projects.",
        eventName: 'contact_page_time_trigger'
      }
    };

    // Scroll-based trigger for project detail pages
    const isProjectDetailPage = pathname?.startsWith('/projects/') && pathname !== '/projects';

    // Setup time-based trigger
    const triggerConfig = timeBasedTriggers[pathname];
    if (triggerConfig && !hasTriggeredRef.current) {
      timeOnPageTimerRef.current = setTimeout(() => {
        if (!hasTriggeredRef.current && !isOpen) {
          hasTriggeredRef.current = true;
          
          // Track proactive engagement
          analyticsRef.current?.trackCustomEvent(
            'proactive_message_sent',
            pathname,
            {
              trigger_type: 'time_based',
              trigger_name: triggerConfig.eventName,
              time_threshold: triggerConfig.delay
            }
          );

          onTrigger(triggerConfig.message);
        }
      }, triggerConfig.delay);
    }

    // Setup scroll-based trigger for project pages
    if (isProjectDetailPage && !hasTriggeredRef.current) {
      const handleScroll = () => {
        // Double-check to prevent duplicate triggers
        if (hasTriggeredRef.current || isOpen) {
          window.removeEventListener('scroll', handleScroll);
          return;
        }

        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercentage = (window.scrollY / scrollHeight) * 100;

        // Trigger at 70% scroll depth
        if (scrollPercentage >= 70) {
          // Mark as triggered IMMEDIATELY to prevent race conditions
          hasTriggeredRef.current = true;
          
          // Remove listener BEFORE triggering to prevent any additional events
          window.removeEventListener('scroll', handleScroll);
          
          // Extract project name from URL for personalized message
          const projectSlug = pathname.split('/').pop();
          const projectName = projectSlug
            ?.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');

          const message = `This ${projectName} project was fascinating to build. Do you have any questions about the technical challenges or the results achieved?`;

          // Track proactive engagement
          analyticsRef.current?.trackCustomEvent(
            'proactive_message_sent',
            pathname,
            {
              trigger_type: 'scroll_based',
              trigger_name: 'project_detail_scroll_trigger',
              scroll_percentage: Math.round(scrollPercentage),
              project_slug: projectSlug
            }
          );

          // Trigger the message
          onTrigger(message);
        }
      };

      scrollListenerRef.current = handleScroll;
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    // Cleanup
    return () => {
      if (timeOnPageTimerRef.current) {
        clearTimeout(timeOnPageTimerRef.current);
      }
      if (scrollListenerRef.current) {
        window.removeEventListener('scroll', scrollListenerRef.current);
      }
    };
  }, [pathname, onTrigger, isOpen, isEnabled]);

  // Return method to manually reset triggers if needed
  return {
    resetTriggers: () => {
      hasTriggeredRef.current = false;
    }
  };
}

export default useProactiveTriggers;
