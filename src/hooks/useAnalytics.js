/**
 * @fileoverview React hooks for analytics tracking.
 * Provides custom hooks for tracking page views, events, clicks, form submissions,
 * and downloads throughout the application.
 */

// src/hooks/useAnalytics.js
'use client';

import { useEffect, useCallback, useRef } from 'react';
import { getAnalytics } from '@/lib/analytics';

/**
 * Hook for tracking page views automatically.
 * Tracks the current page when component mounts or path changes.
 *
 * @function usePageView
 * @param {string|null} [path=null] - Optional custom path to track, defaults to current pathname
 */
export function usePageView(path = null) {
  const analytics = getAnalytics();

  useEffect(() => {
    if (path) {
      analytics.trackPageView(path);
    } else {
      analytics.trackPageView();
    }
  }, [path, analytics]);
}

/**
 * Hook for tracking custom events.
 * Returns a stable trackEvent function for logging custom analytics events.
 *
 * @function useEvent
 * @returns {Function} trackEvent function that accepts (eventName, properties)
 */
export function useEvent() {
  const analytics = getAnalytics();

  const trackEvent = useCallback(
    (eventName, properties = {}) => {
      analytics.trackCustomEvent(eventName, window.location.pathname, properties);
    },
    [analytics]
  );

  return trackEvent;
}

/**
 * Hook for tracking clicks on DOM elements.
 * Automatically sets up click event listeners and tracking.
 *
 * @function useClick
 * @param {Object} [options={}] - Configuration options
 * @param {Object} [options.properties={}] - Additional properties to track with the click
 * @param {boolean} [options.trackChildren=false] - Whether to track clicks on child elements too
 * @returns {{ref: React.RefObject}} Object with ref to attach to the target element
 */
export function useClick(options = {}) {
  const { properties = {}, trackChildren = false } = options;
  const analytics = getAnalytics();
  const elementRef = useRef(null);

  const trackClick = useCallback(
    (event) => {
      const target = event.target;
      analytics.trackClick(target, properties);
    },
    [analytics, properties]
  );

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (trackChildren) {
      element.addEventListener('click', trackClick, true);
    } else {
      element.addEventListener('click', trackClick);
    }

    return () => {
      if (trackChildren) {
        element.removeEventListener('click', trackClick, true);
      } else {
        element.removeEventListener('click', trackClick);
      }
    };
  }, [trackClick, trackChildren]);

  return { ref: elementRef };
}

/**
 * Hook for tracking form submissions.
 * Automatically tracks when a form is submitted with metadata.
 *
 * @function useFormSubmit
 * @param {string} formName - Name/identifier for the form
 * @param {Object} [options={}] - Configuration options
 * @param {Object} [options.properties={}] - Additional properties to track
 * @returns {{ref: React.RefObject}} Object with ref to attach to the form element
 */
export function useFormSubmit(formName, options = {}) {
  const { properties = {} } = options;
  const analytics = getAnalytics();
  const formRef = useRef(null);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;

    const handleSubmit = (event) => {
      analytics.trackEvent('form_submit', window.location.pathname, {
        formName,
        formMethod: form.method || 'post',
        ...properties,
      });
    };

    form.addEventListener('submit', handleSubmit);

    return () => {
      form.removeEventListener('submit', handleSubmit);
    };
  }, [analytics, formName, properties]);

  return { ref: formRef };
}

/**
 * Hook for tracking file downloads.
 * Returns a function to call when a download is initiated.
 *
 * @function useDownload
 * @param {string} downloadName - Name/identifier for the download
 * @param {string} fileUrl - URL of the file being downloaded
 * @returns {Function} trackDownload function to call when download starts
 */
export function useDownload(downloadName, fileUrl) {
  const analytics = getAnalytics();

  const trackDownload = useCallback(() => {
    analytics.trackEvent('download', window.location.pathname, {
      downloadName,
      fileUrl,
      timestamp: new Date().toISOString(),
    });
  }, [analytics, downloadName, fileUrl]);

  return trackDownload;
}

/**
 * Main analytics hook providing all tracking functions.
 * Comprehensive hook that returns all available tracking methods.
 *
 * @function useAnalytics
 * @returns {{trackPageView: Function, trackEvent: Function, trackClick: Function, useClick: Function, useFormSubmit: Function, useDownload: Function}} Object with all tracking functions
 */
export function useAnalytics() {
  const analytics = getAnalytics();

  const trackPageView = useCallback(
    (path = null) => {
      if (path) {
        analytics.trackPageView(path);
      } else {
        analytics.trackPageView();
      }
    },
    [analytics]
  );

  const trackEvent = useCallback(
    (eventName, properties = {}) => {
      analytics.trackCustomEvent(eventName, window.location.pathname, properties);
    },
    [analytics]
  );

  const trackClick = useCallback(
    (element, properties = {}) => {
      analytics.trackClick(element, properties);
    },
    [analytics]
  );

  return {
    trackPageView,
    trackEvent,
    trackClick,
    useClick,
    useFormSubmit,
    useDownload,
  };
}

export default useAnalytics;
