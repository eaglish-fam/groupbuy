(() => {
  const sheetUrl = 'https://docs.google.com/spreadsheets/d/1-RuyD9eCkrDpgFFXGHRWaTF-LYKaDK-MxAw3uNMozeU/gviz/tq?tqx=out:csv&headers=1&sheet=' + encodeURIComponent('現正開團');
  const offer = document.querySelector('[data-blackmores-offer]');
  const early = document.querySelector('[data-blackmores-early]');
  if (!offer) return;
  // The status line is created here so the reviewed article text stays untouched.
  const status = document.createElement('p');
  status.className = 'offer-status'; status.setAttribute('role', 'status'); status.setAttribute('data-editorial-exclude', '');
  offer.after(status);
  const floating = ArticleFloatingOffer.mount(offer, {available:false});
  const fallback = {offer:{href:offer.getAttribute('href'), text:offer.textContent}, early:early && {href:early.getAttribute('href'), text:early.textContent}};
  let busy = false;
  function show(link, href, label, open) {
    if (!link) return;
    link.setAttribute('href', href); link.removeAttribute('aria-disabled');
    if (open) { link.target = '_blank'; link.rel = 'noopener noreferrer'; } else { link.removeAttribute('target'); link.removeAttribute('rel'); }
    link.textContent = label;
  }
  function unavailable(message, retry) {
    // Closed or unreadable: keep the crawlable catalog link so readers still land somewhere useful.
    show(offer, fallback.offer.href, retry ? '重新確認團購狀態' : fallback.offer.text, false);
    show(early, fallback.early?.href, retry ? '重新確認團購狀態' : fallback.early?.text, false);
    if (retry) { offer.setAttribute('aria-disabled', 'true'); early?.setAttribute('aria-disabled', 'true'); }
    status.textContent = message; floating.setAvailable(false);
  }
  async function refresh() {
    if (busy) return; busy = true;
    try {
      const response = await fetch(sheetUrl + '&_=' + Date.now(), {cache:'no-store', signal:AbortSignal.timeout(12000)});
      if (!response.ok) throw Error('Sheet unavailable');
      const csv = await response.text(); if (/^\s*</.test(csv)) throw Error('Unexpected response');
      const parsed = Papa.parse(csv, {header:false, skipEmptyLines:true}); if (parsed.errors.length) throw Error('Invalid CSV');
      const campaign = ProductContent.campaignFor(ProductContent.sheetRows(parsed.data), 'blackmores');
      if (campaign.state !== 'open') { unavailable('目前沒有開放中的澳佳寶團購；文章仍可繼續閱讀，下次開團時這裡會出現購買入口。', false); return; }
      const destination = ProductContent.withUTM(campaign.url, ProductContent.catalog.blackmores.brands[0]);
      show(offer, destination, '選購澳佳寶保健食品 ↗', true);
      show(early, destination, '查看本期澳佳寶組合 ↗', true);
      const end = campaign.end ? campaign.end.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1/$2/$3') : '';
      status.textContent = (end ? `本期團購至 ${end} 23:59；` : '') + '組合、庫存與結帳金額請在賣場確認。';
      floating.setAvailable(true);
    } catch (error) { unavailable('目前暫時讀取不到團購資料，點上方按鈕重新確認。', true); console.warn('Blackmores offer unavailable:', error.message); }
    finally { busy = false; }
  }
  for (const link of [offer, early]) link?.addEventListener('click', event => { if (link.getAttribute('aria-disabled') === 'true') { event.preventDefault(); refresh(); } });
  window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  refresh(); setInterval(() => { if (!document.hidden) refresh(); }, 300000);
})();
