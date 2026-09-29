// Service Worker — кэширует файлы игры для оффлайн-работы
const CACHE = 'zhora-v1';
const ASSETS = [
    './',
    './index.html',
    './manifest.json',
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE).then((c) => {
            return Promise.all(
                ASSETS.map(url => c.add(url).catch(() => null))
            );
        })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter(k => k !== CACHE).map(k => caches.delete(k))
            )
        )
    );
    self.clients.claim();
});

self.addEventListener('fetch', (e) => {
    if (e.request.method !== 'GET') return;
    const url = new URL(e.request.url);
    if (url.origin !== location.origin) return;

    e.respondWith(
        caches.match(e.request).then((cached) => {
            if (cached) return cached;
            return fetch(e.request).then((resp) => {
                if (!resp || resp.status !== 200 || resp.type !== 'basic') return resp;
                const copy = resp.clone();
                caches.open(CACHE).then((c) => c.put(e.request, copy));
                return resp;
            }).catch(() => cached);
        })
    );
});