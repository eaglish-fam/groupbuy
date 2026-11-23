// KidsRead 系列共用互動：篩選、書籍介紹（下方滑出）、選購清單、錄音貼紙示意。
// 頁面本身是完整的靜態 HTML；這支只負責「疊上去」的互動，失敗時頁面照樣能讀。
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const page = document.body.dataset.krPage;
  // 我們這團的賣場網址：開團、廠商給網址後填入（商品 id 依新賣場重新對照）。沒有網址時，清單只提供複製文字。
  const VENDOR_URL = null;
  const esc = v => String(v ?? '').replace(/[&<>"]/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[c]));

  // ---------- 篩選 ----------
  const state = {age: 'all', goal: 'all', tag: 'all'};
  const inAge = (ranges, id) => {
    if (id === 'all') return true;
    const [a, b] = id.split('-').map(Number);
    return (ranges || '').split(',').filter(Boolean).some(r => { const [lo, hi] = r.split('-'); return Number(lo) < b && (hi === '' ? 99 : Number(hi)) >= a; });
  };
  function applyFilter() {
    const cards = $$('[data-kr-grid] .kr-card');
    let n = 0;
    for (const c of cards) {
      const t = state.tag;
      const tagOk = t === 'all' || (t.startsWith('guide:') ? c.dataset.guide === t.slice(6) : (c.dataset.tags || '').split(' ').includes(t));
      const ok = inAge(c.dataset.ranges, state.age) && (state.goal === 'all' || c.dataset.goal === state.goal) && tagOk;
      c.hidden = !ok; if (ok) n++;
    }
    const count = $('[data-kr-count]'); if (count) count.textContent = n;
  }
  $$('[data-kr-finder]').forEach(f => { f.hidden = false; });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-kr-filter]'); if (!b) return;
    state[b.dataset.krFilter] = b.dataset.v;
    $$(`[data-kr-filter="${b.dataset.krFilter}"]`).forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    applyFilter();
  });

  // ---------- 選購清單（只存在這台裝置） ----------
  let LIST = [];
  try { LIST = JSON.parse(localStorage.getItem('kr-list') || '[]'); } catch { LIST = []; }
  const save = () => { try { localStorage.setItem('kr-list', JSON.stringify(LIST)); } catch { /* 私密模式 */ } };
  function syncList() {
    $$('[data-kr-add]').forEach(b => { b.hidden = false; const on = LIST.includes(b.dataset.krAdd); b.setAttribute('aria-pressed', String(on)); b.textContent = on ? '✓ 已在選購清單' : '加入選購清單'; });
    $$('[data-kr-open-list]').forEach(b => { b.hidden = LIST.length === 0; });
    $$('[data-kr-list-count]').forEach(b => { b.textContent = LIST.length; });
  }

  // ---------- 資料（書籍介紹、清單用；只在需要時載入） ----------
  let catalog = null;
  const loadCatalog = () => catalog ? Promise.resolve(catalog) : fetch('/data/kidsread/catalog.json').then(r => r.json()).then(d => (catalog = d));
  const homeUrl = it => `/blog/kidsread-${it.home}/#book-${it.id}`;
  function blocks(bs) {
    return (bs || []).map(b => {
      if (b.t === 'p') return b.html.trim() ? `<p>${b.html}</p>` : '';
      if (b.t === 'img') return `<figure><img src="${esc(b.f)}" width="${b.w}" height="${b.h}" alt="${esc(b.alt || b.cap || '教材實拍')}" loading="lazy">${b.cap ? `<figcaption>${esc(b.cap)}</figcaption>` : ''}</figure>`;
      if (b.t === 'gallery') return `<div class="kr-gallery">${b.items.map(i => `<figure><img src="${esc(i.f)}" width="${i.w}" height="${i.h}" alt="${esc(i.alt || i.cap || '教材實拍')}" loading="lazy"></figure>`).join('')}</div>`;
      if (b.t === 'h2') return `<h4>${esc(b.text)}</h4>`;
      if (b.t === 'ul' || b.t === 'ol') return `<${b.t}>${b.items.map(x => `<li>${x}</li>`).join('')}</${b.t}>`;
      return '';
    }).join('');
  }
  const sheet = $('#kr-sheet');
  function open(html, title) {
    if (!sheet) return;
    sheet.innerHTML = `<div class="kr-sheet-head"><h3 id="kr-sheet-title">${esc(title)}</h3><button type="button" class="kr-x" data-kr-close aria-label="關閉">×</button></div>${html}`;
    if (!sheet.open) sheet.showModal();
    $('.kr-x', sheet)?.focus();
    syncList();
  }
  async function openBook(id) {
    const d = await loadCatalog(); const it = d.items.find(i => i.id === id); if (!it) return false;
    const variants = it.variants?.length ? `<div class="kr-variants"><p><strong>這次可以買</strong></p><ul>${it.variants.map(v => `<li>${esc(v)}</li>`).join('')}</ul></div>` : '';
    open(`<div class="kr-sheet-body"><p class="kr-badges">${it.ages ? `<span class="kr-badge kr-age">${esc(it.ages.label)}</span>` : '<span class="kr-badge kr-todo">年齡待補</span>'}</p>${variants}<div class="kr-prose">${blocks(it.blocks)}</div></div>
<div class="kr-sheet-foot"><a class="kr-btn kr-ghost" href="${homeUrl(it)}">看完整介紹</a><button type="button" class="kr-btn" data-kr-add="${esc(it.id)}">加入選購清單</button></div>`, it.name);
    return true;
  }
  async function openList() {
    const d = await loadCatalog();
    const list = LIST.map(id => d.items.find(i => i.id === id)).filter(Boolean);
    const rows = list.map(it => `<li><img src="${esc(it.cover)}" alt="" width="64" height="64"><div><p><strong>${esc(it.name)}</strong></p>${(it.variants || []).length > 1 ? `<p class="kr-note">有 ${it.variants.length} 種可選：${it.variants.map(esc).join('／')}</p>` : ''}<p class="kr-row">${VENDOR_URL && it.vendorItems?.length ? `<a class="kr-btn kr-sm" href="${VENDOR_URL}#item-${esc(it.vendorItems[0])}" target="_blank" rel="noopener noreferrer">到賣場加入 ↗</a>` : `<a class="kr-btn kr-ghost kr-sm" href="${homeUrl(it)}">看介紹</a>`}<button type="button" class="kr-btn kr-ghost kr-sm" data-kr-add="${esc(it.id)}" data-kr-remove>移除</button></p></div></li>`).join('');
    open(`<div class="kr-sheet-body">${list.length ? `<p class="kr-note">${VENDOR_URL ? '賣場的購物車不能從別的網站直接放東西進去，所以每一項都連到賣場上的位置：按「到賣場加入」，選數量就好。' : '開團後，這裡每一項都會有「到賣場加入」，直接跳到賣場上那個商品。現在可以先複製清單，開團時對照著買。'}</p><ul class="kr-list">${rows}</ul>` : '<p>清單還是空的。打開任何一套教材，按「加入選購清單」。</p>'}</div>
<div class="kr-sheet-foot">${list.length ? '<button type="button" class="kr-btn kr-ghost" data-kr-copy>複製清單文字</button>' : ''}<a class="kr-btn" href="/blog/kidsread/#finder" data-kr-close>繼續挑教材</a></div>`, `選購清單（${list.length}）`);
  }

  document.addEventListener('click', async e => {
    const add = e.target.closest('[data-kr-add]');
    if (add) {
      const id = add.dataset.krAdd;
      LIST = LIST.includes(id) ? LIST.filter(x => x !== id) : [...LIST, id]; save(); syncList();
      if (add.hasAttribute('data-kr-remove')) openList();
      return;
    }
    if (e.target.closest('[data-kr-open-list]')) { openList(); return; }
    if (e.target.closest('[data-kr-close]')) { sheet?.close(); return; }
    const copy = e.target.closest('[data-kr-copy]');
    if (copy) {
      const d = await loadCatalog();
      const text = 'KidsRead 選購清單\n' + LIST.map((id, i) => `${i + 1}. ${d.items.find(x => x.id === id)?.name || id}`).join('\n');
      try { await navigator.clipboard.writeText(text); copy.textContent = '已複製'; } catch { copy.textContent = '請長按選取文字'; }
      setTimeout(() => { copy.textContent = '複製清單文字'; }, 1600);
      return;
    }
    // 書卡：同一頁就跳到介紹；不同頁先在本頁滑出介紹，看完再決定要不要過去
    const link = e.target.closest('[data-book] a, a[data-book]');
    if (link && !(e.metaKey || e.ctrlKey || e.shiftKey)) {
      const href = link.getAttribute('href') || '';
      if (href.startsWith('#')) return;
      const id = (link.closest('[data-book]') || link).dataset.book;
      e.preventDefault();
      if (!(await openBook(id).catch(() => false))) location.href = href;
    }
  });
  sheet?.addEventListener('click', e => { if (e.target === sheet) sheet.close(); });

  // ---------- 錄音貼紙示意（點讀筆那篇） ----------
  const PATHS = {A: 'A・中文：「蘋果」，爸媽自己錄的中文唸法', B: 'B・英文：“Apple”，英文發音', C: 'C・第三種語言：「りんご」，例如日文', D: 'D・解釋：「蘋果長在樹上，秋天最好吃」，給孩子的說明'};
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-kr-path]'); if (!b) return;
    $$('[data-kr-path]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
    const out = $('[data-kr-out]'); if (out) out.textContent = PATHS[b.dataset.krPath];
  });

  syncList();
})();
