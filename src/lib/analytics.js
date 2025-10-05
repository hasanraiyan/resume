// src/lib/analytics.js
'use client';

class AnalyticsTracker {
  constructor(apiEndpoint = '/api/analytics') {
    this.apiEndpoint = apiEndpoint;
    this.sessionId = this.getOrCreateSessionId();
    this.isEnabled = !this.isBot();
    this.eventQueue = [];
    this.flushInterval = null;

    if (this.isEnabled) {
      this.startAutoFlush();
      this.trackPageView();
      this.setupRouteChangeTracking();
    }
  }

  // Session management with localStorage
  getOrCreateSessionId() {
    if (typeof window === 'undefined') return null;

    const SESSION_KEY = 'analytics_session_id';
    const SESSION_EXPIRY_KEY = 'analytics_session_expiry';
    const SESSION_DURATION = 30 * 60 * 1000; // 30 minutes

    const now = Date.now();
    const storedSessionId = localStorage.getItem(SESSION_KEY);
    const storedExpiry = localStorage.getItem(SESSION_EXPIRY_KEY);

    console.log('=== SESSION DEBUG ===');
    console.log('Current time:', new Date(now).toISOString());
    console.log('Stored session ID:', storedSessionId);
    console.log('Stored expiry:', storedExpiry ? new Date(parseInt(storedExpiry)).toISOString() : 'none');

    // Check if existing session is still valid
    if (storedSessionId && storedExpiry && parseInt(storedExpiry) > now) {
      console.log('Using existing valid session:', storedSessionId);
      return storedSessionId;
    }

    // Create new session
    const newSessionId = this.generateSessionId();
    localStorage.setItem(SESSION_KEY, newSessionId);
    localStorage.setItem(SESSION_EXPIRY_KEY, (now + SESSION_DURATION).toString());

    console.log('Created new session:', newSessionId, 'expires:', new Date(now + SESSION_DURATION).toISOString());

    return newSessionId;
  }

  generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Bot detection
  isBot() {
    if (typeof window === 'undefined') return true;

    const userAgent = navigator.userAgent.toLowerCase();
    const botPatterns = [
      'bot', 'spider', 'crawler', 'scraper', 'monitoring', 'check',
      'wget', 'curl', 'python-requests', 'go-http-client',
      'java', 'okhttp', 'axios', 'node-fetch',
      'facebookexternalhit', 'twitterbot', 'linkedinbot',
      'whatsapp', 'telegrambot', 'discordbot'
    ];

    const isBotDetected = botPatterns.some(pattern => userAgent.includes(pattern));
    console.log('=== BOT DETECTION DEBUG ===');
    console.log('User agent:', userAgent);
    console.log('Bot patterns found:', botPatterns.filter(pattern => userAgent.includes(pattern)));
    console.log('Is bot detected:', isBotDetected);

    return isBotDetected;
  }

  // Track pageview
  trackPageView(path = null) {
    if (!this.isEnabled) return;

    const currentPath = path || window.location.pathname;
    this.trackEvent('pageview', currentPath, {
      title: document.title,
      url: window.location.href,
      referrer: document.referrer
    });
  }

  // Track custom event
  trackEvent(eventType, path, properties = {}) {
    if (!this.isEnabled) return;

    const eventData = {
      eventType,
      path,
      sessionId: this.sessionId,
      userAgent: navigator.userAgent,
      referrer: document.referrer,
      properties,
      timestamp: new Date().toISOString()
    };

    console.log('=== CLIENT ANALYTICS DEBUG ===');
    console.log('Sending event data:', JSON.stringify(eventData, null, 2));

    this.eventQueue.push(eventData);

    // Flush immediately for pageviews and critical events
    if (eventType === 'pageview' || properties.immediate) {
      this.flush();
    }
  }

  // Batch event sending
  async flush() {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    console.log('=== FLUSH DEBUG ===');
    console.log(`Sending ${events.length} events to ${this.apiEndpoint}`);
    console.log('Events payload:', JSON.stringify(events, null, 2));

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(events),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        // Put events back in queue if sending failed
        this.eventQueue.unshift(...events);
        console.log('Request failed, events returned to queue');
      } else {
        console.log('Request successful');
      }
    } catch (error) {
      console.error('Analytics flush error:', error);
      // Put events back in queue if sending failed
      this.eventQueue.unshift(...events);
      console.log('Network error, events returned to queue');
    }
  }

  // Setup automatic flushing every 10 seconds
  startAutoFlush() {
    if (this.flushInterval) return;

    this.flushInterval = setInterval(() => {
      this.flush();
    }, 10000);
  }

  // Setup route change tracking for Next.js app router
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
    history.pushState = function(state, title, url) {
      originalPushState.apply(history, arguments);
      handlePushState();
    };

    // Track initial page load
    this.trackPageView();
  }

  // Track custom events (for useEvent hook)
  trackCustomEvent(eventName, path, properties = {}) {
    this.trackEvent('custom', path, {
      eventName,
      ...properties
    });
  }

  // Track clicks (for useClick hook)
  trackClick(element, properties = {}) {
    const elementInfo = {
      tag: element.tagName.toLowerCase(),
      id: element.id,
      className: element.className,
      textContent: element.textContent?.substring(0, 100) // Truncate long text
    };

    this.trackEvent('click', window.location.pathname, {
      element: elementInfo,
      ...properties
    });
  }
}

// Create singleton instance
let analyticsInstance = null;

export function getAnalytics() {
  if (!analyticsInstance) {
    analyticsInstance = new AnalyticsTracker();
  }
  return analyticsInstance;
}

export default getAnalytics;
