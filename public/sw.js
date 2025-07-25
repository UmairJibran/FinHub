/**
 * Service Worker for FinHub
 * Provides caching strategies and offline support
 */

const CACHE_NAME = 'finhub-v1';
const STATIC_CACHE_NAME = 'finhub-static-v1';
const DYNAMIC_CACHE_NAME = 'finhub-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/offline.html', // Fallback page for offline
];

// API endpoints to cache with different strategies
const API_CACHE_PATTERNS = [
  { pattern: /\/api\/portfolios/, strategy: 'networkFirst', maxAge: 5 * 60 * 1000 }, // 5 minutes
  { pattern: /\/api\/positions/, strategy: 'networkFirst', maxAge: 3 * 60 * 1000 }, // 3 minutes
  { pattern: /\/api\/transactions/, strategy: 'networkFirst', maxAge: 10 * 60 * 1000 }, // 10 minutes
  { pattern: /\/api\/asset-prices/, strategy: 'networkFirst', maxAge: 1 * 60 * 1000 }, // 1 minute
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName !== CACHE_NAME) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle API requests with specific strategies
  if (url.pathname.startsWith('/api/') || url.hostname.includes('supabase')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static assets
  if (request.destination === 'document' || 
      request.destination === 'script' || 
      request.destination === 'style' ||
      request.destination === 'image') {
    event.respondWith(handleStaticAsset(request));
    return;
  }

  // Default: network first with cache fallback
  event.respondWith(
    fetch(request)
      .catch(() => {
        return caches.match(request);
      })
  );
});

/**
 * Handle API requests with network-first strategy
 */
async function handleApiRequest(request) {
  const url = new URL(request.url);
  const cachePattern = API_CACHE_PATTERNS.find(pattern => 
    pattern.pattern.test(url.pathname)
  );

  if (!cachePattern) {
    // No specific caching strategy, just try network
    return fetch(request);
  }

  const cache = await caches.open(DYNAMIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // Check if cached response is still valid
  if (cachedResponse) {
    const cachedTime = new Date(cachedResponse.headers.get('sw-cached-time') || 0);
    const now = new Date();
    const isExpired = (now.getTime() - cachedTime.getTime()) > cachePattern.maxAge;

    if (!isExpired) {
      // Return cached response and update in background
      fetch(request)
        .then(response => {
          if (response.ok) {
            const responseClone = response.clone();
            responseClone.headers.set('sw-cached-time', new Date().toISOString());
            cache.put(request, responseClone);
          }
        })
        .catch(() => {
          // Ignore background update errors
        });
      
      return cachedResponse;
    }
  }

  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful response
      const responseClone = networkResponse.clone();
      responseClone.headers.set('sw-cached-time', new Date().toISOString());
      cache.put(request, responseClone);
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, return cached response if available
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // No cached response available
    throw error;
  }
}

/**
 * Handle static assets with cache-first strategy
 */
async function handleStaticAsset(request) {
  const cache = await caches.open(STATIC_CACHE_NAME);
  const cachedResponse = await cache.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // For HTML documents, return offline page
    if (request.destination === 'document') {
      return cache.match('/offline.html');
    }
    
    throw error;
  }
}

// Handle background sync for offline operations
self.addEventListener('sync', (event) => {
  if (event.tag === 'portfolio-sync') {
    event.waitUntil(syncPortfolioData());
  }
});

/**
 * Sync portfolio data when back online
 */
async function syncPortfolioData() {
  try {
    // Get pending operations from IndexedDB
    const pendingOperations = await getPendingOperations();
    
    for (const operation of pendingOperations) {
      try {
        await fetch(operation.url, {
          method: operation.method,
          headers: operation.headers,
          body: operation.body,
        });
        
        // Remove successful operation
        await removePendingOperation(operation.id);
      } catch (error) {
        console.warn('Failed to sync operation:', operation.id, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

/**
 * Get pending operations from IndexedDB
 */
async function getPendingOperations() {
  // This would integrate with the offline sync system
  // For now, return empty array
  return [];
}

/**
 * Remove pending operation from IndexedDB
 */
async function removePendingOperation(id) {
  // This would integrate with the offline sync system
  console.log('Removing pending operation:', id);
}

// Handle push notifications (future enhancement)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    const options = {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png',
      tag: data.tag || 'default',
      requireInteraction: data.requireInteraction || false,
      actions: data.actions || [],
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action) {
    // Handle action button clicks
    handleNotificationAction(event.action, event.notification.data);
  } else {
    // Handle notification click
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

/**
 * Handle notification action buttons
 */
function handleNotificationAction(action, data) {
  switch (action) {
    case 'view-portfolio':
      clients.openWindow(`/portfolios/${data.portfolioId}`);
      break;
    case 'view-dashboard':
      clients.openWindow('/dashboard');
      break;
    default:
      clients.openWindow('/');
  }
}