const CACHE_NAME = 'yunas-kitchen-pwa-v5';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.svg'
];
self.addEventListener('install', event => {
  // `reload` makes a newly installed worker cache the deployed app shell rather
  // than an HTTP-cached copy from an earlier PWA release.
  event.waitUntil(caches.open(CACHE_NAME).then(cache => Promise.all(
    APP_SHELL.map(url => cache.add(new Request(url, {cache:'reload'})))
  )));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith('yunas-kitchen-pwa-') && key !== CACHE_NAME).map(key => caches.delete(key))
  )));
  self.clients.claim();
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    // Always try the network first for a document navigation. This is important
    // for a reopened installed PWA: it must not start from an old cached index.
    fetch(event.request.mode === 'navigate'
      ? new Request(event.request, {cache:'no-store'})
      : event.request
    ).then(response => {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy)));
      }
      return response;
    }).catch(() => caches.match(event.request).then(cached => {
      if (cached) return cached;
      return event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error();
    }))
  );
});
