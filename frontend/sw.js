const CACHE_NAME = 'campus-reporting-v2'; // bump this any time you change cached files

const urlsToCache = [
  '/login.html',
  '/register.html',
  '/student-dashboard.html',
  '/staff-dashboard.html',
  '/admin-dashboard.html',
  '/admin-complaints.html',
  '/manage-staff.html',
  '/profile.html',
  '/submit-complaint.html',
  '/my-complaints.html',
  '/manifest.json',
  '/css/style.css',
  '/js/api.js',
  '/js/login.js',
  '/js/register.js',
  '/js/manage-staff.js'
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(urlsToCache);
    })
  );
  self.skipWaiting();
});

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

self.addEventListener('fetch', function (event) {
  const url = new URL(event.request.url);

  // Never cache API calls
  if (url.pathname.startsWith('/auth') || url.pathname.startsWith('/complaints') ||
      url.pathname.startsWith('/admin') || url.pathname.startsWith('/departments') ||
      url.pathname.startsWith('/users')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // HTML pages: network-first, so edits show immediately; fall back to cache if offline
  if (event.request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request)
        .then(function (networkResponse) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, clone);
          });
          return networkResponse;
        })
        .catch(function () {
          return caches.match(event.request);
        })
    );
    return;
  }

  // CSS/JS/other static assets: cache-first (fine since these change less often)
  event.respondWith(
    caches.match(event.request).then(function (cachedResponse) {
      return cachedResponse || fetch(event.request);
    })
  );
});