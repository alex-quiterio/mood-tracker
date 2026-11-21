// Feelings Unboxed service worker: works offline, and receives backups shared from Android.
// The Pages workflow stamps the commit into CACHE, so each deploy replaces the old cache.
const CACHE = 'unboxed-__COMMIT__';
const SHELL = [
  './',
  'manifest.webmanifest',
  'icon.png',
  'icon-512.png',
  'favicon.png',
  'logo.svg',
  'fonts/Figtree-Regular.ttf',
  'fonts/Figtree-SemiBold.ttf',
  'fonts/Figtree-Bold.ttf',
  'fonts/Fraunces-SemiBold.ttf',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k.startsWith('unboxed-') && k !== CACHE).map((k) => caches.delete(k))),
      ),
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // A file shared into the installed app: keep it, then open the page, which picks it up.
  if (event.request.method === 'POST' && url.pathname.endsWith('/share-target')) {
    event.respondWith(
      (async () => {
        const form = await event.request.formData();
        const file = form.get('file');
        if (file) {
          const cache = await caches.open('shared-file');
          await cache.put(
            'shared',
            new Response(file, { headers: { 'x-name': encodeURIComponent(file.name || 'shared.json') } }),
          );
        }
        return Response.redirect('./?shared=1', 303);
      })(),
    );
    return;
  }

  if (event.request.method !== 'GET' || url.origin !== location.origin) return;

  // The page: network first, so a new deploy shows up; the cache when offline.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put('./', copy));
          return res;
        })
        .catch(() => caches.match('./')),
    );
    return;
  }

  // Icons and fonts: from the cache.
  event.respondWith(caches.match(event.request).then((hit) => hit || fetch(event.request)));
});
