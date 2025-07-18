// CalorieMeter Service Worker
const CACHE_NAME = 'caloriemeter-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  // Add other critical assets
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

// Fetch event - Network first for API calls, Cache first for static assets
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    // Network first for API calls
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
  } else {
    // Cache first for static assets
    event.respondWith(
      caches.match(event.request)
        .then((response) => response || fetch(event.request))
    );
  }
});

// Background sync for offline photo analysis
self.addEventListener('sync', (event) => {
  if (event.tag === 'photo-analysis') {
    event.waitUntil(processOfflinePhotos());
  }
});

async function processOfflinePhotos() {
  // Process queued photos when online
  // Implementation would depend on your offline strategy
}