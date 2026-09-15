// sw.js — minimal service worker, kun for at opfylde browserens krav for at
// vise installations-prompten (beforeinstallprompt). Ingen caching — al
// trafik går direkte til netværket.

self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})
