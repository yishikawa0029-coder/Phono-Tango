// Phono-Tango Service Worker
// HTML は常に最新を取得（ネットワーク優先）、その他はキャッシュ優先。
// 更新時はこの CACHE 名を上げると確実に切り替わります。
const CACHE = 'phono-tango-v4';
const ASSETS = ['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => Promise.allSettled(ASSETS.map((a) => c.add(a))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  if (isHTML) {
    // ネットワーク優先：最新の画面を表示。オフライン時のみキャッシュ。
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put('./', copy)).catch(() => {}); return res; })
        .catch(() => caches.match(req).then((h) => h || caches.match('./')))
    );
  } else {
    // 静的ファイルはキャッシュ優先（高速・オフライン対応）
    e.respondWith(
      caches.match(req).then((h) =>
        h || fetch(req).then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {}); return res; })
      )
    );
  }
});
