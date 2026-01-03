/* eslint-disable no-restricted-globals */

// Professional Service Worker for UniFeed
// Implements Stale-While-Revalidate for assets and Cache-First for static images

const CACHE_NAME = 'unifeed-static-v2';
const DYNAMIC_CACHE = 'unifeed-dynamic-v1';

const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/favicon.ico',
    '/logo192.png',
    '/logo512.png',
    '/static/js/bundle.js', // Standard CRA/Vite entry points
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap'
];

// Limit cache size function
const limitCacheSize = (name, size) => {
    caches.open(name).then(cache => {
        cache.keys().then(keys => {
            if (keys.length > size) {
                cache.delete(keys[0]).then(limitCacheSize(name, size));
            }
        });
    });
};

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[SW] Pre-caching offline assets');
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME && key !== DYNAMIC_CACHE)
                    .map(key => caches.delete(key))
            );
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Skip non-GET requests and Supabase/API calls (let them go to network)
    if (event.request.method !== 'GET' || event.request.url.includes('supabase.co')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then(cacheRes => {
            return cacheRes || fetch(event.request).then(fetchRes => {
                return caches.open(DYNAMIC_CACHE).then(cache => {
                    // Cache a clone of the response for future use
                    cache.put(event.request.url, fetchRes.clone());
                    limitCacheSize(DYNAMIC_CACHE, 50); // Keep dynamic cache lean
                    return fetchRes;
                });
            });
        }).catch(() => {
            // Fallback for when both fail (offline and not in cache)
            if (event.request.url.indexOf('.html') > -1) {
                return caches.match('/index.html');
            }
        })
    );
});
