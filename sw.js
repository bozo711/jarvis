// JARVIS service worker — installs the app to the home screen + offline support.
// NETWORK-FIRST for same-origin files so updates show up immediately when online,
// falling back to cache when offline. API calls are never cached.
const CACHE = 'jarvis-v2';
const SHELL = [
  './',
  './index.html',
  './jarvis-core.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || /api\.groq\.com|api\.openai\.com|discord\.com|gumroad\.com|\/api\/chat/.test(url.href)) return;
  if (url.origin !== location.origin) return;
  // network-first: fresh when online, cached when offline
  e.respondWith(
    fetch(e.request).then((res) => {
      const copy = res.clone();
      if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, copy));
      return res;
    }).catch(() => caches.match(e.request).then((hit) => hit || caches.match('./index.html')))
  );
});
