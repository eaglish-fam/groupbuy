(() => {
  const sheetUrl = 'https://docs.google.com/spreadsheets/d/1-RuyD9eCkrDpgFFXGHRWaTF-LYKaDK-MxAw3uNMozeU/gviz/tq?tqx=out:csv&headers=1&sheet=' + encodeURIComponent('現正開團');
  const cards = [...document.querySelectorAll('[data-article]')]
    .sort((a,b) => BlogIndexModel.newestFirst(a.dataset.published,b.dataset.published));
  const shelves = Object.fromEntries(['open','upcoming','journal'].map(k => [k, document.querySelector('[data-shelf="' + k + '"]')]));
  const filterButtons = [...document.querySelectorAll('[data-blog-category]')];
  const availableCategories = new Set(cards.map(card => card.dataset.category).filter(Boolean));
  const filterEmpty = document.querySelector('#filter-empty');
  const requestedCategory = new URLSearchParams(location.search).get('category') || '';
  let currentCategory = availableCategories.has(requestedCategory) ? requestedCategory : '';
  let inFlight = null, refreshedAt = 0, day = '', buying = false;
  function emptyStates() {
    let visibleTotal = 0;
    for (const [key, shelf] of Object.entries(shelves)) {
      const visible = [...shelf.querySelectorAll('[data-article]')].filter(card => !card.hidden).length;
      visibleTotal += visible;
      shelf.classList.toggle('is-filtered', Boolean(currentCategory));
      document.querySelector('[data-empty="' + key + '"]').hidden = visible > 0;
      shelf.closest('.shelf').hidden = Boolean(currentCategory) && visible === 0;
    }
    filterEmpty.hidden = visibleTotal > 0;
  }
  function applyCategory(category, updateUrl = true) {
    currentCategory = availableCategories.has(category) ? category : '';
    for (const card of cards) card.hidden = Boolean(currentCategory) && card.dataset.category !== currentCategory;
    for (const button of filterButtons) button.setAttribute('aria-pressed', String(button.dataset.blogCategory === currentCategory));
    if (updateUrl) {
      const url = new URL(location.href);
      if (currentCategory) url.searchParams.set('category', currentCategory);
      else url.searchParams.delete('category');
      history.pushState({category: currentCategory}, '', url);
    }
    emptyStates();
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
    applyCategory(currentCategory, false);
    day = ProductContent.today();
    refreshedAt = Date.now();
  }
  function fail() {
    refreshedAt = 0;
    for (const card of cards) {
      card.dataset.state = 'journal';
      card.querySelector('[data-status]').textContent = '團購狀態待確認';
      const buy = card.querySelector('[data-buy]');
      buy.hidden = true; buy.removeAttribute('href');
      shelves.journal.append(card);
    }
    applyCategory(currentCategory, false);
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
  document.addEventListener('click', e => {
    const button = e.target.closest('[data-blog-category]');
    if (!button) return;
    applyCategory(button.dataset.blogCategory);
    document.querySelector('#open-now:not([hidden]), #upcoming:not([hidden]), #journal:not([hidden])')?.scrollIntoView({behavior:'smooth',block:'start'});
  });
  window.addEventListener('popstate', () => applyCategory(new URLSearchParams(location.search).get('category') || '', false));
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
      const destination = ProductContent.withUTM(c.url, ProductContent.catalog[key].brands[0]);
      const article = ProductContent.catalog[key];
      window.SiteAnalytics?.outboundGroupbuy({ productId: article.id, productName: article.brands[0], groupType: c.end ? 'limited' : 'evergreen', sourceSurface: 'blog_index_card', articleSlug: article.id, destinationUrl: destination, ctaLabel: a.textContent, campaignKey: c.end || 'evergreen', legacyEvent: 'click_group_from_blog' });
      if (pending && !pending.closed) pending.location.replace(destination);
      else location.assign(destination);
    } finally { buying = false; }
  });
  applyCategory(currentCategory, false);
  refresh();
})();
