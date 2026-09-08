const CACHE_NAME = 'eaglish-blog-release-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/toolbox.html',
  '/style.css',
  '/tailwind.css',
  '/theme-fresh-comfortable.css',
  '/script.js',
  '/product-content.js',
  '/product-content.css',
  '/blog/',
  '/blog/blog.css',
  '/blog/blog-model.js',
  '/blog/blog.js',
  '/blog/atojet/',
  '/blog/wave-hummus/',
  '/blog/artisan-cb301/',
  '/articles/article.css',
  '/articles/article.js',
  '/assets/atojet/home-set.webp',
  '/assets/atojet/vendor-shower.webp',
  '/assets/atojet/video-06.webp',
  '/assets/atojet/video-12.webp',
  '/assets/wave/family.webp',
  '/assets/wave/mushroom.webp',
  '/assets/wave/pita.webp',
  '/assets/wave/toast.webp',
  '/assets/artisan-cb301/contents.webp',
  '/assets/artisan-cb301/cover.webp',
  '/assets/artisan-cb301/long-reach.webp',
  '/assets/artisan-cb301/surfaces.webp',
  '/logo-horizontal.jpg',
  '/logo-eaglish-text.png',
  '/icons/web-app-manifest-192x192.png',
  '/icons/web-app-manifest-512x512.png',
  '/icons/favicon.svg'
];

// 安裝 Service Worker
self.addEventListener('install', event => {
  console.log('🔧 Service Worker 安裝中...');
  self.skipWaiting();
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
  // Operational Sheet data must never be served from the offline cache.
  if (new URL(event.request.url).hostname === 'docs.google.com') return;
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
    Promise.all([
      self.clients.claim(),
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
    ])
  );
});
