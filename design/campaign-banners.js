/* 品牌限時活動 banner（網站端，不寫 Sheet）。
   每筆活動都要有 Hiram 的原始交辦出處；到 endsAt 之後自動不顯示，不需要再部署一次。
   只寫交辦的原文內容：不擴大成全館折扣、不寫疊加或價格。商品卡、折扣碼、連結仍以 Sheet 為準。 */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.CampaignBanners = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const campaigns = [
    {
      id: "insta360-luna-20261113",
      brandPrefix: "Insta360",
      code: "INRAEZ8",
      endsAt: "2026-11-13T23:59:59+08:00",
      title: "Insta360 Luna 系列限時活動",
      period: "即日起至 11/13（五）23:59（台北時間）",
      lines: ["Luna Ultra 創作者套裝 85 折起", "Care／FlexiCare 8 折", "雲端儲存 9 折"],
      gift: "活動期間用折扣碼 INRAEZ8 購買 Luna Ultra 創作者套裝，另送迷你磁吸補光燈，總量 30 份，送完為止。",
      url: "https://store.insta360.com/product/luna-series?utm_source=AffiliateCenter&utm_medium=copylink&utm_term=INRAEZ8",
      linkLabel: "前往 Luna 系列活動頁",
      note: "優惠內容、價格與贈品以 Insta360 官網活動頁為準。",
      source: "Hiram 2026-11-08 11:57（台北）Bingo 對話；Kingdom PR #1 留言 6716976149",
    },
  ];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  function active(now = Date.now()) {
    return campaigns.filter((c) => now <= Date.parse(c.endsAt));
  }
  function forBrand(brand, now) {
    const b = String(brand || "").trim();
    return active(now).find((c) => b.startsWith(c.brandPrefix)) || null;
  }
  function markup(c, compact = false) {
    return `<div class="campaign-banner${compact ? " compact" : ""}" data-campaign="${esc(c.id)}">` +
      `<p class="campaign-title">${esc(c.title)}</p><p class="campaign-period">${esc(c.period)}</p>` +
      (compact ? "" : `<ul>${c.lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>`) +
      `<p class="campaign-gift">${esc(compact ? "用碼 " + c.code + " 買 Luna Ultra 創作者套裝送迷你磁吸補光燈（總量 30 份）" : c.gift)}</p>` +
      (compact ? "" : `<p class="campaign-code">折扣碼 <code>${esc(c.code)}</code> <button type="button" data-copy-code="${esc(c.code)}">複製折扣碼</button></p>`) +
      `<a class="campaign-link" href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">${esc(c.linkLabel)} ↗</a>` +
      (compact ? "" : `<p class="campaign-note">${esc(c.note)}</p>`) +
      `</div>`;
  }
  function decorateCards(scope) {
    for (const card of scope.querySelectorAll(".product-card[data-product-key]")) {
      if (card.querySelector(".campaign-banner")) continue;
      const c = forBrand(card.dataset.productKey.split("|")[0]);
      const body = card.querySelector(".product-bottom");
      if (c && body) body.insertAdjacentHTML("afterbegin", markup(c, true));
    }
  }
  if (typeof document !== "undefined" && typeof window !== "undefined") {
    window.addEventListener("product-detail-ready", (event) => {
      const c = forBrand(event.detail?.brand);
      const title = document.querySelector("#detail .detail-copy h2");
      if (c && title && !document.querySelector("#detail .campaign-banner")) title.insertAdjacentHTML("afterend", markup(c));
    });
    const start = () => {
      decorateCards(document);
      new MutationObserver(() => decorateCards(document)).observe(document.body, { childList: true, subtree: true });
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
    else start();
  }
  return { campaigns, active, forBrand, markup };
});
