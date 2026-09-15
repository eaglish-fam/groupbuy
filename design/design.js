"use strict";
const $ = (s) => document.querySelector(s),
  esc = (s) => ProductContent.escape(s),
  safe = (s) => ProductContent.safeUrl(s);
const sheet = "1-RuyD9eCkrDpgFFXGHRWaTF-LYKaDK-MxAw3uNMozeU";
const PAGE_SIZE = 12;
const catalogueFallback = document.querySelector('[data-snapshot-card]') ? $("#products").innerHTML : "";
const SAVED_KEY = ["www.eaglish.store", "eaglish.store"].includes(location.hostname) ? "eaglish-saved-v2" : "eaglish-design-saved-v2";
let loadingPromise = null, refreshedAt = 0, verifiedDay = "", buying = false;
const track = (name, data = {}) => window.SiteAnalytics?.track(name, data);
let products = [],
  currentStatus = "all",
  category = "",
  country = "",
  query = "",
  limit = PAGE_SIZE,
  loaded = false,
  toastTimer;
let saved = new Set();
try {
  saved = new Set(
    JSON.parse(localStorage.getItem(SAVED_KEY) || "[]"),
  );
} catch {}
const bookmark =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 3h12v18l-6-4-6 4z"/></svg>';
function resourceKind(type) {
  if (/書籍|書|book/i.test(type)) return "book";
  if (/教育|公益|edu|charity/i.test(type)) return "edu";
  if (/折扣|coupon|affiliate/i.test(type)) return "coupon";
  return "";
}
function channels(text) {
  return String(text || "")
    .split(/\r?\n/)
    .flatMap((line) => {
      const match = line.trim().match(/^(.*?)\s*[=＝:：]\s*(https?:\/\/\S+)$/);
      const url = safe(match ? match[2] : line.trim());
      return url ? [{ name: match?.[1] || new URL(url).hostname, url }] : [];
    });
}
function linkedText(text) {
  return String(text || "")
    .split(/(https?:\/\/[^\s<>]+)/g)
    .map((part) =>
      safe(part)
        ? `<a href="${esc(safe(part))}" target="_blank" rel="noopener noreferrer">${esc(part)}</a>`
        : esc(part),
    )
    .join("");
}
function imageUrl(value) {
  const u = safe(value);
  if (!u) return "";
  if (u.includes("drive.google.com")) {
    const match = u.match(/\/d\/([^/?]+)/) || u.match(/[?&]id=([^&]+)/);
    return match ? `https://lh3.googleusercontent.com/d/${match[1]}=w1000` : u;
  }
  return u;
}
function classify(r) {
  const type = r["類型"] || "",
    now = ProductContent.today(),
    start = ProductContent.date(r["開團日期"]),
    end = ProductContent.date(r["結束日期"]);
  const long = /長期|long/i.test(type);
  if (/結團|closed|ended/.test(type))
    return { key: "closed", label: "本次已結團", long };
  if (
    (r["開團日期"] && !start) ||
    (r["結束日期"] && !end) ||
    (start && end && start > end)
  )
    return { key: "unknown", label: "檔期待確認", long };
  if (end && now > end)
    return {
      key: "closed",
      label: long ? "當期連結待更新" : "本次已結團",
      long,
    };
  if ((start && now < start) || /即將|upcoming/i.test(type))
    return { key: "upcoming", label: "即將開團", long };
  if (!safe(r["連結"]))
    return { key: "unknown", label: "購買入口待確認", long };
  if (r["庫存狀態"] === "售完")
    return { key: "closed", label: "目前已售完", long };
  if (!end && !long && !/折扣|公益|教育|書/.test(type))
    return { key: "unknown", label: "檔期待確認", long };
  return { key: "open", label: long ? "常駐開團" : "限時開團", long };
}
function normalize(rows, upcoming = false) {
  return rows
    .filter(
      (r) => r["品牌"]?.trim() && !/^(\/\/|---|===)/.test(r["品牌"].trim()),
    )
    .map((r) => {
      if (upcoming) r = { ...r, 類型: "即將開團" };
      const brand = r["品牌"].trim();
      const urls = [
        ProductContent.entry(brand)?.cardImage || "",
        imageUrl(r["圖片網址"] || r.image),
        ...String(r["附加圖片"] || "")
          .split(/[\r\n,，]+/)
          .map(imageUrl),
      ].filter(Boolean);
      return {
        brand,
        key: String(r["商品ID"] || r["ProductID"] || [brand, r["商品描述"] || "", imageUrl(r["圖片網址"] || r.image) || urls[0] || ""].join("|")),
        source: r,
        description: r["商品描述"] || "",
        url: safe(r["連結"]),
        images: [...new Set(urls)],
        category: r["分類"] || "其他",
        country: r["國家"] || "",
        start: ProductContent.date(r["開團日期"]),
        end: ProductContent.date(r["結束日期"]),
        status: classify(r),
        note: r["備註"] || "",
        details: r["方案詳情"] || "",
        qa: r.QA || "",
        contacts: r["客服"] || "",
        coupon: r["折扣碼"] || "",
        videos: ProductContent.fromRow(r),
        article: ProductContent.entry(brand),
        blogUrl: safe(r["網誌網址"]),
        googleDoc: safe(r["Google文件"]),
        featured: !!r["主推"],
        type: r["類型"] || "",
        kind: resourceKind(r["類型"] || ""),
        retailers: channels(r["通路"]),
        warranty: safe(r["官網保固"] || r["官網"]),
      };
    });
}
function notify(message) {
  $("#toast").textContent = message;
  $("#toast").classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 2200);
}
function updateSaved() {
  try {
    localStorage.setItem(SAVED_KEY, JSON.stringify([...saved]));
  } catch {}
  $("#saved-count").textContent = saved.size;
}
// Sheet dates are Taiwan calendar days, inclusive through the end of that day.
function countdownText(end, now = Date.now()) {
  const remaining = Date.parse(end + "T00:00:00+08:00") + 86400000 - now;
  if (!Number.isFinite(remaining) || remaining <= 0) return "本次已結團";
  const minutes = Math.ceil(remaining / 60000);
  if (minutes >= 1440) return `距結團 ${Math.floor(minutes / 1440)} 天 ${Math.floor(minutes % 1440 / 60)} 小時`;
  return `最後 ${Math.floor(minutes / 60)} 小時 ${minutes % 60} 分`;
}
function timedCampaign(p) {
  return !p.kind && p.status.key === "open" && !p.status.long && !!p.end;
}
function countdownMarkup(p) {
  return timedCampaign(p) ? `<span class="closing-countdown${isClosingSoon(p.end) ? " is-urgent" : ""}" data-closing-date="${esc(p.end)}">${countdownText(p.end)}</span>` : "";
}
function isClosingSoon(end, now = Date.now()) {
  const remaining = Date.parse(end + "T00:00:00+08:00") + 86400000 - now;
  return remaining > 0 && remaining <= 3 * 86400000;
}
let todayClosingSignature = "";
function updateTodayClosing() {
  const region = $("#today-closing");
  if (!region) return;
  const today = ProductContent.today();
  const closing = products.filter(p => timedCampaign(p) && p.end === today);
  region.hidden = closing.length === 0;
  const signature = JSON.stringify(closing.map(p => [p.key, products.indexOf(p)]));
  if (signature !== todayClosingSignature) {
    $("#today-closing-products").innerHTML = closing.map(p => `<button data-detail="${products.indexOf(p)}">${esc(p.brand)} <span aria-hidden="true">↗</span></button>`).join("");
    todayClosingSignature = signature;
  }
  if (!closing.length) return;
  const seconds = Math.max(0, Math.ceil((Date.parse(today + "T00:00:00+08:00") + 86400000 - Date.now()) / 1000));
  const h = Math.floor(seconds / 3600), m = Math.floor(seconds % 3600 / 60), s = seconds % 60;
  const clock = $("#today-closing-clock");
  clock.textContent = [h, m, s].map(n => String(n).padStart(2, "0")).join(" : ");
  clock.dateTime = `PT${h}H${m}M${s}S`;
}
function updateCountdowns() {
  if (document.hidden) return;
  const expired = products.some(p => timedCampaign(p) && ProductContent.today() > p.end);
  if (expired) {
    products.forEach(p => { if (timedCampaign(p) && ProductContent.today() > p.end) p.status = classify(p.source); });
    render();
    if ($("#product-dialog").open && $("#detail [data-closing-date]")?.dataset.closingDate < ProductContent.today()) {
      $("#detail [data-buy-key]")?.remove();
      const label = $("#detail .status.timed");
      if (label) { label.textContent = "請重新查看當期團購"; label.classList.remove("timed"); }
    }
  }
  document.querySelectorAll("[data-closing-date]").forEach(el => {
    const text = countdownText(el.dataset.closingDate);
    if (el.textContent !== text) el.textContent = text;
    el.classList.toggle("is-urgent", isClosingSoon(el.dataset.closingDate));
  });
  updateTodayClosing();
}
function card(p) {
  const idx = products.indexOf(p);
  const label =
    p.kind === "book"
      ? "康先生的書"
      : p.kind === "edu"
        ? "教育・公益"
        : p.kind === "coupon" && p.status.key === "open"
          ? "折扣優惠"
          : p.status.label;
  const cta =
    p.kind === "edu"
      ? "查看資源"
      : p.kind === "book"
        ? "前往購書"
        : p.kind === "coupon"
          ? "前往優惠"
          : "前往團購";
  const retailerLinks = p.retailers
    .map(
      (r) =>
        `<a class="retailer-link" href="${esc(ProductContent.withUTM(r.url, p.brand))}" target="_blank" rel="noopener noreferrer" data-outbound-product-id="${esc(p.key)}" data-outbound-product-name="${esc(p.brand)}" data-outbound-group-type="book" data-outbound-source-surface="homepage_product_card" data-outbound-campaign-key="book" data-outbound-retailer="${esc(r.name)}" data-outbound-legacy-event="click_book">${esc(r.name)}</a>`,
    )
    .join("");
  return `<article class="product-card" ${p.article ? `id="product-${esc(p.article.id)}"` : ""} data-product-key="${esc(p.key)}">
    <div class="product-picture"><button class="image-open" data-detail="${idx}" aria-label="查看 ${esc(p.brand)} 詳情">${p.images[0] ? `<img src="${esc(p.images[0])}" alt="${esc(p.brand)}" loading="lazy" width="1000" height="750">` : "<span>商品資訊</span>"}</button><button class="save" data-save="${idx}" aria-label="收藏 ${esc(p.brand)}" aria-pressed="${saved.has(p.key)}">${bookmark}</button></div>
    <div class="product-body"><div class="product-meta"><span class="status ${p.status.key}${timedCampaign(p) ? " timed" : ""}">${label}</span><span>${esc(p.category.split(/[,，]/)[0])}${p.country ? " / " + esc(p.country) : ""}</span></div>
    <h3><button data-detail="${idx}" style="font:inherit;text-align:left;padding:0">${esc(p.brand)}</button></h3><p class="product-description">${esc(p.description)}</p>
    <div class="product-bottom">${timedCampaign(p) ? `<p class="date-line">${countdownMarkup(p)}</p>` : ""}
    ${p.coupon && p.status.key === "open" ? `<div class="coupon-inline"><small>專屬折扣碼</small><code>${esc(p.coupon)}</code><button data-copy-code="${esc(p.coupon)}">複製折扣碼</button></div>` : ""}
    ${p.kind === "book" && retailerLinks ? `<div class="retailer-links">${retailerLinks}</div>` : `<div class="card-actions"><button class="button secondary" data-detail="${idx}">商品詳情</button></div>`}
    ${p.article ? `<a class="card-reading" href="${p.article.article}">先讀生活筆記<span aria-hidden="true">↗</span></a>` : ""}
    ${p.videos.length ? `<button class="card-reading card-video" data-detail="${idx}">觀看使用影片</button>` : ""}
    ${!p.kind && (p.end || p.start) && p.status.key !== "closed" ? `<button class="card-calendar" data-calendar-product="${idx}">加入行事曆</button>` : ""}
    ${p.kind === "book" && retailerLinks ? "" : `<div class="card-primary-action">${p.status.key === "open" ? `<a class="button primary" href="${esc(p.url)}" data-buy-key="${esc(p.key)}" target="_blank" rel="noopener noreferrer">${cta}</a>` : `<button class="button secondary" data-save="${idx}">${saved.has(p.key) ? "已收藏 ✓" : "先收藏"}</button>`}</div>`}
    </div></div></article>`;
}
function render() {
  if (!refreshedAt && document.querySelector('[data-snapshot-card]')) return;
  updateTodayClosing();
  let list = products.filter(
    (p) =>
      (!country || p.country === country) &&
      (!category ||
        p.category
          .split(/[,，]/)
          .map((s) => s.trim())
          .includes(category)) &&
      (!query ||
        (p.brand + " " + p.description + " " + p.category)
          .toLowerCase()
          .includes(query)) &&
      (currentStatus === "all" || currentStatus === "saved"
        ? currentStatus === "all" ? !p.kind && p.status.key === "open" : saved.has(p.key)
        : currentStatus === "long"
          ? !p.kind && p.status.long && p.status.key === "open"
          : p.status.key === currentStatus && !p.kind && (currentStatus !== "open" || !p.status.long)),
  );
  const order = $("#sort").value;
  list = sortCatalog(list, currentStatus, order);
  $("#result-count").textContent =
    `${list.length} 件選物${category ? "・" + category : ""}`;
  $("#products").innerHTML = list.length
    ? list.slice(0, limit).map(card).join("")
    : `<div class="loading">${currentStatus === "saved" ? "還沒有符合條件的收藏。點商品右上角的書籤，就能留在這裡。" : currentStatus === "upcoming" && !query && !category ? "目前沒有已公布的即將開團商品。先逛逛開團中的好物吧。" : "沒有符合條件的商品，試試其他關鍵字或分類。"}<br><button class="text-link" id="reset-filters">查看全部開團商品</button></div>`;
  $("#products").setAttribute("aria-busy", "false");
  $("#load-more").hidden = list.length <= limit;
  const remaining = Math.max(0, list.length - limit);
  $("#load-more").textContent =
    `再看 ${Math.min(PAGE_SIZE, remaining)} 件好物 ＋`;
  $("#show-all-products").hidden = remaining === 0;
  $("#show-all-products").textContent = `一次看全部 ${list.length} 件`;
  $("#browse-progress").textContent = list.length
    ? `已展示 ${Math.min(limit, list.length)}／${list.length} 件${remaining ? `，還有 ${remaining} 件等你逛` : "，已全部展示"}`
    : "";
  document.querySelectorAll("[data-category]").forEach((b) => {
    b.setAttribute("aria-pressed", String(b.dataset.category === category));
  });
  document
    .querySelectorAll("[data-status]")
    .forEach((b) =>
      b.setAttribute(
        "aria-pressed",
        b.dataset.status === currentStatus ? "true" : "false",
      ),
    );
  window.dispatchEvent(new Event("catalog-rendered"));
}
// Filter first, order the full result, then paginate. Never mutate Sheet order.
function sortCatalog(list, status, order) {
  const closing = (a, b) => (a.end || "9999").localeCompare(b.end || "9999");
  if (order === "closing") return [...list].sort(closing);
  if (order === "new") return [...list].sort((a, b) => (b.start || "").localeCompare(a.start || ""));
  if (status === "open") return [...list].sort(closing);
  if (status === "long") return [...list];
  if (status === "all") {
    const timed = list.filter(p => !p.status.long).sort(closing);
    const evergreen = list.filter(p => p.status.long);
    const mixed = [];
    for (let i = 0; i < Math.max(timed.length, evergreen.length); i++) {
      if (timed[i]) mixed.push(timed[i]);
      if (evergreen[i]) mixed.push(evergreen[i]);
    }
    return mixed;
  }
  return [...list].sort((a, b) =>
    ({ open: 0, upcoming: 1, unknown: 2, closed: 3 }[a.status.key] -
     { open: 0, upcoming: 1, unknown: 2, closed: 3 }[b.status.key]) || Number(b.featured) - Number(a.featured));
}
function setStatus(value) {
  currentStatus = value;
  $("#sort").value = value === "open" ? "closing" : "recommended";
  limit = PAGE_SIZE;
  render();
}
function showSaved() {
  category = "";
  country = "";
  if ($("#country")) $("#country").value = "";
  $("#category").value = "";
  query = "";
  $("#search").value = "";
  setStatus("saved");
  $("#catalog").scrollIntoView();
}
function openDetail(index, refreshing = false) {
  const p = products[index];
  if (!p) return;
  if (!refreshing) track("open_details_modal", { group_name: p.brand, event_category: "engagement" });
  $("#product-dialog").dataset.productKey = p.key;
  const photo = p.images.length
    ? `<div class="detail-photo"><img id="detail-image" src="${esc(p.images[0])}" alt="${esc(p.brand)}"><div class="gallery-controls" ${p.images.length < 2 ? "hidden" : ""}><button id="photo-prev" aria-label="上一張商品圖片">←</button><span id="photo-count">1 / ${p.images.length}</span><button id="photo-next" aria-label="下一張商品圖片">→</button></div></div>`
    : "";
  $("#detail").innerHTML =
    `<div class="detail-layout">${photo}<div class="detail-copy"><span class="status ${p.status.key}${timedCampaign(p) ? " timed" : ""}">${p.status.label}</span><h2 id="detail-title">${esc(p.brand)}</h2><p>${esc(p.description)}</p>${timedCampaign(p) ? `<p class="date-line">${countdownMarkup(p)}</p>` : ""}${p.coupon && p.status.key === "open" ? `<p>折扣碼：<strong>${esc(p.coupon)}</strong> <button class="text-link" id="copy-coupon">複製</button></p>` : ""}${p.status.key === "open" ? `<a class="button primary" href="${esc(p.url)}" data-buy-key="${esc(p.key)}" target="_blank" rel="noopener noreferrer">前往廠商賣場選購 ↗</a>` : "<p>目前暫不提供訂購入口。</p>"}${p.article ? `<p><a class="text-link" href="${p.article.article}">閱讀完整生活筆記 ↗</a></p>` : ""}<p class="small">商品、配送與售後由廠商提供，詳情以當期賣場為準。</p></div></div><div class="detail-sections">${[
      ["貼心說明", p.note],
      ["方案詳情", p.details],
      ["常見問題", p.qa],
      ["客服與售後", p.contacts],
    ]
      .filter((x) => x[1])
      .map(
        ([name, content]) =>
          `<details ${name === "貼心說明" ? "open" : ""}><summary>${name}</summary><p>${linkedText(content)}</p></details>`,
      )
      .join(
        "",
      )}${p.videos.length ? '<details open><summary>使用影片</summary><div id="detail-videos"></div></details>' : ""}${
      p.blogUrl || p.googleDoc
        ? `<details><summary>延伸閱讀與介紹</summary>${[p.blogUrl, p.googleDoc]
            .filter(Boolean)
            .map(
              (u, i) =>
                `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${i === 0 ? "閱讀商品介紹" : "查看補充資料"} ↗</a>`,
            )
            .join("")}</details>`
        : ""
    }</div>`;
  let frame = 0;
  function change(n) {
    frame = (frame + n + p.images.length) % p.images.length;
    $("#detail-image").src = p.images[frame];
    $("#photo-count").textContent = `${frame + 1} / ${p.images.length}`;
  }
  if (p.images.length > 1) {
    $("#photo-prev").onclick = () => change(-1);
    $("#photo-next").onclick = () => change(1);
  }
  if (p.videos.length)
    ProductContent.mountVideos($("#detail-videos"), p.videos);
  if (p.coupon && p.status.key === "open")
    $("#copy-coupon").onclick = async () => {
      try {
        await navigator.clipboard.writeText(p.coupon);
        notify("折扣碼已複製");
        track("copy_coupon", { group_name: p.brand, coupon_code: p.coupon });
      } catch {
        notify("請長按選取折扣碼複製");
      }
    };
  $("#product-dialog").showModal();
  window.dispatchEvent(new CustomEvent("product-detail-ready", { detail: p }));
}
document.addEventListener("click", (e) => {
  const detail = e.target.closest("[data-detail]"),
    save = e.target.closest("[data-save]"),
    status = e.target.closest("[data-status]"),
    cat = e.target.closest("[data-category]");
  if (detail) openDetail(Number(detail.dataset.detail));
  if (save) {
    const p = products[Number(save.dataset.save)];
    if (saved.has(p.key)) {
      track("wishlist_remove", { group_name: p.brand });
      saved.delete(p.key);
      notify("已移出收藏");
    } else {
      track("wishlist_add", { group_name: p.brand });
      saved.add(p.key);
      notify("已加入收藏，留著慢慢選");
    }
    updateSaved();
    render();
  }
  if (status) setStatus(status.dataset.status);
  if (cat) {
    category = cat.dataset.category;
    // Scenario shortcuts start a fresh browse, not a hidden combination of old filters.
    country = query = "";
    $("#country").value = "";
    $("#search").value = "";
    $("#category").value = category;
    currentStatus = "all";
    $("#sort").value = "recommended";
    limit = PAGE_SIZE;
    render();
    $("#catalog").scrollIntoView();
  }
  if (e.target.closest("#reset-filters")) {
    category = "";
    country = "";
    if ($("#country")) $("#country").value = "";
    query = "";
    $("#category").value = "";
    $("#search").value = "";
    setStatus("all");
  }
});
$("#search").addEventListener("input", (e) => {
  query = e.target.value.trim().toLowerCase();
  limit = PAGE_SIZE;
  render();
});
$("#category").onchange = (e) => {
  category = e.target.value;
  limit = PAGE_SIZE;
  render();
};
$("#sort").onchange = () => render();
$("#load-more").onclick = () => {
  limit += PAGE_SIZE;
  render();
};
$("#show-all-products").onclick = () => {
  limit = products.length;
  render();
};
$("#saved-open").onclick = showSaved;
$("#mobile-saved").onclick = showSaved;
$("#search-open").onclick = () => {
  $("#catalog").scrollIntoView();
  $("#search").focus({ preventScroll: true });
};
$("#dialog-close").onclick = () => $("#product-dialog").close();
$("#product-dialog").addEventListener("click", (e) => {
  if (e.target === $("#product-dialog")) {
    const r = e.target.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      e.target.close();
  }
});
$("#product-dialog").addEventListener("close", () => {
  $("#detail").replaceChildren();
});
async function fetchRows(tab) {
  const response = await fetch(
    `https://docs.google.com/spreadsheets/d/${sheet}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(tab)}&_=${Date.now()}`,
    { cache: "no-store", signal: AbortSignal.timeout(18000) },
  );
  if (!response.ok) throw Error("無法讀取團購資料");
  const csv = await response.text();
  if (/^\s*</.test(csv)) throw Error("資料格式不正確");
  const parsed = Papa.parse(csv, { header: false, skipEmptyLines: true });
  if (parsed.errors.length) throw Error("團購欄位無法辨識");
  return ProductContent.sheetRows(parsed.data);
}
async function performLoad() {
  try {
    const result = await Promise.allSettled([
      fetchRows("現正開團"),
      fetchRows("即將開團"),
    ]);
    if (result[0].status !== "fulfilled") throw result[0].reason;
    const main = normalize(result[0].value),
      extra =
        result[1].status === "fulfilled"
          ? normalize(result[1].value, true)
          : [];
    const seen = new Set(main.map((p) => p.key));
    const combined = [...main, ...extra.filter((p) => !seen.has(p.key))];
    products = [];
    // A product may also have an identical coupon row. Coalesce only identical
    // identity, destination, dates, status and code; conflicting records stay blocked.
    for (const p of combined) {
      const i = products.findIndex(q => q.key === p.key && q.url === p.url &&
        q.start === p.start && q.end === p.end && q.status.key === p.status.key &&
        q.coupon === p.coupon);
      if (i < 0) products.push(p);
      else if (!p.kind && products[i].kind) products[i] = p;
    }
    const counts = new Map();
    products.forEach(p => counts.set(p.key, (counts.get(p.key) || 0) + 1));
    products.forEach(p => { if (counts.get(p.key) > 1) p.status = { ...p.status, key: "unknown", label: "商品資料待確認" }; });
    // Migrate brand-only favourites once; retain original storage for rollback.
    try {
      if (!localStorage.getItem(SAVED_KEY + "-migrated")) {
        const names = new Set(["eg_wishlist", "eaglish-design-saved"].flatMap(k => {
          try { const a = JSON.parse(localStorage.getItem(k) || "[]"); return Array.isArray(a) ? a : []; } catch { return []; }
        }));
        products.forEach(p => { if (names.has(p.brand)) saved.add(p.key); });
        updateSaved();
        localStorage.setItem(SAVED_KEY + "-migrated", "1");
      }
    } catch {}
    refreshedAt = Date.now();
    verifiedDay = ProductContent.today();
    loaded = true;
    const cats = [
      ...new Set(
        products
          .flatMap((p) => p.category.split(/[,，]/).map((x) => x.trim()))
          .filter(Boolean),
      ),
    ];
    $("#category").innerHTML =
      '<option value="">全部分類</option>' +
      cats.map((c) => `<option>${esc(c)}</option>`).join("");
    $("#category").value = category;
    $("#source-status").textContent =
      result[1].status === "rejected"
        ? "即將開團資料暫時無法讀取；目前顯示已取得的商品。"
        : "";
    render();
    window.dispatchEvent(new Event("catalog-ready"));
    updateSaved();
    if ($("#product-dialog").open) {
      const key = $("#product-dialog").dataset.productKey;
      const index = products.findIndex(p => p.key === key);
      if (index >= 0) {
        const scroll = $("#product-dialog").scrollTop;
        openDetail(index, true);
        $("#product-dialog").scrollTop = scroll;
      } else $("#product-dialog").close();
    }
    return true;
  } catch (e) {
    $("#source-status").innerHTML =
      '目前無法取得最新團購資料。<button id="retry" class="text-link">重新讀取</button>';
    $("#products").innerHTML = catalogueFallback ||
      '<div class="loading"><a href="/guides/">先看選購方向</a>，或<a href="/blog/">閱讀生活筆記</a>。</div>';
    $("#products").setAttribute("aria-busy", "false");
    $("#result-count").textContent = "商品介紹目錄・即時狀態待確認";
    $("#load-more").hidden = true;
    $("#show-all-products").hidden = true;
    $("#browse-progress").textContent = "";
    $("#retry").onclick = load;
    refreshedAt = 0;
    products = products.map(p => ({ ...p, status: { ...p.status, key: "unknown", label: "團購狀態待確認" } }));
    updateTodayClosing();
    window.dispatchEvent(new Event("catalog-ready"));
    if ($("#product-dialog").open) {
      $("#detail [data-buy-key]")?.remove();
      $("#detail #copy-coupon")?.closest("p")?.remove();
      const label = $("#detail .status");
      if (label) label.textContent = "團購狀態待確認";
    }
    return false;
  }
}
function load() {
  if (loadingPromise) return loadingPromise;
  loadingPromise = performLoad().finally(() => { loadingPromise = null; });
  return loadingPromise;
}
function returnRefresh() {
  if (!document.hidden && (ProductContent.today() !== verifiedDay || Date.now() - refreshedAt > 30000)) load();
}
window.addEventListener("focus", returnRefresh);
window.addEventListener("focus", updateCountdowns);
document.addEventListener("visibilitychange", updateCountdowns);
setInterval(updateCountdowns, 1000);
document.addEventListener("visibilitychange", returnRefresh);
setInterval(() => {
  if (!document.hidden && (ProductContent.today() !== verifiedDay || Date.now() - refreshedAt > 300000)) load();
}, 60000);
document.addEventListener("click", async e => {
  const a = e.target.closest("[data-buy-key]");
  if (!a) return;
  e.preventDefault();
  e.stopImmediatePropagation();
  if (buying) return;
  buying = true;
  const key = a.dataset.buyKey;
  const sourceSurface = a.closest("#product-dialog") ? "homepage_details_modal" : "homepage_product_card";
  const pending = window.open("about:blank", "_blank");
  if (pending) { pending.opener = null; pending.document.title = "正在確認當期團購"; }
  notify("正在確認最新團購入口…");
  try {
    const ok = await load();
    const matches = products.filter(p => p.key === key);
    const p = matches.length === 1 ? matches[0] : null;
    if (!ok || !p || p.status.key !== "open") {
      pending?.close();
      notify("目前無法確認可訂購，請稍後再試。");
      return;
    }
    const destination = ProductContent.withUTM(p.url, p.brand);
    window.SiteAnalytics?.outboundGroupbuy({
      productId: p.article?.id || p.key,
      productName: p.brand,
      groupType: p.kind === "coupon" ? "coupon" : p.status.long ? "evergreen" : "limited",
      sourceSurface,
      articleSlug: p.article ? new URL(p.article.article, location.href).pathname.split('/').filter(Boolean).at(-1) : '',
      destinationUrl: destination,
      ctaLabel: a.textContent,
      campaignKey: p.end || "evergreen",
      legacyEvent: p.kind === "coupon" ? "click_coupon" : "click_group",
      legacyData: { group_category: p.category },
    });
    if (pending && !pending.closed) pending.location.replace(destination);
    else window.location.assign(destination);
  } finally { buying = false; }
}, true);
let sharedLinkHandled = false;
window.addEventListener("catalog-ready", () => {
  if (sharedLinkHandled || !refreshedAt) return;
  sharedLinkHandled = true;
  const articleId = location.hash.match(/^#product-([a-z0-9-]+)$/)?.[1];
  if (articleId) {
    const matches = products.filter(p => p.article?.id === articleId);
    if (matches.length === 1) return openDetail(products.indexOf(matches[0]));
    // Missing or ambiguous campaigns do not inherit a checkout from another product.
    if (matches.length > 1) { query=matches[0].brand.toLowerCase(); $("#search").value=query; setStatus("all"); }
    $("#catalog").scrollIntoView();
    return;
  }
  const key = new URLSearchParams(location.search).get("p");
  if (!key) return;
  const exact = products.findIndex(p => p.key === key);
  if (exact >= 0) return openDetail(exact);
  const matches = products.filter(p => p.brand === key);
  if (matches.length === 1) openDetail(products.indexOf(matches[0]));
  else if (matches.length > 1) {
    query = key.toLowerCase(); $("#search").value = key; setStatus("all");
    $("#catalog").scrollIntoView();
  }
});
updateSaved();
load();
