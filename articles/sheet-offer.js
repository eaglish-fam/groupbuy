// Shared Sheet-driven purchase controls for product articles.
// <script defer src="/articles/sheet-offer.js" data-catalog-key="<key>"></script> plus, in the page,
// one <a data-sheet-offer href="/#catalog"> (closing button, also the floating one) and optionally
// one <a data-sheet-early href="/#catalog"> near the top. Both keep their crawlable /#catalog
// fallback until the single matching Sheet row is open; then they point at that row's link.
// data-open-label on a link sets its text while open; the page's own text is restored otherwise.
(() => {
  const script = document.currentScript;
  const key = script?.dataset.catalogKey;
  const sheetUrl = 'https://docs.google.com/spreadsheets/d/1-RuyD9eCkrDpgFFXGHRWaTF-LYKaDK-MxAw3uNMozeU/gviz/tq?tqx=out:csv&headers=1&sheet=' + encodeURIComponent('現正開團');
  function start() {
    const offer = document.querySelector('[data-sheet-offer]');
    const early = document.querySelector('[data-sheet-early]');
    const item = key && window.ProductContent?.catalog?.[key];
    if (!offer || !item) { if (offer) console.warn('Sheet offer: unknown catalog key', key); return; }
    const status = document.createElement('p');
    status.className = 'offer-status'; status.setAttribute('role', 'status'); status.setAttribute('data-editorial-exclude', '');
    offer.after(status);
    const floating = window.ArticleFloatingOffer?.mount(offer, {available: false});
    const links = [offer, early].filter(Boolean).map(link => ({link, href: link.getAttribute('href'), text: link.textContent}));
    let busy = false;
    function set(open, destination, retry) {
      for (const {link, href, text} of links) {
        link.setAttribute('href', open ? destination : href);
        if (open) { link.target = '_blank'; link.rel = 'noopener noreferrer'; } else { link.removeAttribute('target'); link.removeAttribute('rel'); }
        link.textContent = open ? (link.dataset.openLabel || text) : retry ? '重新確認團購狀態' : text;
        if (retry) link.setAttribute('aria-disabled', 'true'); else link.removeAttribute('aria-disabled');
        delete link.dataset.lineNotify; delete link.dataset.lineProduct; link.classList.remove('is-line-notify');
      }
      floating?.setAvailable(open);
    }
    // 結團或還沒開團：購買鈕改成「開團通知我・加入 LINE」，浮動鈕照樣出現（Hiram 2026-11-25：結團就導 LINE）。
    function notify(state) {
      const label = state === 'upcoming' ? '開團提醒我・LINE ↗' : '開團通知我・LINE ↗';
      for (const {link} of links) {
        link.setAttribute('href', ProductContent.LINE_COMMUNITY); link.target = '_blank'; link.rel = 'noopener noreferrer';
        link.textContent = label; link.removeAttribute('aria-disabled');
        link.dataset.lineNotify = 'article_offer'; link.dataset.lineProduct = item.brands[0]; link.classList.add('is-line-notify');
      }
      floating?.setAvailable(true);
    }
    async function refresh() {
      if (busy) return; busy = true;
      try {
        const response = await fetch(sheetUrl + '&_=' + Date.now(), {cache: 'no-store', signal: AbortSignal.timeout(12000)});
        if (!response.ok) throw Error('Sheet unavailable');
        const csv = await response.text(); if (/^\s*</.test(csv)) throw Error('Unexpected response');
        const parsed = Papa.parse(csv, {header: false, skipEmptyLines: true}); if (parsed.errors.length) throw Error('Invalid CSV');
        const campaign = ProductContent.campaignFor(ProductContent.sheetRows(parsed.data), key);
        ProductContent.mountKeyFacts?.(key, campaign, campaign.state === 'open' ? {buy: {href: ProductContent.withUTM(campaign.url, item.brands[0])}} : {});
        if (campaign.state !== 'open') {
          if ((campaign.state === 'closed' || campaign.state === 'upcoming') && ProductContent.LINE_COMMUNITY) { notify(campaign.state); status.textContent = campaign.state === 'upcoming' ? '這一檔還沒開團；加入 LINE 社群，開團當天會通知你。' : '這一檔已結團；加入 LINE 社群，下次開團、補貨會第一時間通知你。'; return; }
          set(false); status.textContent = '目前沒有開放中的團購；文章仍可繼續閱讀，下次開團時這裡會出現購買入口。'; return;
        }
        set(true, ProductContent.withUTM(campaign.url, item.brands[0]));
        const end = campaign.end ? campaign.end.replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$1/$2/$3') : '';
        status.textContent = end ? `本期團購至 ${end} 23:59。` : '這一檔正在開團。';
      } catch (error) { set(false, '', true); status.textContent = '目前暫時讀取不到團購資料，點上方按鈕重新確認。'; console.warn('Sheet offer unavailable:', error.message); }
      finally { busy = false; }
    }
    for (const {link} of links) link.addEventListener('click', event => { if (link.getAttribute('aria-disabled') === 'true') { event.preventDefault(); refresh(); } });
    window.addEventListener('focus', refresh); document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
    refresh(); setInterval(() => { if (!document.hidden) refresh(); }, 300000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
