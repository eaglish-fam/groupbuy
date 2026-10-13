const CACHE_NAME = "eaglish-living-edit-20260911-video-poster";
self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME));
});
self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    for (const key of await caches.keys())
      if (key.startsWith("eaglish-") && key !== CACHE_NAME) await caches.delete(key);
    await self.clients.claim();
  })());
});
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin || event.request.method !== "GET") return;
  // Media uses partial (206) responses, which Cache.put cannot store.
  // Leave streaming and seeking to the browser instead of the offline cache.
  if (event.request.headers.has("range") || ["video", "audio"].includes(event.request.destination)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const response = await fetch(event.request);
      if (response.ok && response.status !== 206) {
        // Cache failures must never replace a successful network response.
        try { await cache.put(event.request, response.clone()); } catch {}
      }
      return response;
    } catch {
      const fallback = await cache.match(event.request);
      return fallback || new Response("目前離線，請連線後重新整理。", { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } });
    }
  })());
});
