/* /trip/taiwan/ progressive enhancement: region and category filters over the
   server-rendered cards, plus 「加入清單」 saving place ids in this browser only
   (the /trip/ home shows the list). No network or third-party code; without this
   script every place stays visible and the save buttons stay hidden. */
(() => {
  'use strict';
  const hub = document.querySelector('[data-taiwan-hub]');
  if (!hub) return;
  const regions = ['north', 'central', 'south', 'east', 'offshore'];
  const regionButtons = [...hub.querySelectorAll('[data-region-filter]')];
  const categoryButtons = [...hub.querySelectorAll('[data-category-filter]')];
  const sections = [...hub.querySelectorAll('.hub-county')];
  const shapes = [...hub.querySelectorAll('.hub-map-svg [data-region]')];
  const list = hub.querySelector('.hub-list');
  const result = hub.querySelector('#hub-result');
  const empty = hub.querySelector('#hub-empty');
  const label = button => button.querySelector('.hub-region-name')?.textContent || '';
  const categoryLabel = { attraction: '景點', restaurant: '餐廳', hotel: '住宿' };
  const state = { region: 'all', category: 'all' };
  const fromHash = () => {
    const value = decodeURIComponent(location.hash.slice(1));
    return regions.includes(value) ? value : 'all';
  };

  function render() {
    let total = 0;
    for (const section of sections) {
      const inRegion = state.region === 'all' || section.dataset.region === state.region;
      let shown = 0;
      for (const card of section.querySelectorAll('.hub-card')) {
        const visible = inRegion && (state.category === 'all' || card.dataset.category === state.category);
        card.hidden = !visible;
        if (visible) shown++;
      }
      section.hidden = shown === 0;
      const count = section.querySelector('.hub-county-count');
      if (count) count.textContent = `${shown} 個`;
      total += shown;
    }
    for (const button of regionButtons) button.setAttribute('aria-pressed', String(button.dataset.regionFilter === state.region));
    for (const button of categoryButtons) button.setAttribute('aria-pressed', String(button.dataset.categoryFilter === state.category));
    for (const shape of shapes) shape.classList.toggle('is-dim', state.region !== 'all' && shape.dataset.region !== state.region);
    const region = regionButtons.find(button => button.dataset.regionFilter === state.region);
    const where = state.region === 'all' ? '' : label(region);
    const what = categoryLabel[state.category] || '';
    if (result) result.textContent = `${where ? where + ' ' : ''}${total} 個${what || '地點'}`;
    if (empty) {
      empty.hidden = total > 0;
      empty.textContent = total ? '' : `${where || '這裡'}還沒有${what}紀錄。`;
    }
  }

  function keepListInView() {
    if (!list) return;
    const top = list.getBoundingClientRect().top;
    if (top >= 0) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    list.scrollIntoView({ block: 'start', behavior: reduce ? 'auto' : 'smooth' });
  }

  function setRegion(region, { updateUrl = true } = {}) {
    state.region = region;
    if (updateUrl) {
      const url = location.pathname + location.search + (region === 'all' ? '' : `#${region}`);
      history.replaceState(history.state, '', url);
    }
    render();
    keepListInView();
  }

  hub.addEventListener('click', event => {
    const regionButton = event.target.closest('[data-region-filter]');
    if (regionButton) { setRegion(regionButton.dataset.regionFilter); return; }
    const categoryButton = event.target.closest('[data-category-filter]');
    if (categoryButton) { state.category = categoryButton.dataset.categoryFilter; render(); keepListInView(); return; }
    const shape = event.target.closest('.hub-map-svg .has-places[data-region]');
    if (shape) setRegion(state.region === shape.dataset.region ? 'all' : shape.dataset.region);
  });
  window.addEventListener('hashchange', () => setRegion(fromHash(), { updateUrl: false }));

  // 旅程清單: same key and shape as the /trip/ home ({ version: 1, ids }).
  const key = hub.dataset.storageKey;
  const saveButtons = [...hub.querySelectorAll('[data-save-place]')];
  const savedLink = hub.querySelector('[data-saved-link]');
  const savedCount = hub.querySelector('[data-saved-count]');
  const status = hub.querySelector('#hub-save-status');
  const known = new Set(saveButtons.map(button => button.dataset.savePlace));
  let saved = null;
  try {
    const raw = window.localStorage.getItem(key);
    const parsed = raw && raw.length < 20000 ? JSON.parse(raw) : null;
    saved = parsed && parsed.version === 1 && Array.isArray(parsed.ids)
      ? [...new Set(parsed.ids.filter(id => typeof id === 'string' && known.has(id)))].slice(0, 200)
      : [];
  } catch { saved = null; }
  if (key && saved) {
    const paintSaved = () => {
      const set = new Set(saved);
      for (const button of saveButtons) {
        const on = set.has(button.dataset.savePlace);
        button.setAttribute('aria-pressed', String(on));
        button.textContent = on ? '已在清單' : '加入清單';
      }
      if (savedLink) savedLink.hidden = saved.length === 0;
      if (savedCount) savedCount.textContent = String(saved.length);
    };
    for (const button of saveButtons) button.hidden = false;
    paintSaved();
    hub.addEventListener('click', event => {
      const button = event.target.closest('[data-save-place]');
      if (!button) return;
      const id = button.dataset.savePlace;
      const name = button.closest('.hub-card')?.querySelector('.hub-card-title')?.textContent || '';
      const next = saved.includes(id) ? saved.filter(other => other !== id) : [...saved, id].slice(0, 200);
      try { window.localStorage.setItem(key, JSON.stringify({ version: 1, ids: next })); } catch {
        if (status) status.textContent = '這個瀏覽器不能存清單。';
        return;
      }
      const added = next.length > saved.length;
      saved = next;
      paintSaved();
      if (status) status.textContent = added ? `已把 ${name} 加入清單，共 ${saved.length} 個` : `已從清單移除 ${name}`;
    });
  }
  state.region = fromHash();
  render();
})();
