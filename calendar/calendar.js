/* /calendar/: the homepage's live group-buy list, grouped by what a shopper needs next.
   Sheet reading, status and ordering rules come from /design/catalog-core.js. */
(() => {
  "use strict";
  const $ = (s) => document.querySelector(s);
  const esc = (s) => ProductContent.escape(s);
  const track = (name, data = {}) => window.SiteAnalytics?.track(name, data);
  const emptyRegistry = Object.freeze({ schema: "eaglish.permanent-offers/v1", offers: [] });
  const GROUPS = {
    closing: "目前沒有 3 天內截止的團。",
    open: "目前沒有其他限時開團。",
    upcoming: "下一檔還在準備中，先加入 LINE 社群收預告。",
    evergreen: "目前沒有常駐商品。",
  };
  let products = [], entries = [], refreshedAt = 0, verifiedDay = "", loading = null, buying = false, toastTimer = 0;
  let month = "", selectedDate = "";
  const pad = (n) => String(n).padStart(2, "0");

  const byEnd = (a, b) => (a.end || "9999").localeCompare(b.end || "9999");
  const byStart = (a, b) => (a.start || "9999").localeCompare(b.start || "9999");
  const short = (date) => date ? date.slice(5).replace("-", "/") : "";

  // Same filters as the homepage's 限時開團／即將開團／常駐 views, so the counts agree.
  function grouped() {
    const timed = products.filter((p) => !p.kind && p.status.key === "open" && !p.status.long).sort(byEnd);
    const closing = timed.filter((p) => p.end && CatalogCore.isClosingSoon(p.end));
    return {
      closing,
      open: timed.filter((p) => !closing.includes(p)),
      upcoming: products.filter((p) => !p.kind && p.status.key === "upcoming").sort(byStart),
      evergreen: products.filter((p) => !p.kind && p.status.long && p.status.key === "open"),
    };
  }
  function articleHref(p) {
    return p.article?.article || p.blogUrl || "";
  }
  function datesLine(p, group) {
    if (group === "upcoming") return p.start ? `<strong>${short(p.start)}</strong> 開團${p.end ? `・${short(p.end)} 截止` : ""}` : "開團日期確認中";
    if (group === "evergreen") return "常駐開團";
    return `${p.start ? `${short(p.start)} 開團・` : ""}<strong>${short(p.end)}</strong> 截止`;
  }
  function groupFor(p) {
    if (p.status.key === "upcoming") return "upcoming";
    if (p.status.long) return "evergreen";
    return p.end && CatalogCore.isClosingSoon(p.end) ? "closing" : "open";
  }
  function itemMarkup({ product: p, leofooPlans }, group, badge = "") {
    const index = entries.push(p) - 1;
    const leofoo = leofooPlans.length === CatalogCore.LEOFOO_PLANS.length;
    const title = leofoo ? "六福莊住宿｜三種方案" : p.brand;
    const image = p.images[0] || "";
    const thumb = /^https:\/\/lh3\.googleusercontent\.com\/d\/[^\s]+=w\d+$/.test(image) ? image.replace(/=w\d+$/, "=w240") : image;
    const reading = leofoo ? "/blog/leofoo/" : articleHref(p);
    const countdown = CatalogCore.timedCampaign(p)
      ? `<span class="cal-countdown${CatalogCore.isClosingSoon(p.end) ? " is-urgent" : ""}" data-closing-date="${esc(p.end)}">${CatalogCore.countdownText(p.end)}</span>`
      : "";
    const buy = leofoo
      ? (p.status.key === "open" ? `<a class="button primary" href="/blog/leofoo/#plans">比較三種方案</a>` : "")
      : p.status.key === "open" && p.url
        ? `<a class="button primary" href="${esc(ProductContent.withUTM(p.url, p.brand))}" data-buy-key="${esc(p.key)}" target="_blank" rel="noopener noreferrer">去團購 <span aria-hidden="true">↗</span></a>`
        : "";
    const remind = (p.start || p.end) ? `<button class="cal-link" type="button" data-remind="${index}">加入行事曆</button>` : "";
    return `<article class="cal-item" data-product-key="${esc(p.key)}">
      <div class="cal-thumb">${thumb ? `<img src="${esc(thumb)}" alt="" width="240" height="180" loading="lazy" decoding="async">` : ""}</div>
      <div class="cal-body">${badge}<h3>${esc(title)}</h3>
      <p class="cal-dates">${datesLine(p, group)} ${countdown}</p>
      <div class="cal-actions">${buy}${reading ? `<a class="cal-link" href="${esc(reading)}">看選物誌</a>` : ""}${remind}</div></div>
    </article>`;
  }
  function render() {
    entries = [];
    const groups = grouped();
    for (const [group, list] of Object.entries(groups)) {
      const shown = CatalogCore.groupLeofooForDisplay(list, products);
      const container = document.querySelector(`[data-group="${group}"]`);
      container.innerHTML = shown.length ? shown.map((item) => itemMarkup(item, group)).join("") : "";
      const section = container.closest(".calendar-group");
      let empty = section.querySelector(".calendar-empty");
      if (!shown.length) {
        if (!empty) { empty = document.createElement("p"); empty.className = "calendar-empty"; container.after(empty); }
        empty.textContent = GROUPS[group];
      } else empty?.remove();
      const heading = section.querySelector("h2");
      let count = section.querySelector("[data-count]") || heading.querySelector(".count");
      if (!count) { count = document.createElement("span"); count.className = "count"; heading.append(count); }
      count.textContent = `${shown.length} 檔`;
    }
    const total = ["closing", "open"].reduce((n, g) => n + CatalogCore.groupLeofooForDisplay(groups[g], products).length, 0);
    $("#calendar-summary").textContent = `限時開團 ${total} 檔（3 天內截止 ${CatalogCore.groupLeofooForDisplay(groups.closing, products).length} 檔）・即將開團 ${CatalogCore.groupLeofooForDisplay(groups.upcoming, products).length} 檔。資料與首頁同步。`;
    $("#calendar-lists").removeAttribute("aria-busy");
    renderMonth();
  }
  // Month view, like the homepage calendar: dots mark opening and closing days; picking a day
  // lists that day's campaigns as cards next to the grid.
  function renderMonth() {
    const today = ProductContent.today();
    if (!month) month = today.slice(0, 7);
    const events = refreshedAt ? CatalogCore.collectEvents(products) : [];
    const inMonth = events.filter((e) => e.date.startsWith(month));
    if (!selectedDate || !selectedDate.startsWith(month))
      selectedDate = inMonth.find((e) => e.date >= today)?.date || "";
    const [year, m] = month.split("-").map(Number),
      days = new Date(Date.UTC(year, m, 0)).getUTCDate(),
      first = new Date(Date.UTC(year, m - 1, 1)).getUTCDay();
    $("#month-label").textContent = `${year} 年 ${m} 月`;
    $("#month-grid").innerHTML =
      ["日", "一", "二", "三", "四", "五", "六"].map((d) => `<span class="weekday" aria-hidden="true">${d}</span>`).join("") +
      '<span class="empty-day" aria-hidden="true"></span>'.repeat(first) +
      Array.from({ length: days }, (_, i) => {
        const date = `${month}-${pad(i + 1)}`,
          dayEvents = inMonth.filter((e) => e.date === date),
          start = dayEvents.filter((e) => e.kind === "start").length,
          end = dayEvents.length - start;
        return `<button type="button" class="month-day${date === today ? " today" : ""}${dayEvents.length ? " has-events" : ""}" data-day="${date}" ${date < today ? "disabled" : ""} aria-pressed="${date === selectedDate}" aria-label="${m}月${i + 1}日，${start}筆開團，${end}筆截止"><span>${i + 1}</span><small>${start ? `<i class="start-dot">${start}</i>` : ""}${end ? `<i class="end-dot">${end}</i>` : ""}</small></button>`;
      }).join("");
    if (!refreshedAt) return;
    const shown = inMonth.filter((e) => e.date === selectedDate);
    $("#agenda-title").textContent = selectedDate
      ? `${short(selectedDate)} 的開結團（${shown.length} 檔）`
      : inMonth.length ? "點月曆上有圓點的日期" : "這個月沒有尚未過期的開結團";
    $("#agenda-items").innerHTML = shown
      .map((e) => itemMarkup({ product: e.p, leofooPlans: [] }, groupFor(e.p), `<span class="event-badge ${e.kind}">${short(e.date)} ${e.label}</span>`))
      .join("");
  }
  function shiftMonth(n) {
    const [y, m] = month.split("-").map(Number), date = new Date(Date.UTC(y, m - 1 + n, 1));
    month = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
    selectedDate = "";
    renderMonth();
  }
  function upcomingEvents() {
    const today = ProductContent.today();
    return CatalogCore.collectEvents(products).filter((e) => e.date >= today && e.p.status.key !== "closed");
  }
  function notify(message) {
    $("#toast").textContent = message;
    $("#toast").classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $("#toast").classList.remove("show"), 2200);
  }
  function downloadICS(list) {
    if (!list.length) return notify("目前沒有可匯入的新開結團日期");
    const url = URL.createObjectURL(new Blob([CatalogCore.icsDocument(list)], { type: "text/calendar;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "鷹家買物社-團購提醒.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    notify(`已下載 ${list.length} 筆開結團提醒`);
  }
  function showReminder(list) {
    track("add_to_calendar", { group_name: list[0]?.p.brand || "", count: list.length, source_surface: "calendar_page" });
    const d = document.createElement("dialog");
    d.className = "reminder-dialog";
    d.setAttribute("aria-label", "加入行事曆");
    d.innerHTML = `<div class="dialog-header"><h2>加入行事曆</h2><button class="close" type="button">關閉 ×</button></div><div class="reminder-options"><p>開結團當天，台灣時間早上 8 點提醒。</p>${list.length ? list.map((e) => `<a class="button secondary" href="${esc(CatalogCore.googleCalendarUrl(e))}" target="_blank" rel="noopener noreferrer">${short(e.date)} ${e.label}・Google 日曆</a>`).join("") + '<button class="button primary" type="button" data-download>Apple／其他行事曆（ICS）</button>' : "<p>這個商品目前沒有尚未過期的開結團日期。</p>"}</div>`;
    document.body.append(d);
    d.querySelector(".close").onclick = () => d.close();
    d.addEventListener("close", () => d.remove());
    d.querySelector("[data-download]")?.addEventListener("click", () => downloadICS(list));
    d.showModal();
  }
  async function registry() {
    try { return await PermanentOffers.load("/config/permanent-offers.json"); }
    catch { return emptyRegistry; }
  }
  async function performLoad() {
    const offers = await registry();
    try {
      products = CatalogCore.buildCatalog(await CatalogCore.fetchRows("現正開團"), offers);
      refreshedAt = Date.now();
      verifiedDay = ProductContent.today();
      render();
      return true;
    } catch (error) {
      console.error("Calendar data unavailable:", error);
      if (!refreshedAt) {
        $("#calendar-summary").innerHTML = '目前無法取得最新團購資料。<button type="button" id="retry">重新讀取</button>，或<a href="/">回首頁看商品</a>。';
        $("#retry").onclick = load;
        $("#calendar-lists").removeAttribute("aria-busy");
        $("#agenda-title").textContent = "目前讀不到開結團日期";
      } else notify("暫時無法更新團購資料，顯示的是剛才的內容");
      return false;
    }
  }
  function load() {
    if (loading) return loading;
    loading = performLoad().finally(() => { loading = null; });
    return loading;
  }
  function updateCountdowns() {
    if (document.hidden || !refreshedAt) return;
    if (ProductContent.today() !== verifiedDay) return load();
    document.querySelectorAll("[data-closing-date]").forEach((el) => {
      const text = CatalogCore.countdownText(el.dataset.closingDate);
      if (el.textContent !== text) el.textContent = text;
      el.classList.toggle("is-urgent", CatalogCore.isClosingSoon(el.dataset.closingDate));
    });
  }
  // Confirm the campaign is still open against fresh Sheet data before leaving, as the homepage does.
  document.addEventListener("click", async (e) => {
    const day = e.target.closest("[data-day]");
    if (day) {
      selectedDate = day.dataset.day;
      renderMonth();
      if (matchMedia("(max-width: 760px)").matches) $(".month-agenda").scrollIntoView({ block: "start" });
      return;
    }
    const remind = e.target.closest("[data-remind]");
    if (remind) {
      const p = entries[Number(remind.dataset.remind)];
      const today = ProductContent.today();
      return showReminder(CatalogCore.collectEvents(products).filter((x) => x.p === p && x.date >= today));
    }
    const a = e.target.closest("[data-buy-key]");
    if (!a) return;
    e.preventDefault();
    if (buying) return;
    buying = true;
    const pending = window.open("about:blank", "_blank");
    if (pending) { pending.opener = null; pending.document.title = "正在確認當期團購"; }
    try {
      if (Date.now() - refreshedAt > 60000) {
        notify("正在確認最新團購入口…");
        if (!(await load())) throw Error("stale");
      }
      const matches = products.filter((p) => p.key === a.dataset.buyKey);
      const p = matches.length === 1 ? matches[0] : null;
      if (!p || p.status.key !== "open" || !p.url) throw Error("closed");
      const destination = ProductContent.withUTM(p.url, p.brand);
      window.SiteAnalytics?.outboundGroupbuy({
        productId: p.article?.id || p.key,
        productName: p.brand,
        groupType: p.status.long ? "evergreen" : "limited",
        sourceSurface: "calendar_page",
        articleSlug: p.article ? new URL(p.article.article, location.href).pathname.split("/").filter(Boolean).at(-1) : "",
        destinationUrl: destination,
        ctaLabel: a.textContent.trim(),
        campaignKey: p.end || "evergreen",
        legacyEvent: "click_group",
        legacyData: { group_category: p.category },
      });
      if (pending && !pending.closed) pending.location.replace(destination);
      else window.location.assign(destination);
    } catch {
      pending?.close();
      notify("目前無法確認可訂購，請稍後再試。");
      render();
    } finally { buying = false; }
  }, true);
  $("#month-prev").onclick = () => shiftMonth(-1);
  $("#month-next").onclick = () => shiftMonth(1);
  $("#month-today").onclick = () => { month = ProductContent.today().slice(0, 7); selectedDate = ""; renderMonth(); };
  $("#subscribe-all").addEventListener("click", () => {
    const list = upcomingEvents();
    track("subscribe_all_calendar", { count: list.length, source_surface: "calendar_page" });
    downloadICS(list);
  });
  const refreshIfStale = () => {
    if (!document.hidden && (ProductContent.today() !== verifiedDay || Date.now() - refreshedAt > 30000)) load();
  };
  window.addEventListener("focus", refreshIfStale);
  document.addEventListener("visibilitychange", refreshIfStale);
  setInterval(updateCountdowns, 30000);
  setInterval(() => { if (!document.hidden && Date.now() - refreshedAt > 300000) load(); }, 60000);
  renderMonth();
  load();
})();
