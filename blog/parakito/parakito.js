(() => {
  const sheetUrl = 'https://docs.google.com/spreadsheets/d/1-RuyD9eCkrDpgFFXGHRWaTF-LYKaDK-MxAw3uNMozeU/gviz/tq?tqx=out:csv&headers=1&sheet=' + encodeURIComponent('現正開團');
  const offer = document.querySelector('[data-parakito-offer]');
  const early = document.querySelector('[data-parakito-early]');
  const status = document.querySelector('#offer-status');
  const floating = ArticleFloatingOffer.mount(offer, {available:false});
  let busy = false;
  function unavailable(label, message) {
    offer.removeAttribute('href'); offer.removeAttribute('target'); offer.setAttribute('aria-disabled','true'); offer.textContent = label;
    early?.removeAttribute('href'); early?.removeAttribute('target'); early?.setAttribute('aria-disabled','true'); early.textContent = '重新讀取本期配方與組合';
    status.textContent = message; floating.setAvailable(false);
  }
  async function refresh() {
    if (busy) return; busy = true;
    try {
      const response = await fetch(sheetUrl + '&_=' + Date.now(), {cache:'no-store', signal:AbortSignal.timeout(12000)});
      if (!response.ok) throw Error('Sheet unavailable');
      const csv = await response.text(); if (/^\s*</.test(csv)) throw Error('Unexpected response');
      const parsed = Papa.parse(csv,{header:false,skipEmptyLines:true}); if(parsed.errors.length) throw Error('Invalid CSV');
      const campaign = ProductContent.campaignFor(ProductContent.sheetRows(parsed.data),'parakito');
      if (campaign.state !== 'open') { unavailable(campaign.label, '本期購買入口目前未開放；文章仍可繼續閱讀。'); return; }
      const destination = ProductContent.withUTM(campaign.url, ProductContent.catalog.parakito.brands[0]);
      offer.href = destination; offer.target = '_blank'; offer.rel = 'noopener noreferrer'; offer.removeAttribute('aria-disabled'); offer.textContent = '選購 Para’Kito 防蚊用品';
      if (early) { early.href = destination; early.target = '_blank'; early.rel = 'noopener noreferrer'; early.removeAttribute('aria-disabled'); early.textContent = '查看本期配方與組合 ↗'; }
      status.textContent = '本期團購至 2026/10/21 23:59；款式、庫存與結帳金額請在賣場確認。'; floating.setAvailable(true);
    } catch (error) { unavailable('重新確認團購狀態', '目前暫時讀取不到團購資料，點此重新整理。'); console.warn('ParaKito offer unavailable:', error.message); }
    finally { busy = false; }
  }
  offer.addEventListener('click', event => { if (offer.getAttribute('aria-disabled') === 'true') { event.preventDefault(); refresh(); } });
  early?.addEventListener('click', event => { if (early.getAttribute('aria-disabled') === 'true') { event.preventDefault(); refresh(); } });
  window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  refresh(); setInterval(() => { if (!document.hidden) refresh(); }, 300000);
})();
