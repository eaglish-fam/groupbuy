const CACHE_NAME = 'eaglish-v3.1';
const urlsToCache = [
  '/',
  '/index.html',
  '/tools.html',
  '/icons/web-app-manifest-192x192.png',
  '/icons/web-app-manifest-512x512.png',
  '/icons/favicon.svg'
];

// 安裝 Service Worker
self.addEventListener('install', event => {
  console.log('🔧 Service Worker 安裝中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('📦 快取檔案中...');
        return cache.addAll(urlsToCache);
      })
  );
});

// 提取資源
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // 如果有快取就用快取，沒有就從網路取得
        return response || fetch(event.request);
      })
  );
});

// 更新 Service Worker
self.addEventListener('activate', event => {
  console.log('✨ Service Worker 啟動中...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ 清除舊快取:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
