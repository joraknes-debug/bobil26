const CACHE = 'bobiltur-v1';
const ASSETS = ['./dashboard.html', './manifest.json', './icons/icon-192.png', './icons/icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // La nettverks-APIer (vær, geocoding, OSRM, Overpass, Anthropic-proxy) gå direkte
  const externalHosts = ['nominatim.openstreetmap.org','router.project-osrm.org',
    'api.open-meteo.com','archive-api.open-meteo.com','overpass-api.de',
    'api.anthropic.com'];
  if (externalHosts.some(h => url.hostname === h)) return;
  if (url.pathname.includes('/api/')) return; // lokal proxy

  // Cache-first med nettverks-fallback for app-assets
  e.respondWith(
    caches.match(e.request).then(cached => {
      const fromNet = fetch(e.request).then(res => {
        if (res.ok && res.status < 400) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      }).catch(() => cached);
      return cached || fromNet;
    })
  );
});
