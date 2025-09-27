// Service Worker for caching and performance
const CACHE_NAME = 'lucky50-v1.0.0'
const STATIC_CACHE = 'lucky50-static-v1'
const API_CACHE = 'lucky50-api-v1'

// Files to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  // Add critical CSS and JS files here
]

// API endpoints to cache
const API_ENDPOINTS = ['https://api.finmindtrade.com']

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== STATIC_CACHE && cacheName !== API_CACHE) {
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Handle API requests
  if (API_ENDPOINTS.some(endpoint => url.href.startsWith(endpoint))) {
    event.respondWith(
      caches.open(API_CACHE).then(cache => {
        return cache.match(request).then(response => {
          if (response) {
            // Return cached version and update in background
            fetch(request)
              .then(fetchResponse => {
                cache.put(request, fetchResponse.clone())
              })
              .catch(() => {}) // Ignore network errors
            return response
          }

          // No cache, fetch from network
          return fetch(request).then(fetchResponse => {
            cache.put(request, fetchResponse.clone())
            return fetchResponse
          })
        })
      })
    )
  }

  // Handle static assets
  else if (
    request.destination === 'document' ||
    request.destination === 'script' ||
    request.destination === 'style'
  ) {
    event.respondWith(
      caches.match(request).then(response => {
        return response || fetch(request)
      })
    )
  }
})
