// Service Worker for PWA Offline Support
const CACHE_NAME = 'flota-pwa-v13';
const urlsToCache = [
    '/static/index.html',
    '/static/css/style.css',
    '/static/js/app.js',
    '/static/js/api.js',
    '/static/js/db.js',
    '/static/js/roles.js',
    '/static/js/sync.js',
    '/static/js/modals.js',
    '/static/js/compressor.js',
    '/static/img/steppi_logo.svg',
    '/static/manifest.json',
    '/static/js/views/dashboard.js',
    '/static/js/views/flota.js',
    '/static/js/views/users.js',
    '/static/js/views/audit.js',
    '/static/js/views/ai.js'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('[SW] Caching app shell');
                return cache.addAll(urlsToCache);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    const { request } = event;

    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }

    // API requests: never cache authenticated payloads
    if (request.url.includes('/api/')) {
        event.respondWith(
            fetch(request)
                .then((response) => response)
                .catch(() => {
                    return new Response(JSON.stringify({ detail: 'Offline' }), {
                        status: 503,
                        headers: { 'Content-Type': 'application/json' },
                    });
                })
        );
        return;
    }

    // Static assets: Cache first, fallback to network
    event.respondWith(
        caches.match(request)
            .then((response) => {
                return response || fetch(request);
            })
    );
});

// Background sync (for future implementation)
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-queue') {
        console.log('[SW] Background sync triggered');
        // Will implement sync logic here
    }
});
