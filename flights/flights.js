(() => {
  'use strict';

  const SHEET_ID = '1-RuyD9eCkrDpgFFXGHRWaTF-LYKaDK-MxAw3uNMozeU';
  const state = { deals: [], products: [], dealRegion: '全部', productRegion: '全部', query: '' };
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];

  function sheetUrl(name) {
    return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(name)}&_=${Date.now()}`;
  }

  async function getRows(name) {
    const response = await fetch(sheetUrl(name), { cache: 'no-store' });
    if (!response.ok) throw new Error(`${name} 讀取失敗`);
    const text = await response.text();
    if (/^\s*</.test(text)) throw new Error(`${name} 尚未公開`);
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    if (parsed.errors.length) throw new Error(`${name} 資料格式不正確`);
    return parsed.data;
  }

  const esc = (value) => String(value ?? '')
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  function safeUrl(value, hosts = []) {
    try {
      const url = new URL(String(value));
      if (url.protocol !== 'https:') return '';
      if (hosts.length && !hosts.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) return '';
      return url.href;
    } catch { return ''; }
  }

  function money(value) {
    const amount = Number(String(value).replace(/[^\d.]/g, ''));
    return Number.isFinite(amount) ? `NT$ ${Math.round(amount).toLocaleString('zh-TW')}` : '查看最新價格';
  }

  function isFresh(row) {
    if (!row.expires_at) return true;
    const time = Date.parse(row.expires_at);
    return Number.isFinite(time) && time > Date.now();
  }

  function renderDeals() {
    const grid = $('#deal-grid');
    const rows = state.deals.filter((row) =>
      row.status === 'published' && row.review_status === 'approved' && isFresh(row) &&
      (state.dealRegion === '全部' || row.region === state.dealRegion)
    );
    grid.setAttribute('aria-busy', 'false');
    if (!rows.length) {
      grid.innerHTML = `<div class="empty-state"><div><strong>第一批票價正在實查</strong><span>目前沒有通過複核、仍有效的機票優惠。這裡不會用示意價格填空；有合格資料後會直接出現在這裡。</span></div></div>`;
      return;
    }
    grid.innerHTML = rows.map((row) => {
      const link = safeUrl(row.search_url);
      return `<article class="deal-card">
        <div class="deal-route">${esc(row.origin)} <span>→</span> ${esc(row.destination)}</div>
        <div class="deal-meta"><span class="tag">${esc(row.region)}</span><span class="tag">${esc(row.stops || '轉機資訊待確認')}</span><span class="tag">${esc(row.baggage || '行李待確認')}</span></div>
        <div class="deal-price">${money(row.price_twd)}</div>
        <p>${esc(row.title || row.summary || '')}</p>
        <small>觀測：${esc(row.observed_at || '未標示')} · 來源：${esc(row.source)}</small>
        ${link ? `<a href="${esc(link)}" target="_blank" rel="noopener nofollow">向供應商重新查價 ↗</a>` : ''}
      </article>`;
    }).join('');
  }

  function renderProducts() {
    const grid = $('#product-grid');
    const query = state.query.trim().toLocaleLowerCase('zh-TW');
    const rows = state.products.filter((row) => {
      if (row.status !== 'published') return false;
      if (state.productRegion !== '全部' && row.region !== state.productRegion) return false;
      if (!query) return true;
      return [row.country, row.city, row.category, row.title].join(' ').toLocaleLowerCase('zh-TW').includes(query);
    });
    grid.setAttribute('aria-busy', 'false');
    if (!rows.length) {
      grid.innerHTML = `<div class="empty-state"><div><strong>沒有符合的旅遊商品</strong><span>換一個地區或關鍵字看看。</span></div></div>`;
      return;
    }
    grid.innerHTML = rows.map((row) => {
      const image = safeUrl(row.image_url, ['klook.com']);
      const affiliate = safeUrl(row.affiliate_url, ['klook.com']);
      const rating = Number(row.rating) > 0 ? `★ ${esc(row.rating)} <span>(${Number(row.review_count || 0).toLocaleString('zh-TW')})</span>` : '';
      return `<article class="product-card">
        <div class="product-image">${image ? `<img src="${esc(image)}" alt="" loading="lazy" width="720" height="450" />` : ''}</div>
        <div class="product-body">
          <div class="product-kicker"><span>${esc(row.country)}${row.city ? ` · ${esc(row.city)}` : ''}</span><span>${esc(row.category)}</span></div>
          <h3>${esc(row.title)}</h3>
          <div class="product-rating">${rating}</div>
          <div class="product-bottom">
            <div class="product-price"><small>Klook 目錄參考價起</small><strong>${money(row.price_twd)}</strong></div>
            ${affiliate ? `<a class="product-link" href="${esc(affiliate)}" target="_blank" rel="sponsored noopener">查看商品 ↗</a>` : ''}
          </div>
        </div>
      </article>`;
    }).join('');
  }

  function bindFilters() {
    $$('[data-deal-region]').forEach((button) => button.addEventListener('click', () => {
      state.dealRegion = button.dataset.dealRegion;
      $$('[data-deal-region]').forEach((item) => { item.classList.toggle('is-active', item === button); item.setAttribute('aria-pressed', item === button ? 'true' : 'false'); });
      renderDeals();
    }));
    $$('[data-product-region]').forEach((button) => button.addEventListener('click', () => {
      state.productRegion = button.dataset.productRegion;
      $$('[data-product-region]').forEach((item) => { item.classList.toggle('is-active', item === button); item.setAttribute('aria-pressed', item === button ? 'true' : 'false'); });
      renderProducts();
    }));
    $('#product-search').addEventListener('input', (event) => { state.query = event.target.value; renderProducts(); });
  }

  async function boot() {
    bindFilters();
    const [deals, products, status] = await Promise.allSettled([
      getRows('機票優惠'), getRows('旅遊商品'), getRows('系統狀態')
    ]);
    if (deals.status === 'fulfilled') state.deals = deals.value;
    if (products.status === 'fulfilled') state.products = products.value;
    const statusRows = status.status === 'fulfilled' ? Object.fromEntries(status.value.map((row) => [row.key, row])) : {};
    const readyDeals = state.deals.filter((row) => row.status === 'published' && row.review_status === 'approved' && isFresh(row)).length;
    $('#radar-status').textContent = readyDeals ? `${readyDeals} 筆有效優惠` : '已上線，等待第一筆實查票價';
    $('#radar-note').textContent = statusRows.last_klook_catalog_import ? `旅遊商品更新：${statusRows.last_klook_catalog_import.value}` : '資料來源連線中';
    renderDeals();
    renderProducts();
  }

  boot().catch((error) => {
    $('#radar-status').textContent = '資料暫時無法讀取';
    $('#radar-note').textContent = '請稍後重新整理';
    $('#deal-grid').innerHTML = `<div class="empty-state"><div><strong>資料暫時離線</strong><span>${esc(error.message)}</span></div></div>`;
    $('#product-grid').innerHTML = `<div class="empty-state"><div><strong>資料暫時離線</strong><span>請稍後再試。</span></div></div>`;
  });
})();
