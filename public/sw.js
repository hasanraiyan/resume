// Service Worker for Portfolio PWA
const CACHE_NAME = 'portfolio-v1';
const STATIC_CACHE = 'portfolio-static-v1';
const API_CACHE = 'portfolio-api-v1';

// Files to cache for offline use
const STATIC_FILES = [
  '/',
  '/manifest.json',
  '/icon.svg',
  '/globals.css',
  // Add other critical assets
];

// API endpoints to cache
const API_ENDPOINTS = ['/api/hero', '/api/projects', '/api/about', '/api/services'];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');

  event.waitUntil(
    Promise.all([
      // Cache static files
      caches.open(STATIC_CACHE).then((cache) => {
        console.log('Service Worker: Caching static files');
        return cache.addAll(STATIC_FILES);
      }),
    ])
  );

  // Force activation of new service worker
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');

  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients
      self.clients.claim(),
    ])
  );
});

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different types of requests
  if (request.method === 'GET') {
    if (isStaticAsset(request)) {
      // Handle static assets (CSS, JS, images)
      event.respondWith(handleStaticAsset(request));
    } else if (isAPIRequest(request)) {
      // Handle API requests
      event.respondWith(handleAPIRequest(request));
    } else if (isNavigationRequest(request)) {
      // Handle navigation requests (pages)
      event.respondWith(handleNavigationRequest(request));
    } else {
      // Handle other requests
      event.respondWith(
        fetch(request).catch(() => {
          return new Response('Offline', {
            status: 503,
            statusText: 'Service Unavailable',
          });
        })
      );
    }
  }
});

// Handle static assets
async function handleStaticAsset(request) {
  try {
    // Try network first for fresh content
    const networkResponse = await fetch(request);
    const cache = await caches.open(STATIC_CACHE);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return offline response for images
    if (request.destination === 'image') {
      return new Response(
        '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#f3f4f6"/><text x="100" y="100" text-anchor="middle" dy=".3em" fill="#6b7280">Offline</text></svg>',
        { headers: { 'Content-Type': 'image/svg+xml' } }
      );
    }
    throw error;
  }
}

// Handle API requests
async function handleAPIRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);

    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(API_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // Fallback to cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline response for API requests
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'This content is not available offline',
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    // Return offline page for navigation requests
    const offlineResponse = await caches.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }

    // Fallback offline page
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Portfolio - Offline</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: #f9fafb;
              color: #1f2937;
              text-align: center;
              padding: 2rem;
            }
            .offline-container {
              max-width: 400px;
            }
            h1 { color: #1f2937; margin-bottom: 1rem; }
            p { color: #6b7280; line-height: 1.6; }
            button {
              background: #1f2937;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              cursor: pointer;
              margin-top: 1rem;
            }
          </style>
        </head>
        <body>
          <div class="offline-container">
            <h1>You're Offline</h1>
            <p>It looks like you're not connected to the internet. Please check your connection and try again.</p>
            <button onclick="window.location.reload()">Try Again</button>
          </div>
        </body>
      </html>
    `,
      {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'text/html' },
      }
    );
  }
}

// Helper functions
function isStaticAsset(request) {
  return (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'image' ||
    request.url.includes('/_next/static/')
  );
}

function isAPIRequest(request) {
  return request.url.includes('/api/');
}

function isNavigationRequest(request) {
  return (
    request.mode === 'navigate' ||
    (request.method === 'GET' &&
      request.headers.get('accept') &&
      request.headers.get('accept').includes('text/html'))
  );
}

// Background sync for form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  // Handle queued form submissions or other background tasks
  console.log('Service Worker: Background sync triggered');
}

// Push notifications (optional)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/icon-96x96.png',
      vibrate: [200, 100, 200],
      data: data.data || {},
      actions: [
        {
          action: 'open',
          title: 'Open',
          icon: '/icon-96x96.png',
        },
        {
          action: 'close',
          title: 'Close',
        },
      ],
    };

    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(self.clients.openWindow(event.notification.data.url || '/'));
  }
});
