/* Content first; one complete OFL serif downloaded only at phase two.
   Existing serif roles and system-sans body styles are not redefined here. */
(() => {
  'use strict';
  if (window.EaglishSiteFont) return;
  const script = document.currentScript;
  const entry = script?.dataset.fontEntry === 'true';
  const state = window.EaglishSiteFont = { status: entry ? 'deferred' : 'scheduled', entry, requests: 0 };
  const fontUrl = '/assets/fonts/noto-serif-tc-complete-500-v1.woff2';
  let fontCache;
  async function fontResponse() {
    // Cache API works in a secure page without a worker. Keep an immutable
    // public font across navigations even when WebKit discards HTTP memory cache.
    try {
      if (typeof caches !== 'undefined') {
        fontCache = await caches.open('eaglish-complete-heading-font-v1');
        const hit = await fontCache.match(fontUrl);
        if (hit?.ok) { state.cache = 'storage'; return hit; }
      }
    } catch (error) { fontCache = undefined; state.cacheIssue = { stage: 'open', name: error.name, message: error.message }; /* Storage denied: use normal HTTP cache. */ }
    state.requests++; state.cache = 'http';
    const response = await fetch(fontUrl, { cache: 'force-cache', priority: 'low' });
    if (response.ok && fontCache) {
      try { await fontCache.put(fontUrl, response.clone()); } catch (error) { state.cacheIssue = { stage: 'put', name: error.name, message: error.message }; /* Quota cannot block readable content. */ }
    }
    return response;
  }
  let started = false;
  function decodeResponse(response) {
    response
      .then(response => { if (!response.ok) throw new Error('Font unavailable'); return response.arrayBuffer(); })
      .then(bytes => Promise.all(['Eaglish Heading Serif', 'Eaglish Travel Heading Serif'].map(family =>
        new FontFace(family, bytes, { weight: '500', style: 'normal', display: 'swap' }).load())))
      .then(faces => { for (const face of faces) document.fonts.add(face); state.status = 'ready';
        document.dispatchEvent(new CustomEvent('eaglish:font-ready')); })
      .catch(async () => { state.status = 'error'; /* Fallback remains visible; no retry loop. */
        try { await fontCache?.delete(fontUrl); } catch { /* Optional cache recovery only. */ } });
  }
  function start() {
    if (started) return;
    started = true;
    if (typeof FontFace !== 'function' || !document.fonts || typeof fetch !== 'function') {
      state.status = 'unsupported'; return;
    }
    state.status = 'loading'; decodeResponse(fontResponse());
  }
  async function warmEntry() {
    if (started || typeof caches === 'undefined' || typeof FontFace !== 'function' || !document.fonts) return;
    try {
      const cache = await caches.open('eaglish-complete-heading-font-v1'), hit = await cache.match(fontUrl);
      if (!hit?.ok || started) return; // Cold homepage stays deferred; never fetch.
      started = true; fontCache = cache; state.cache = 'storage'; state.status = 'loading';
      decodeResponse(Promise.resolve(hit));
    } catch (error) { state.cacheIssue = { stage: 'warm-entry', name: error.name, message: error.message }; }
  }
  function afterPaint(action) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      if ('requestIdleCallback' in window) requestIdleCallback(action, { timeout: 1000 });
      else setTimeout(action, 0);
    }));
  }
  let scheduled = false;
  function schedule() {
    if (started || scheduled) return;
    scheduled = true; state.status = 'scheduled';
    // Two frames allow fallback content to paint; the download cannot block it.
    afterPaint(start);
  }
  if (entry) {
    afterPaint(warmEntry); // Cache-only enhancement after paint, no homepage GET.
    // Real view changes, not mere homepage parsing or scrolling, unlock phase 2.
    document.addEventListener('click', event => {
      if (!event.isTrusted) return;
      if (event.target.closest('[data-action="top"], [role="tab"], a[href^="#"]')) schedule();
    });
    window.addEventListener('hashchange', schedule);
  } else schedule();
})();
