/**
 * @fileoverview Client-side analytics tracking system.
 * Provides comprehensive event tracking, session management, and bot detection.
 * Implements batch processing and automatic flushing for optimal performance.
 */

// src/lib/analytics.js
'use client';

/**
 * Analytics tracking class for monitoring user interactions and page views.
 * Implements session management, bot detection, and batch event processing.
 *
 * @class AnalyticsTracker
 */
class AnalyticsTracker {
  /**
   * Creates an instance of AnalyticsTracker.
   * Initializes session management and starts tracking if not a bot.
   *
   * @constructor
   * @param {string} [apiEndpoint='/api/analytics'] - API endpoint for sending analytics data
   */
  constructor(apiEndpoint = '/api/analytics') {
    this.apiEndpoint = apiEndpoint;
    this.sessionId = this.getOrCreateSessionId();
    this.isEnabled = !this.isBot();
    this.eventQueue = [];
    this.userRole = 'visitor'; // Default role
    this.flushInterval = null;

    if (this.isEnabled) {
      this.startAutoFlush();
      this.trackPageView();
      this.setupRouteChangeTracking();
    }
  }

  /**
   * Sets the user role for analytics tracking.
   *
   * @method setUser
   * @param {object|null} user - The user object from the session
   */
  setUser(user) {
    if (user && user.role === 'admin') {
      this.userRole = 'admin';

      // Retroactively update any existing events in the queue
      // that were tracked before the session was loaded
      this.eventQueue.forEach((event) => {
        if (event.userRole === 'visitor') {
          event.userRole = 'admin';
        }
      });
    }
  }

  /**
   * Gets existing session ID from localStorage or creates a new one.
   * Sessions expire after 30 minutes of inactivity.
   *
   * @method getOrCreateSessionId
   * @returns {string|null} Session ID or null if running server-side
   */
  getOrCreateSessionId() {
    if (typeof window === 'undefined') return null;

    const SESSION_KEY = 'analytics_session_id';
    const SESSION_EXPIRY_KEY = 'analytics_session_expiry';
    const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

    const now = Date.now();
    const storedSessionId = localStorage.getItem(SESSION_KEY);
    const storedExpiry = localStorage.getItem(SESSION_EXPIRY_KEY);

    // Check if existing session is still valid
    if (storedSessionId && storedExpiry && parseInt(storedExpiry) > now) {
      return storedSessionId;
    }

    // Create new session
    const newSessionId = this.generateSessionId();
    localStorage.setItem(SESSION_KEY, newSessionId);
    localStorage.setItem(SESSION_EXPIRY_KEY, (now + SESSION_DURATION).toString());

    return newSessionId;
  }

  /**
   * Generates a unique session ID using timestamp and random string.
   *
   * @method generateSessionId
   * @returns {string} Unique session identifier
   */
  generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Detects if the current user agent is a bot or crawler.
   * Checks against a comprehensive list of bot patterns.
   *
   * @method isBot
   * @returns {boolean} True if user agent matches bot patterns, false otherwise
   */
  isBot() {
    if (typeof window === 'undefined') return true;

    const userAgent = navigator.userAgent.toLowerCase();
    const botPatterns = [
      'bot',
      'spider',
      'crawler',
      'scraper',
      'monitoring',
      'check',
      'wget',
      'curl',
      'python-requests',
      'go-http-client',
      'java',
      'okhttp',
      'axios',
      'node-fetch',
      'facebookexternalhit',
      'twitterbot',
      'linkedinbot',
      'whatsapp',
      'telegrambot',
      'discordbot',
    ];

    const isBotDetected = botPatterns.some((pattern) => userAgent.includes(pattern));

    return isBotDetected;
  }

  /**
   * Tracks a page view event with current page metadata.
   *
   * @method trackPageView
   * @param {string|null} [path=null] - Optional path override, defaults to current pathname
   */
  trackPageView(path = null) {
    if (!this.isEnabled) return;

    const currentPath = path || window.location.pathname;
    this.trackEvent('pageview', currentPath, {
      title: document.title,
      url: window.location.href,
      referrer: document.referrer,
    });
  }

