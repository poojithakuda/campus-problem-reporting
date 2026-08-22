const CACHE_NAME = 'campus-reporting-v1';

const urlsToCache = [
  '/login.html',
  '/register.html',
  '/student-dashboard.html',
  '/staff-dashboard.html',
  '/admin-dashboard.html',
  '/profile.html',
  '/submit-complaint.html',
  '/my-complaints.html',
  '/css/style.css',
  '/js/api.js',
  '/js/login.js',
  '/js/register.js'
];

// Install: cache the static shell
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function (name) { return name !== CACHE_NAME; })
          .map(function (name) { return caches.delete(name); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: serve cached files when offline, but always try network first for API calls
self.addEventListener('fetch', function (event) {
  const url = new URL(event.request.url);

  // Never cache API calls — always go to network, so live data stays live
  if (url.pathname.startsWith('/auth') || url.pathname.startsWith('/complaints') ||
      url.pathname.startsWith('/admin') || url.pathname.startsWith('/departments') ||
      url.pathname.startsWith('/users')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // For static pages/assets: try cache first, fall back to network
  event.respondWith(
    caches.match(event.request).then(function (cachedResponse) {
      return cachedResponse || fetch(event.request);
    })
  );
});