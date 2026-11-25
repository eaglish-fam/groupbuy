/* 選物誌首頁：開團 banner、狀態導覽列（開團中／即將開團／已結團／知識指南）、卡片上的狀態標籤。
   blog.js 讀完 Sheet、把卡片放進書架後呼叫 JournalHome.update(cards, rows)；沒有 JS 時，banner 留著靜態的第一篇、導覽列是錨點連結。 */
(() => {
  const doc = document;
  const main = doc.querySelector('main');
  const hero = doc.querySelector('[data-campaign-hero]');
  const track = hero?.querySelector('[data-ch-track]');
  const controls = hero?.querySelector('[data-ch-controls]');
  const dotsRoot = hero?.querySelector('[data-ch-dots]');
  const toggle = hero?.querySelector('[data-ch-toggle]');
  const tabs = [...doc.querySelectorAll('[data-status-tab]')];
  const SECTIONS = {open: 'open-now', upcoming: 'upcoming', journal: 'journal', guides: 'guides'};
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const esc = v => String(v ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));
  const today = () => window.ProductContent?.today?.() || new Date().toISOString().slice(0, 10);
  const daysBetween = (a, b) => Math.round((Date.parse(b + 'T00:00:00+08:00') - Date.parse(a + 'T00:00:00+08:00')) / 86400000);

  // ---------- 狀態導覽列 ----------
  function setTab(tab, push = true) {
    if (!SECTIONS[tab]) tab = 'all';
    if (main) main.dataset.statusTab = tab;
    for (const t of tabs) {
      if (t.dataset.statusTab === tab) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
    }
    if (push) {
      const url = new URL(location.href);
      url.hash = tab === 'all' ? '' : SECTIONS[tab];
      history.replaceState(history.state, '', url);
    }
  }
  doc.addEventListener('click', e => {
    const t = e.target.closest('[data-status-tab]'); if (!t) return;
    e.preventDefault();
    setTab(t.dataset.statusTab);
    const target = t.dataset.statusTab === 'all' ? hero : doc.getElementById(SECTIONS[t.dataset.statusTab]);
    target?.scrollIntoView({behavior: reduced.matches ? 'auto' : 'smooth', block: 'start'});
  });
  const fromHash = () => Object.keys(SECTIONS).find(k => '#' + SECTIONS[k] === location.hash) || 'all';
  setTab(fromHash(), false);
  window.addEventListener('hashchange', () => setTab(fromHash(), false));

  // ---------- 每張卡片的狀態資訊 ----------
  function info(card, rows) {
    const key = card.dataset.campaignKey || card.dataset.article;
    const row = rows && window.BlogIndexModel?.rowFor?.(rows, key);
    const date = v => window.ProductContent?.date?.(String(v || '').trim()) || '';
    const start = row ? date(row['開團日期']) : '', end = row ? date(row['結束日期']) : '';
    const img = card.querySelector('.card-image img');
    const link = card.querySelector('.card-image')?.getAttribute('href') || card.querySelector('h3 a')?.getAttribute('href');
    const buy = card.querySelector('[data-buy]');
    const state = card.dataset.state || 'journal';
    const now = today();
    let badge = card.querySelector('[data-status]')?.textContent.trim() || '';
    if (state === 'open' && end) { const left = daysBetween(now, end); badge = left <= 0 ? '開團中・今天截止' : `開團中・剩 ${left} 天`; }
    if (state === 'upcoming' && start) { const left = daysBetween(now, start); badge = left <= 1 ? (left <= 0 ? '今天開團' : '明天開團') : badge; }
    return {key, card, state, start, end, badge, link, buyUrl: buy && !buy.hidden ? buy.getAttribute('href') : '',
      title: card.querySelector('h3')?.textContent.trim() || '', excerpt: card.querySelector('.card-copy>p')?.textContent.trim() || '',
      img: img && {src: img.getAttribute('src'), srcset: img.getAttribute('srcset') || '', alt: img.getAttribute('alt') || '', w: img.getAttribute('width') || 1600, h: img.getAttribute('height') || 1000}};
  }
  function badgeCards(list) {
    for (const x of list) {
      let el = x.card.querySelector('.card-badge');
      if (x.state === 'journal' && x.card.dataset.contentKind !== 'explainer') { el?.remove(); continue; }
      if (!el) { el = doc.createElement('span'); el.className = 'card-badge'; el.setAttribute('aria-hidden', 'true'); x.card.querySelector('.card-image')?.append(el); }
      el.dataset.state = x.card.dataset.contentKind === 'explainer' && x.state === 'journal' ? 'guide' : x.state;
      el.textContent = x.state === 'journal' ? '知識指南' : x.badge;
    }
  }
  function counts(list) {
    const c = {open: 0, upcoming: 0, journal: 0, guides: 0};
    for (const x of list) {
      const shelf = x.card.closest('[data-shelf]')?.dataset.shelf;
      if (shelf in c) c[shelf]++;
    }
    for (const [k, n] of Object.entries(c)) doc.querySelectorAll(`[data-status-count="${k}"]`).forEach(b => { b.textContent = n ? String(n) : ''; });
  }

  // ---------- 開團 banner ----------
  let slides = [], active = 0, timer = 0, paused = reduced.matches, startX = null;
  function slideHtml(x, i, total) {
    const img = x.img ? `<img src="${esc(x.img.src)}"${x.img.srcset ? ` srcset="${esc(x.img.srcset)}" sizes="(max-width:900px) 100vw, 60vw"` : ''} alt="${esc(x.img.alt)}" width="${esc(x.img.w)}" height="${esc(x.img.h)}" ${i === 0 ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">` : '';
    const buy = x.state === 'open' && x.buyUrl ? `<a class="ch-buy" href="${esc(x.buyUrl)}" data-buy target="_blank" rel="noopener noreferrer">去團購 ↗</a>` : '';
    return `<article class="ch-slide${i === active ? ' is-active' : ''}" data-article="${esc(x.card.dataset.article)}"${x.card.dataset.campaignKey ? ` data-campaign-key="${esc(x.card.dataset.campaignKey)}"` : ''} aria-roledescription="slide" aria-label="第 ${i + 1} 則，共 ${total} 則">
<a class="ch-image" href="${esc(x.link)}" tabindex="-1" aria-hidden="true">${img}</a>
<div class="ch-panel"><p class="ch-badge" data-state="${esc(x.state)}">${esc(x.badge)}</p><h2 class="ch-title"><a href="${esc(x.link)}">${esc(x.title)}</a></h2><p class="ch-excerpt">${esc(x.excerpt)}</p><div class="ch-actions">${buy}<a class="ch-read" href="${esc(x.link)}">看選購筆記 →</a></div></div>
</article>`;
  }
  function show(i) {
    if (!slides.length || !track) return;
    active = (i + slides.length) % slides.length;
    track.querySelectorAll('.ch-slide').forEach((el, n) => el.classList.toggle('is-active', n === active));
    dotsRoot?.querySelectorAll('button').forEach((b, n) => b.setAttribute('aria-current', String(n === active)));
  }
  function schedule() {
    clearInterval(timer);
    if (!paused && slides.length > 1) timer = setInterval(() => { if (!doc.hidden) show(active + 1); }, 6500);
  }
  function renderHero(list) {
    if (!track) return;
    const open = list.filter(x => x.state === 'open').sort((a, b) => (a.end || '9999').localeCompare(b.end || '9999'));
    const upcoming = list.filter(x => x.state === 'upcoming').sort((a, b) => (a.start || '9999').localeCompare(b.start || '9999'));
    const picked = [...open, ...upcoming].filter(x => x.img && x.link).slice(0, 8);
    if (!picked.length) return; // 沒有開團或即將開團時，留著靜態的第一篇
    slides = picked; active = 0;
    track.innerHTML = picked.map((x, i) => slideHtml(x, i, picked.length)).join('');
    hero.setAttribute('aria-label', open.length ? '正在開團的選物' : '即將開團的選物');
    if (controls) controls.hidden = picked.length < 2;
    if (dotsRoot) dotsRoot.innerHTML = picked.map((x, i) => `<button type="button" aria-label="看第 ${i + 1} 則：${esc(x.title)}" aria-current="${i === 0}"></button>`).join('');
    schedule();
  }
  hero?.addEventListener('click', e => {
    if (e.target.closest('[data-ch-prev]')) { show(active - 1); schedule(); }
    else if (e.target.closest('[data-ch-next]')) { show(active + 1); schedule(); }
    else if (e.target.closest('[data-ch-dots] button')) { show([...dotsRoot.children].indexOf(e.target.closest('button'))); schedule(); }
    else if (e.target.closest('[data-ch-toggle]')) {
      paused = !paused; toggle.setAttribute('aria-pressed', String(paused));
      toggle.setAttribute('aria-label', paused ? '繼續自動輪播' : '暫停自動輪播');
      toggle.firstElementChild.textContent = paused ? '▶' : 'Ⅱ'; schedule();
    }
  });
  hero?.addEventListener('pointerdown', e => { startX = e.clientX; }, {passive: true});
  hero?.addEventListener('pointerup', e => {
    if (startX == null) return; const dx = e.clientX - startX; startX = null;
    if (Math.abs(dx) > 48) { show(active + (dx < 0 ? 1 : -1)); schedule(); }
  }, {passive: true});
  hero?.addEventListener('focusin', () => clearInterval(timer));
  hero?.addEventListener('focusout', schedule);

  window.JournalHome = {
    update(cards, rows) {
      const list = [...cards].map(c => info(c, rows));
      badgeCards(list); counts(list); renderHero(list);
    },
    setTab,
  };
})();

// 可左右滑的分頁、分類列：哪一側還有內容，就在那一側淡出（和買物社一致）。
(() => {
  for (const row of document.querySelectorAll('.journal-chrome .filter-scroll, .journal-chrome .status-scroll')) {
    const update = () => {
      const max = row.scrollWidth - row.clientWidth;
      row.classList.toggle('has-more-start', row.scrollLeft > 2);
      row.classList.toggle('has-more-end', max - row.scrollLeft > 2);
    };
    row.addEventListener('scroll', update, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(update).observe(row);
    update();
  }
})();
