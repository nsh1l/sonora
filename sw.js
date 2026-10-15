const CACHE = 'sonora-pwa-v12';
const SHELL = ['/', '/index.html', '/native-bridge.js', '/pwa.mjs', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/icons/apple-touch-icon.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(SHELL)));
});
// Keep an update waiting while the current app is open; never interrupt local audio.
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('sonora-pwa-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  // Audio files, blob URLs, APIs and unrelated origins must never enter the shell cache.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || url.search) return;
  const navigation = event.request.mode === 'navigate';
  if (!navigation && !SHELL.includes(url.pathname)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    const cached = await cache.match(url.pathname);
    // A bookmarked in-scope route can still open the cached application shell offline.
    return cached || (navigation && await cache.match('/index.html')) || fetch(event.request);
  }));
});
