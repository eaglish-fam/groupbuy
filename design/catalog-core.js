/* Group-buy catalogue rules shared by the homepage and /calendar/. The Google
   Sheet stays the single source; both pages read, classify and order it here. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object") module.exports = api;
  else root.CatalogCore = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";
  const PC = () => root.ProductContent || (typeof require === "function" ? require("../product-content.js") : undefined);
  const safe = (s) => PC().safeUrl(s);
  const SHEET_ID = "1-RuyD9eCkrDpgFFXGHRWaTF-LYKaDK-MxAw3uNMozeU";
  const LEOFOO_PLANS = [
    { code: "A", brand: "六福莊住宿 A｜樂園無限玩", label: "A｜二天一夜・樂園" },
    { code: "B", brand: "六福莊住宿 B｜經典探險", label: "B｜二天一夜・動物體驗" },
    { code: "C", brand: "六福莊住宿 C｜FUN肆玩樂季", label: "C｜三天二夜・晚餐 DIY" },
  ];

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
  function imageUrl(value) {
    const u = safe(value);
    if (!u) return "";
    if (/^https:\/\/(?:www\.)?eaglish\.store\/assets\//i.test(u))
      return new URL(u).pathname;
    if (u.includes("drive.google.com")) {
      const match = u.match(/\/d\/([^/?]+)/) || u.match(/[?&]id=([^&]+)/);
      return match ? `https://lh3.googleusercontent.com/d/${match[1]}=w1000` : u;
    }
    return u;
  }
  function classify(r, today) {
    const ProductContent = PC();
    const type = r["類型"] || "",
      now = today || ProductContent.today(),
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
    // A main-sheet row still typed 即將開團 once its dates have started is open: the
    // dates are the schedule, so nobody has to remember to edit the type on launch day.
    // Rows from the 即將開團 tab are announcements and keep their type.
    const launched = start && end && now >= start && now <= end && !r._fromUpcomingTab;
    if ((start && now < start) || (/即將|upcoming/i.test(type) && !launched))
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
    const ProductContent = PC();
    return rows
      .filter(
        (r) => r["品牌"]?.trim() && !/^(\/\/|---|===)/.test(r["品牌"].trim()),
      )
      .map((r) => {
        if (upcoming) r = { ...r, 類型: "即將開團", _fromUpcomingTab: true };
        const brand = r["品牌"].trim();
        const localImage = ProductContent.entry(brand)?.cardImage || ProductContent.entry(brand)?.image || "";
        const sheetImage = imageUrl(r["圖片網址"] || r.image);
        const driveFirst = ProductContent.entry(brand)?.id === "eben-kombucha" && sheetImage;
        const primaryImages = driveFirst ? [sheetImage] : [localImage, sheetImage];
        const urls = [
          ...primaryImages,
          ...String(r["附加圖片"] || "")
            .split(/[\r\n,，]+/)
            .map(imageUrl),
        ].filter(Boolean);
        return {
          brand,
          key: String(r["商品ID"] || r["ProductID"] || [brand, r["商品描述"] || "", imageUrl(r["圖片網址"] || r.image) || urls[0] || ""].join("|")),
          source: r,
          description: ProductContent.entry(brand)?.description || r["商品描述"] || "",
          url: safe(r["連結"]),
          images: [...new Set(urls)],
          fallbackImage: driveFirst ? localImage : "",
          category: r["分類"] || "其他",
          country: r["國家"] || "",
          start: ProductContent.date(r["開團日期"]),
          end: ProductContent.date(r["結束日期"]),
          status: classify(r),
          note: r["備註"] || "",
          details: r["方案詳情"] || ProductContent.entry(brand)?.details || "",
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
  // Sheet dates are Taiwan calendar days, inclusive through the end of that day.
  function countdownText(end, now = Date.now()) {
    const remaining = Date.parse(end + "T00:00:00+08:00") + 86400000 - now;
    if (!Number.isFinite(remaining) || remaining <= 0) return "本次已結團";
    const minutes = Math.ceil(remaining / 60000);
    // Whole days equal the calendar-day gap to the end date (the end day itself counts down in hours).
    if (minutes >= 1440) return `剩 ${Math.floor(minutes / 1440)} 天`;
    return `最後 ${Math.floor(minutes / 60)} 小時 ${minutes % 60} 分`;
  }
  function timedCampaign(p) {
    return !p.kind && p.status.key === "open" && !p.status.long && !!p.end;
  }
  function isClosingSoon(end, now = Date.now()) {
    const remaining = Date.parse(end + "T00:00:00+08:00") + 86400000 - now;
    return remaining > 0 && remaining <= 3 * 86400000;
  }
  function leofooPlanFor(product) {
    return LEOFOO_PLANS.find(plan => plan.brand === product?.brand);
  }
  // Group only the rendered catalogue entries. Every action retains an actual
  // normalized product object and its original index in `products`.
  function groupLeofooForDisplay(list, catalogue) {
    const plans = LEOFOO_PLANS.map(plan => catalogue.find(p => p.brand === plan.brand));
    const matchedPlans = list.filter(leofooPlanFor);
    if (!matchedPlans.length)
      return list.map(product => ({ product, leofooPlans: [], matchedLeofooPlans: [] }));
    let inserted = false;
    return list.flatMap(product => {
      if (!leofooPlanFor(product)) return [{ product, leofooPlans: [] }];
      if (inserted) return [];
      inserted = true;
      return [{
        product: plans[0] || matchedPlans[0],
        leofooPlans: plans,
        matchedLeofooPlans: matchedPlans,
      }];
    });
  }
  function applyLeofooCampaignStatus(catalogue, campaign) {
    const states = {
      open: { key: "open", label: "限時開團" },
      upcoming: { key: "upcoming", label: "即將開團" },
      closed: { key: "closed", label: "本次已結團" },
      unavailable: { key: "unknown", label: "商品資料待確認" },
    };
    for (const product of catalogue) {
      const plan = leofooPlanFor(product);
      if (!plan) continue;
      const status = states[campaign.plans?.[plan.code]?.state] || states.unavailable;
      product.status = { ...product.status, ...status, long: false };
    }
  }
  function leofooGroupStatus(plans) {
    if (plans.some(plan => plan.status.key === "open"))
      return { key: "open", label: "仍有方案開團" };
    if (plans.some(plan => plan.status.key === "upcoming"))
      return { key: "upcoming", label: "即將開團" };
    if (plans.some(plan => plan.status.key === "unknown"))
      return { key: "unknown", label: "方案資料待確認" };
    return { key: "closed", label: "本次已結團" };
  }
  async function fetchRows(tab) {
    const response = await fetch(
      `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&headers=1&sheet=${encodeURIComponent(tab)}&_=${Date.now()}`,
      { cache: "no-store", signal: AbortSignal.timeout(18000) },
    );
    if (!response.ok) throw Error("無法讀取團購資料");
    const csv = await response.text();
    if (/^\s*</.test(csv)) throw Error("資料格式不正確");
    const parsed = root.Papa.parse(csv, { header: false, skipEmptyLines: true });
    if (parsed.errors.length) throw Error("團購欄位無法辨識");
    return PC().sheetRows(parsed.data);
  }
  // Turn raw Sheet rows into the catalogue both pages show.
  function buildCatalog(rows, permanentRegistry) {
    // The Sheet has one canonical product tab. Verify its raw rows before
    // coalescing so genuine duplicate brands still fail closed.
    const leofooCampaign = PC().campaignFor(rows, "leofoo");
    const combined = normalize(rows);
    let products = [];
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
    products = root.PermanentOffers.mergeProducts(products, permanentRegistry);
    applyLeofooCampaignStatus(products, leofooCampaign);
    return products;
  }
  // Upcoming opening and closing days, from today on, for campaigns that are open or announced.
  function collectEvents(products) {
    const list = [];
    const today = PC().today();
    products.forEach((p, index) => {
      if (["book", "edu", "coupon"].includes(p.kind)) return;
      if (!["open", "upcoming"].includes(p.status.key)) return;
      if (p.end && p.end < today) return;
      if (p.start && p.start >= today)
        list.push({ p, index, date: p.start, kind: "start", label: "開團" });
      if (p.end && p.end >= today)
        list.push({
          p,
          index,
          date: p.end,
          kind: "end",
          label: p.status.long ? "當期連結更新" : "結團截止",
        });
    });
    return list.sort(
      (a, b) => a.date.localeCompare(b.date) || a.kind.localeCompare(b.kind),
    );
  }
  const icsText = (s) =>
    String(s)
      .replace(/\\/g, "\\\\")
      .replace(/\r?\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  // RFC 5545 line folding uses UTF-8 octets, not JavaScript string length.
  function fold(line) {
    let out = "",
      bytes = 0;
    for (const ch of line) {
      const size = new TextEncoder().encode(ch).length;
      if (bytes + size > 73) {
        out += "\r\n ";
        bytes = 1;
      }
      out += ch;
      bytes += size;
    }
    return out;
  }
  // Eight AM in Taiwan is 00:00 UTC. Preserve the original reminder time.
  function icsDocument(list, now = new Date()) {
    const stamp = now
      .toISOString()
      .replace(/[-:]/g, "")
      .replace(/\.\d{3}/, "");
    const lines = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Eaglish//Groupbuy Calendar//ZH-TW",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ];
    list.forEach((e) => {
      const date = e.date.replaceAll("-", "");
      lines.push(
        "BEGIN:VEVENT",
        `UID:${encodeURIComponent(e.p.key)}-${e.kind}-${date}@eaglish.store`,
        `DTSTAMP:${stamp}`,
        `DTSTART:${date}T000000Z`,
        `DTEND:${date}T010000Z`,
        `SUMMARY:${icsText(e.p.brand + " · " + e.label)}`,
        `DESCRIPTION:${icsText("團購資訊請查看鷹家買物社：https://www.eaglish.store/\n" + e.p.url)}`,
        "END:VEVENT",
      );
    });
    lines.push("END:VCALENDAR");
    return lines.map(fold).join("\r\n") + "\r\n";
  }
  function googleCalendarUrl(e) {
    const date = e.date.replaceAll("-", "");
    const url = new URL("https://calendar.google.com/calendar/render");
    url.search = new URLSearchParams({
      action: "TEMPLATE",
      text: e.p.brand + " · " + e.label,
      dates: `${date}T000000Z/${date}T010000Z`,
      details: "鷹家買物社團購提醒\n" + e.p.url,
      ctz: "Asia/Taipei",
    });
    return url.href;
  }

  return {
    SHEET_ID, LEOFOO_PLANS, resourceKind, channels, imageUrl, classify, normalize,
    countdownText, timedCampaign, isClosingSoon, leofooPlanFor, groupLeofooForDisplay,
    applyLeofooCampaignStatus, leofooGroupStatus, fetchRows, buildCatalog, collectEvents,
    icsDocument, googleCalendarUrl,
  };
});
