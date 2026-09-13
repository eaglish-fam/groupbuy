(() => {
  'use strict';
  const SHEET_ID = '1-RuyD9eCkrDpgFFXGHRWaTF-LYKaDK-MxAw3uNMozeU';
  const model = window.FlightsModel;
  const state = { deals: [], products: [], dealRegion: '全部', productRegion: '全部', query: '', visible: 6, dealsError: false, productsError: false };
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const esc = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

  async function getRows(name) {
    const url = 'https://docs.google.com/spreadsheets/d/' + SHEET_ID + '/gviz/tq?tqx=out:csv&headers=1&sheet=' + encodeURIComponent(name) + '&_=' + Date.now();
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error('讀取失敗');
    const text = await response.text();
    if (/^\s*</.test(text)) throw new Error('資料暫時無法讀取');
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
    if (parsed.errors.length) throw new Error('資料格式不正確');
    return parsed.data;
  }

  function emptyState(kicker, title, description, action = '') {
    return '<div class="empty-state"><span class="empty-kicker">' + esc(kicker) + '</span><strong>' + esc(title) + '</strong><p>' + esc(description) + '</p>' + action + '</div>';
  }

  function renderDeals() {
    const grid = $('#deal-grid');
    grid.setAttribute('aria-busy', 'false');
    if (state.dealsError) {
      $('#radar-status').textContent = '機票資料暫時無法讀取';
      grid.innerHTML = emptyState('PLEASE TRY AGAIN', '機票資料稍後再見。', '請稍後重新整理，或先逛逛下面的目的地靈感。', '<button type="button" class="text-link retry" data-retry>重新載入 ↻</button>');
      return;
    }
    const rows = model.eligibleDeals(state.deals, state.dealRegion);
    $('#radar-status').textContent = (state.dealRegion === '全部' ? '全部目的地' : state.dealRegion === '全球漏票' ? '全球特別票價' : state.dealRegion) + ' · ' + rows.length + ' 筆機票機會';
    if (!rows.length) {
      grid.innerHTML = emptyState('A GOOD TRIP IS WORTH THE WAIT', '下一張好價格，值得等一下。', state.dealRegion === '全部' ? '目前沒有仍在有效時間內的機票。先看看目的地的交通與體驗，替下一趟旅行留點靈感。' : '這個地區目前沒有仍在有效時間內的機票，也可以切換其他地區看看。', '<a class="text-link" href="#inspiration">先逛目的地 <span aria-hidden="true">↓</span></a>');
      return;
    }
    grid.innerHTML = rows.map((row, index) => {
      const origin = model.airport(row.origin);
      const destination = model.airport(row.destination);
      const link = model.safeUrl(row.search_url);
      const roundtrip = Boolean(row.inbound_date);
      const baggage = !row.baggage || /^(未知|unknown)$/i.test(row.baggage) ? '托運行李待確認' : row.baggage;
      const conditions = [row.stops || '轉機資訊待確認', row.airline ? '航空公司代碼 ' + row.airline : '航空公司待確認'].join(' · ');
      const dates = model.travelDate(row.outbound_date, true) + (roundtrip ? ' — ' + model.travelDate(row.inbound_date) : '');
      return `<article class="deal-card" aria-label="${esc(origin.city)}到${esc(destination.city)}${roundtrip ? '來回' : '單程'}機票">
        <div class="ticket-main">
          <div class="ticket-destination" aria-hidden="true"><img src="/flights/assets/sky-wing.webp" alt="" width="200" height="320" loading="lazy" /><div class="ticket-destination-label"><small>NEXT STOP</small><strong>${esc(destination.code)}</strong></div></div>
          <div class="ticket-content">
          <div class="ticket-route"><div class="ticket-kicker"><b>${String(index + 1).padStart(2, '0')}</b><span>${esc(row.region === '全球漏票' ? '全球特別票價' : row.region)} · ${roundtrip ? '來回機票' : '單程機票'}</span></div>
            <div class="route-airports"><div class="airport"><h3>${esc(origin.city)}</h3><small>${esc(origin.code)} ${esc(origin.name)}</small></div>
              <span class="route-line" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m3 11 7-1-3-7 3 1 5 6 5 1c2 0 2 2 0 2l-5 1-5 6-3 1 3-7-7-1z"/></svg></span>
              <div class="airport"><h3>${esc(destination.city)}</h3><small>${esc(destination.code)} ${esc(destination.name)}</small></div>
            </div>
          </div>
          <div class="ticket-info"><p class="ticket-dates">${esc(dates)}</p><p class="conditions">${esc(conditions)}</p><p class="baggage">${esc(baggage)}</p></div>
          <div class="ticket-price"><small>${roundtrip ? '來回' : '單程'}／每人參考價</small><div class="price-amount"><small>NT$</small><strong>${model.amount(row.price_twd).toLocaleString('zh-TW')}</strong></div><a class="button" href="${esc(link)}" target="_blank" rel="noopener nofollow">查看最新票價 <span aria-hidden="true">↗</span></a></div>
          </div>
          <div class="ticket-stub" aria-hidden="true"><span>FARE FIND · EAGLISH TRAVEL</span></div>
        </div>
        <div class="ticket-foot"><span>查價 ${esc(model.localDate(row.observed_at))}（台灣時間） · ${esc(row.source || '來源未提供')}</span><details><summary>展開票價說明</summary><p>${esc(row.summary || '請於供應商頁面確認航班、行李、稅費與付款條件。')}</p><p>本筆資訊顯示至 ${esc(model.localDate(row.expires_at))}（台灣時間）；期限不代表供應商保留此價格。</p><p>票券造型僅呈現機票資訊，不代表已出票或保留座位。</p></details></div>
      </article>`;
    }).join('');
  }

  function renderProducts(focusIndex = -1) {
    const grid = $('#product-grid');
    grid.setAttribute('aria-busy', 'false');
    if (state.productsError) {
      $('#product-count').textContent = '旅遊商品暫時無法讀取';
      $('#show-more').hidden = true;
      grid.innerHTML = emptyState('PLEASE TRY AGAIN', '旅行靈感稍後再見。', '商品資料暫時無法讀取，請稍後再試。', '<button type="button" class="text-link retry" data-retry>重新載入 ↻</button>');
      return;
    }
    const rows = model.matchingProducts(state.products, state.productRegion, state.query);
    $('#product-count').textContent = rows.length + ' 個旅行靈感' + (rows.length > state.visible ? ' · 先看 ' + state.visible + ' 個' : '');
    $('#show-more').hidden = rows.length <= state.visible;
    if (!rows.length) {
      grid.innerHTML = emptyState('KEEP EXPLORING', '換個關鍵字，再找找看。', '目前沒有符合的旅遊商品。試試國家、城市或體驗名稱。');
      return;
    }
    grid.innerHTML = rows.slice(0, state.visible).map(row => {
      const image = model.safeUrl(row.image_url, ['klook.com']);
      const affiliate = model.safeUrl(row.affiliate_url, ['klook.com']);
      const rating = Number(row.rating) > 0 ? '<span class="star" aria-hidden="true">★</span>' + esc(row.rating) + ' ／ ' + Number(row.review_count || 0).toLocaleString('zh-TW') + ' 則評價' : '查看旅客評價';
      const img = image ? '<img src="' + esc(image) + '" alt="' + esc(row.title) + '" loading="lazy" width="720" height="540" />' : '<span class="image-placeholder">目的地靈感</span>';
      const destination = [row.country, row.city && row.city !== row.country ? row.city : ''].filter(Boolean).join('・');
      return `<article class="product-card">
        ${affiliate ? `<a class="product-image" href="${esc(affiliate)}" target="_blank" rel="sponsored noopener" tabindex="-1" aria-hidden="true">${img}</a>` : `<div class="product-image">${img}</div>`}
        <div class="product-body">
          <div class="product-kicker"><span>${esc(destination)}</span><span>${esc(row.category)}</span></div>
          <h3>${esc(row.title)}</h3><div class="product-rating">${rating}</div>
          <div class="product-bottom"><div class="product-price"><small>Klook 目錄參考價起</small><strong>${model.money(row.price_twd)}</strong></div>
            ${affiliate ? `<a class="product-link" href="${esc(affiliate)}" target="_blank" rel="sponsored noopener" aria-label="探索 ${esc(row.title)} 的商品方案">探索體驗 <span aria-hidden="true">↗</span></a>` : ''}
          </div>
        </div>
      </article>`;
    }).join('');
    if (focusIndex >= 0) {
      const link = grid.querySelectorAll('.product-link')[focusIndex];
      if (link) link.focus({ preventScroll: true });
    }
  }

  function bindFilters() {
    $$('[data-deal-region]').forEach(button => button.addEventListener('click', () => {
      state.dealRegion = button.dataset.dealRegion;
      $$('[data-deal-region]').forEach(item => { item.classList.toggle('is-active', item === button); item.setAttribute('aria-pressed', String(item === button)); });
      renderDeals();
    }));
    $$('[data-product-region]').forEach(button => button.addEventListener('click', () => {
      state.productRegion = button.dataset.productRegion;
      state.visible = 6;
      $$('[data-product-region]').forEach(item => { item.classList.toggle('is-active', item === button); item.setAttribute('aria-pressed', String(item === button)); });
      renderProducts();
    }));
    $('#product-search').addEventListener('input', event => { state.query = event.target.value; state.visible = 6; renderProducts(); });
    $('#show-more').addEventListener('click', () => { const previous = state.visible; state.visible += 6; renderProducts(previous); });
    document.addEventListener('click', event => { if (event.target.closest('[data-retry]')) loadData(); });
  }

  async function loadData() {
    $('#deal-grid').setAttribute('aria-busy', 'true');
    $('#product-grid').setAttribute('aria-busy', 'true');
    $('#radar-status').textContent = '正在整理機票…';
    $('#product-count').textContent = '正在整理目的地…';
    const [deals, products, status] = await Promise.allSettled([getRows('機票優惠'), getRows('旅遊商品'), getRows('系統狀態')]);
    state.dealsError = deals.status !== 'fulfilled';
    state.productsError = products.status !== 'fulfilled';
    state.deals = state.dealsError ? [] : deals.value;
    state.products = state.productsError ? [] : products.value;
    const lastImport = status.status === 'fulfilled' ? status.value.find(row => row.key === 'last_klook_catalog_import') : null;
    $('#radar-note').textContent = lastImport ? '商品更新 ' + model.localDate(lastImport.value, false) : '';
    renderDeals();
    renderProducts();
  }
  bindFilters();
  loadData();
})();
