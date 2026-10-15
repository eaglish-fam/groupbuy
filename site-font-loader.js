/* Content first; the heading serif downloads only at phase two.
   Existing serif roles and system-sans body styles are not redefined here.
   v2: one "site" face holds every character the site publishes (about 520 KB instead of the
   3.9 MB complete font); small unicode-range slices cover the rest of the complete cmap and
   download only when a page shows one of their characters, so no heading falls back. */
(() => {
  'use strict';
  if (window.EaglishSiteFont) return;
  const script = document.currentScript;
  const entry = script?.dataset.fontEntry === 'true';
  const state = window.EaglishSiteFont = { status: entry ? 'deferred' : 'scheduled', entry, requests: 0 };
  const families = ['Eaglish Heading Serif', 'Eaglish Travel Heading Serif'];
  const fontDir = '/assets/fonts/heading-serif-500-v2/';
  const manifestUrl = `${fontDir}manifest.json`;
  const siteUrl = `${fontDir}site.woff2`;
  const fontCacheName = 'heading-serif-site-500-v2';
  // A visitor who already stored the complete v1 font keeps using it: a superset, no network.
  const completeUrl = '/assets/fonts/noto-serif-tc-complete-500-v1.woff2';
  const completeCacheName = 'heading-serif-complete-500-v1';
  const legacyFontCacheName = 'eaglish-complete-heading-font-v1';
  let fontCache;
  async function cachedFont() {
    // Cache API works in a secure page without a worker. Keep immutable public fonts across
    // navigations even when WebKit discards HTTP memory cache.
    try {
      if (typeof caches !== 'undefined') {
        fontCache = await caches.open(fontCacheName);
        // The site face is only usable with its manifest (the slice ranges); both are stored together.
        const [hit, map] = await Promise.all([fontCache.match(siteUrl), fontCache.match(manifestUrl)]);
        if (hit?.ok && map?.ok) { state.cache = 'storage'; return { response: hit, complete: false, map: await map.json() }; }
        // Named matches are read-only: a missing older cache must not be created.
        for (const cacheName of [completeCacheName, legacyFontCacheName]) {
          const old = await caches.match(completeUrl, { cacheName });
          if (old?.ok) { state.cache = cacheName === completeCacheName ? 'complete-storage' : 'legacy-storage'; return { response: old, complete: true }; }
        }
      }
    } catch (error) { fontCache = undefined; state.cacheIssue = { stage: 'open', name: error.name, message: error.message }; /* Storage denied: use normal HTTP cache. */ }
  }
  async function siteFont() {
    const hit = await cachedFont();
    if (hit) return hit;
    state.cache = 'http';
    const [response, map] = await Promise.all([siteUrl, manifestUrl].map(url => {
      state.requests++;
      return fetch(url, { cache: 'force-cache', priority: 'low' });
    }));
    if (!map.ok) throw new Error('Font manifest unavailable');
    if (response.ok && fontCache) {
      try { await Promise.all([fontCache.put(manifestUrl, map.clone()), fontCache.put(siteUrl, response.clone())]); }
      catch (error) { state.cacheIssue = { stage: 'put', name: error.name, message: error.message }; /* Quota cannot block readable content. */ }
    }
    return { response, complete: false, map: await map.json() };
  }
  let started = false;
  function decode(font) {
    font
      .then(async ({ response, complete, map }) => {
        if (!response.ok) throw new Error('Font unavailable');
        const bytes = await response.arrayBuffer();
        const base = { weight: '500', style: 'normal', display: 'swap' };
        const faces = await Promise.all(families.map(family =>
          new FontFace(family, bytes, complete ? base : { ...base, unicodeRange: map.site.unicodeRange }).load()));
        // Slices stay unloaded until a page renders one of their characters.
        const slices = complete ? [] : families.flatMap(family => map.slices.map(slice =>
          new FontFace(family, `url(${fontDir}${slice.file}) format("woff2")`, { ...base, unicodeRange: slice.unicodeRange })));
        for (const face of [...faces, ...slices]) document.fonts.add(face);
        state.status = 'ready'; state.slices = slices.length / families.length;
        document.dispatchEvent(new CustomEvent('eaglish:font-ready'));
      })
      .catch(async () => { state.status = 'error'; /* Fallback remains visible; no retry loop. */
        try { await fontCache?.delete(siteUrl); } catch { /* Optional cache recovery only. */ } });
  }
  function start() {
    if (started) return;
    started = true;
    if (typeof FontFace !== 'function' || !document.fonts || typeof fetch !== 'function') {
      state.status = 'unsupported'; return;
    }
    state.status = 'loading'; decode(siteFont());
  }
  async function warmEntry() {
    if (started || typeof caches === 'undefined' || typeof FontFace !== 'function' || !document.fonts) return;
    try {
      const hit = await cachedFont();
      if (!hit || started) return; // Cold homepage stays deferred; never fetch.
      started = true; state.status = 'loading';
      decode(Promise.resolve(hit));
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
