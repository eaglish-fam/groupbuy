(() => {
  const sheetUrl = 'https://docs.google.com/spreadsheets/d/1-RuyD9eCkrDpgFFXGHRWaTF-LYKaDK-MxAw3uNMozeU/gviz/tq?tqx=out:csv&headers=1&sheet=' + encodeURIComponent('現正開團');
  const cards = [...document.querySelectorAll('[data-article]')]
    .sort((a,b) => BlogIndexModel.newestFirst(a.dataset.published,b.dataset.published));
  const shelves = Object.fromEntries(['open','upcoming','journal'].map(k => [k, document.querySelector('[data-shelf="' + k + '"]')]));
  const freshness = document.querySelector('#freshness');
  let inFlight = null, refreshedAt = 0, day = '', buying = false;
  function emptyStates() {
    for (const [key, shelf] of Object.entries(shelves))
      document.querySelector('[data-empty="' + key + '"]').hidden = !!shelf.querySelector('[data-article]');
  }
  function render(rows) {
    for (const card of cards) {
      const state = BlogIndexModel.stateFor(BlogIndexModel.rowFor(rows, card.dataset.article));
      card.dataset.state = state.shelf;
      card.querySelector('[data-status]').textContent = state.label;
      const buy = card.querySelector('[data-buy]');
      buy.hidden = !state.url;
      if (state.url) { buy.href = state.url; buy.target = '_blank'; buy.rel = 'noopener noreferrer'; }
      else buy.removeAttribute('href');
      shelves[state.shelf].append(card);
    }
    emptyStates();
    day = ProductContent.today();
    refreshedAt = Date.now();
    freshness.textContent = '團購狀態已依 ' + day.replaceAll('-','/') + ' 的最新資料確認。';
  }
  function fail() {
    refreshedAt = 0;
    freshness.textContent = '目前無法取得最新團購狀態；文章仍可閱讀，購買入口暫不顯示。';
    for (const card of cards) {
      card.dataset.state = 'journal';
      card.querySelector('[data-status]').textContent = '團購狀態待確認';
      const buy = card.querySelector('[data-buy]');
      buy.hidden = true; buy.removeAttribute('href');
      shelves.journal.append(card);
    }
    emptyStates();
  }
  function refresh() {
    if (inFlight) return inFlight;
    inFlight = (async () => {
      try {
        const response = await fetch(sheetUrl + '&_=' + Date.now(), { cache: 'no-store', signal: AbortSignal.timeout(12000) });
        if (!response.ok) throw Error('Sheet unavailable');
        const csv = await response.text();
        if (/^\s*</.test(csv)) throw Error('Unexpected response');
        const parsed = Papa.parse(csv, {header:false, skipEmptyLines:true});
        if (parsed.errors.length) throw Error('Invalid CSV');
        const rows = ProductContent.sheetRows(parsed.data);
        render(rows);
        return rows;
      } catch { fail(); return null; }
      finally { inFlight = null; }
    })();
    return inFlight;
  }
  function resume() {
    if (!document.hidden && (day !== ProductContent.today() || Date.now() - refreshedAt > 30000)) refresh();
  }
  window.addEventListener('focus', resume);
  document.addEventListener('visibilitychange', resume);
  setInterval(() => { if (!document.hidden && (day !== ProductContent.today() || Date.now() - refreshedAt > 300000)) refresh(); }, 60000);
  document.addEventListener('click', async e => {
    const a = e.target.closest('[data-buy]');
    if (!a) return;
    e.preventDefault();
    if (buying) return;
    buying = true;
    const key = a.closest('[data-article]').dataset.article;
    const pending = window.open('about:blank', '_blank');
    if (pending) { pending.opener = null; pending.document.title = '正在確認當期團購'; }
    try {
      const rows = await refresh();
      const c = rows && ProductContent.campaignFor(rows, key);
      if (!c || c.state !== 'open') { pending?.close(); return; }
      window.SiteAnalytics?.track('click_group_from_blog', { group_name: ProductContent.catalog[key].brands[0], event_category: 'conversion' });
      const destination = ProductContent.withUTM(c.url, ProductContent.catalog[key].brands[0]);
      if (pending && !pending.closed) pending.location.replace(destination);
      else location.assign(destination);
    } finally { buying = false; }
  });
  refresh();
})();