  /**
   * Tracks a custom event with specified type and properties.
   * Events are queued and sent in batches for efficiency.
   *
   * @method trackEvent
   * @param {string} eventType - Type of event (e.g., 'pageview', 'click', 'custom')
   * @param {string} path - Page path where event occurred
   * @param {Object} [properties={}] - Additional event properties
   */
  trackEvent(eventType, path, properties = {}) {
    if (!this.isEnabled) return;

    const eventData = {
      eventType,
      path,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      properties,
      userRole: this.userRole, // Add user role to every event
      timestamp: new Date().toISOString(),
    };

    this.eventQueue.push(eventData);

    // Flush immediately for pageviews and critical events
    if (eventType === 'pageview' || properties.immediate) {
      this.flush();
    }
  }

  /**
   * Sends all queued events to the analytics API endpoint.
   * Implements retry logic by returning failed events to the queue.
   *
   * @async
   * @method flush
   * @returns {Promise<void>}
   */
  async flush() {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(events),
      });

      if (!response.ok) {
        // Put events back in queue if sending failed
        this.eventQueue.unshift(...events);
      }
    } catch (error) {
      console.error('Analytics flush error:', error);
      // Put events back in queue if sending failed
      this.eventQueue.unshift(...events);
    }
  }

  /**
   * Starts automatic flushing of events every 10 seconds.
   * Prevents duplicate intervals if already started.
   *
   * @method startAutoFlush
   */
  startAutoFlush() {
    if (this.flushInterval) return;

    this.flushInterval = setInterval(() => {
      this.flush();
    }, 10000);
  }

  /**
   * Sets up automatic page view tracking for route changes.
   * Handles both browser navigation and programmatic navigation.
   *
   * @method setupRouteChangeTracking
   */
  setupRouteChangeTracking() {
    if (typeof window === 'undefined') return;

    // For Next.js app router
    const handlePopState = () => {
      this.trackPageView();
    };

    const handlePushState = () => {
      this.trackPageView();
    };

    // Track browser back/forward navigation
    window.addEventListener('popstate', handlePopState);

    // Track programmatic navigation (for future compatibility)
    const originalPushState = history.pushState;
    history.pushState = function (state, title, url) {
      originalPushState.apply(history, arguments);
      handlePushState();
    };

    // Track initial page load
    this.trackPageView();
  }

  /**
   * Tracks a custom named event with properties.
   * Convenience method for use with custom hooks.
   *
   * @method trackCustomEvent
   * @param {string} eventName - Name of the custom event
   * @param {string} path - Page path where event occurred
   * @param {Object} [properties={}] - Additional event properties
   */
  trackCustomEvent(eventName, path, properties = {}) {
    this.trackEvent('custom', path, {
      eventName,
      ...properties,
    });
  }

  /**
   * Tracks click events on DOM elements.
   * Captures element metadata like tag, ID, className, and text content.
   *
   * @method trackClick
   * @param {HTMLElement} element - The clicked DOM element
   * @param {Object} [properties={}] - Additional properties to track
   */
  trackClick(element, properties = {}) {
    const elementInfo = {
      tag: element.tagName.toLowerCase(),
      id: element.id,
      className: element.className,
      textContent: element.textContent?.substring(0, 100), // Truncate long text
    };

    this.trackEvent('click', window.location.pathname, {
      element: elementInfo,
      ...properties,
    });
  }
}

// Create singleton instance
let analyticsInstance = null;

/**
 * Gets or creates the singleton analytics tracker instance.
 * Ensures only one tracker exists throughout the application lifecycle.
 *
 * @function getAnalytics
 * @returns {AnalyticsTracker} The singleton analytics tracker instance
 */
export function getAnalytics() {
  if (!analyticsInstance) {
    analyticsInstance = new AnalyticsTracker();
  }
  return analyticsInstance;
}

export default getAnalytics;
