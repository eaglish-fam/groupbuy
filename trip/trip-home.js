/* /trip/ home progressive enhancement. Without it every destination stays visible
   and the page is complete. No network or third-party code: it filters the
   server-rendered cards by continent, and shows the Taiwan places this browser
   saved earlier (same local key the previous travel atlas used). */
(() => {
  'use strict';
  const chips = document.querySelector('[data-continent-chips]');
  const grid = document.querySelector('[data-home-guides]');
  if (chips && grid) {
    const buttons = [...chips.querySelectorAll('[data-continent]')];
    const cards = [...grid.querySelectorAll('.dest-card')];
    const status = document.getElementById('destinations-status');
    chips.hidden = false;
    chips.addEventListener('click', event => {
      const button = event.target.closest('[data-continent]');
      if (!button) return;
      const value = button.dataset.continent;
      let shown = 0;
      for (const card of cards) {
        card.hidden = value !== 'all' && card.dataset.region !== value;
        if (!card.hidden) shown++;
      }
      for (const other of buttons) other.setAttribute('aria-pressed', String(other === button));
      if (status) status.textContent = `${button.textContent} ${shown} 個國家`;
    });
  }

  const list = document.querySelector('[data-trip-list]');
  const source = document.getElementById('trip-list-places');
  if (!list || !source) return;
  let places, key = source.dataset.storageKey, ids = [];
  try {
    places = JSON.parse(source.textContent);
    const saved = JSON.parse(window.localStorage.getItem(key) || 'null');
    if (saved && saved.version === 1 && Array.isArray(saved.ids)) ids = [...new Set(saved.ids.filter(id => typeof id === 'string' && places[id]))].slice(0, 200);
  } catch { return; }
  const items = list.querySelector('[data-trip-list-items]');
  const count = list.querySelector('[data-trip-list-count]');
  const feedback = document.getElementById('trip-list-feedback');

  function render() {
    items.textContent = '';
    for (const id of ids) {
      const [name, href] = places[id];
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = href;
      a.textContent = name;
      if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
      const remove = document.createElement('button');
      remove.type = 'button';
      remove.textContent = '移除';
      remove.setAttribute('aria-label', `從清單移除 ${name}`);
      remove.addEventListener('click', () => {
        ids = ids.filter(other => other !== id);
        try { window.localStorage.setItem(key, JSON.stringify({ version: 1, ids })); } catch { /* keep the page usable */ }
        if (feedback) feedback.textContent = `已移除 ${name}`;
        render();
        (items.querySelector('button') || list.querySelector('.plan-link'))?.focus();
      });
      li.append(a, remove);
      items.append(li);
    }
    count.textContent = ids.length ? `存在這個瀏覽器的 ${ids.length} 個台灣地點。` : '清單已清空。';
  }
  if (!ids.length) return;
  list.hidden = false;
  render();
})();
