/* Keep the original content families and calendar actions in the new design. */
(() => {
  let month = ProductContent.today().slice(0, 7),
    selectedDate = "",
    events = [];
  const pad = (n) => String(n).padStart(2, "0");
  // 書名「鷹式教養－紙本書」→ 書「鷹式教養」＋格式「紙本」。同一本書的各格式合成一張卡。
  const BOOK_INFO = {
    鷹式教養: {
      subtitle: "不被 AI 取代的人生演算法",
      desc: "康先生寫家庭、教育，也寫孩子在 AI 時代仍要練的判斷與責任。紙本、電子書都買得到，選你習慣的讀法。",
    },
  };
  function worksBooks(list) {
    const books = new Map();
    for (const p of list) {
      const [title, rawFormat = ""] = p.brand.split(/\s*[－—–-]\s*/);
      const format = /電子/.test(rawFormat) ? "電子書" : /紙本|實體/.test(rawFormat) ? "紙本" : rawFormat || "購買";
      if (!books.has(title)) books.set(title, { title, formats: [], cover: "", fallback: "", note: [] });
      const b = books.get(title);
      if (!b.cover || format === "紙本") {
        b.cover = p.images[0] || b.cover;
        b.fallback = p.fallbackImage || p.images[1] || b.fallback;
      }
      if (p.retailers.length) b.formats.push({ format, product: p });
    }
    const order = (f) => (f.format === "紙本" ? 0 : f.format === "電子書" ? 1 : 2);
    return [...books.values()]
      .map((b) => {
        const info = BOOK_INFO[b.title] || {};
        const groups = b.formats
          .sort((x, y) => order(x) - order(y))
          .map(
            ({ format, product: p }) => `<div class="works-group"><p class="works-group-label">${esc(format)}</p><div class="works-chips">${p.retailers
              .map(
                (r) =>
                  `<a class="works-chip" href="${esc(ProductContent.withUTM(r.url, p.brand))}" target="_blank" rel="noopener noreferrer" data-outbound-product-id="${esc(p.key)}" data-outbound-product-name="${esc(p.brand)}" data-outbound-group-type="book" data-outbound-source-surface="homepage_works" data-outbound-campaign-key="book" data-outbound-retailer="${esc(r.name)}" data-outbound-legacy-event="click_book">${esc(r.name)}</a>`,
              )
              .join("")}</div></div>`,
          )
          .join("");
        const cover = b.cover
          ? `<img class="works-cover" src="${esc(b.cover.replace(/=w\d+$/, "=w600"))}"${b.fallback ? ` data-fallback-src="${esc(b.fallback)}"` : ""} alt="《${esc(b.title)}》書封" width="600" height="800" loading="lazy" decoding="async">`
          : `<span class="works-cover works-cover-empty">《${esc(b.title)}》</span>`;
        return `<article class="works-card works-book" aria-label="書：${esc(b.title)}">
          <div class="works-visual works-visual-book">${cover}</div>
          <div class="works-body">
            <p class="works-kind">書・親子教養</p>
            <h3>${esc(b.title)}</h3>
            ${info.subtitle ? `<p class="works-subtitle">${esc(info.subtitle)}</p>` : ""}
            ${info.desc ? `<p class="works-desc">${esc(info.desc)}</p>` : ""}
            <ul class="works-facts" aria-label="購買方式">${b.formats.map((f) => `<li>${esc(f.format)}</li>`).join("")}<li>${b.formats.reduce((n, f) => n + f.product.retailers.length, 0)} 個購書通路</li></ul>
            <div class="works-actions">${groups}</div>
          </div>
        </article>`;
      })
      .join("");
  }
  function resourceShelves() {
    if (!loaded) return;
    navCounts();
    for (const kind of ["coupon", "book", "edu"]) {
      const list = products.filter((p) =>
        kind === "coupon"
          ? p.status.key === "open" &&
            (p.kind === "coupon" || (p.coupon && !p.kind))
          : p.kind === kind,
      );
      // 康先生的作品：同一本書的紙本／電子書（Sheet 上分兩列）合成一張卡；遊戲那張卡寫在 HTML 裡。
      if (kind === "book") {
        const slot = $("#book-products");
        slot.innerHTML = worksBooks(list);
        slot.hidden = !list.length;
        continue;
      }
      $(`#${kind}-products`).innerHTML = list.length
        ? list.map(card).join("")
        : `<p class="resource-empty">${kind === "coupon" ? "目前沒有開放中的優惠，之後再來看看。" : "目前沒有已公布的資料。"}</p>`;
      // Edu resources come and go with the Sheet; hide an empty shelf and its nav link
      // instead of showing a dead-end section. Coupons keep their "come back later" note.
      if (kind !== "coupon") {
        const id = kind === "book" ? "kang-books" : "edu";
        $(`#${id}`).hidden = !list.length;
        const link = document.querySelector(`.content-nav a[href="#${id}"]`);
        if (link) link.hidden = !list.length;
      }
    }
  }
  // 頂部導覽：開團好物、折扣碼附上數量；捲動時標出目前所在段落，並把那一格捲進可視範圍。
  function navCounts() {
    const counts = {
      "#catalog": products.filter((p) => !p.kind && p.status.key === "open").length,
      "#coupon": products.filter((p) => p.status.key === "open" && (p.kind === "coupon" || (p.coupon && !p.kind))).length,
    };
    for (const [href, n] of Object.entries(counts)) {
      const link = document.querySelector(`.content-nav a[href="${href}"]`);
      if (!link) continue;
      let badge = link.querySelector("b[data-nav-count]");
      if (!badge) {
        badge = document.createElement("b");
        badge.dataset.navCount = "";
        link.append(badge);
      }
      badge.textContent = n;
      badge.hidden = !n;
    }
  }
  function navSpy() {
    const nav = document.querySelector(".content-nav");
    if (!nav) return;
    const links = [...nav.querySelectorAll('a[href^="#"]')];
    let queued = false;
    const mark = () => {
      queued = false;
      // 目前段落＝頂端已經捲過畫面上方約三分之一的最後一段（隱藏的段落不算）。
      const line = Math.max(nav.getBoundingClientRect().bottom + 24, innerHeight * 0.35);
      let current = null;
      for (const a of links) {
        const section = document.querySelector(a.getAttribute("href"));
        if (section && !section.hidden && section.getBoundingClientRect().top <= line) current = a;
      }
      for (const a of links) {
        const on = a === current;
        if (on === a.hasAttribute("aria-current")) continue;
        if (on) {
          a.setAttribute("aria-current", "true");
          const left = a.offsetLeft - (nav.clientWidth - a.offsetWidth) / 2;
          nav.scrollTo({ left: Math.max(0, left), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
        } else a.removeAttribute("aria-current");
      }
    };
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(mark); } };
    addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", queue);
    window.addEventListener("catalog-rendered", queue);
    mark();
  }
  navSpy();
  const collectEvents = () => CatalogCore.collectEvents(products);
  function renderCalendar() {
    // Recheck the date when browsing months, including tabs left open overnight.
    events = collectEvents();
    const [year, m] = month.split("-").map(Number),
      days = new Date(Date.UTC(year, m, 0)).getUTCDate(),
      first = new Date(Date.UTC(year, m - 1, 1)).getUTCDay();
    $("#calendar-month").textContent = `${year} 年 ${m} 月`;
    const inMonth = events.filter((e) => e.date.startsWith(month));
    $("#month-grid").innerHTML =
      ["日", "一", "二", "三", "四", "五", "六"]
        .map((d) => `<span class="weekday">${d}</span>`)
        .join("") +
      '<span class="empty-day" aria-hidden="true"></span>'.repeat(first) +
      Array.from({ length: days }, (_, i) => {
        const date = `${month}-${pad(i + 1)}`,
          dayEvents = inMonth.filter((e) => e.date === date),
          start = dayEvents.filter((e) => e.kind === "start").length,
          end = dayEvents.length - start;
        return `<button class="calendar-day ${date === ProductContent.today() ? "today" : ""}" data-calendar-date="${date}" ${date < ProductContent.today() ? "disabled" : ""} aria-label="${m}月${i + 1}日，${start}筆開團，${end}筆截止或更新" aria-pressed="${date === selectedDate}"><span>${i + 1}</span><small>${start ? `<i class="start-dot">${start}</i>` : ""}${end ? `<i class="end-dot">${end}</i>` : ""}</small></button>`;
      }).join("");
    const shown = selectedDate
      ? inMonth.filter((e) => e.date === selectedDate)
      : inMonth;
    $("#agenda-title").textContent = selectedDate
      ? `${selectedDate.slice(5).replace("-", "/")} 的開結團`
      : "本月剩餘開結團";
    $("#calendar-events").innerHTML = shown.length
      ? shown
          .map(
            (e) =>
              `<article class="calendar-event"><div><time datetime="${e.date}">${e.date.slice(5).replace("-", "/")}</time><span class="event-type ${e.kind}">${e.label}</span></div><button class="event-product" data-detail="${e.index}">${esc(e.p.brand)}</button><div class="event-actions"><button data-detail="${e.index}">看詳情</button><button data-calendar-event="${events.indexOf(e)}">加入提醒</button></div></article>`,
          )
          .join("")
      : '<p class="resource-empty">這段時間沒有尚未過期的開結團行程。</p>';
  }
  function shiftMonth(n) {
    const [y, m] = month.split("-").map(Number),
      date = new Date(Date.UTC(y, m - 1 + n, 1));
    month = `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}`;
    selectedDate = "";
    renderCalendar();
  }
  function exportICS(list) {
    if (!list.length) {
      notify("目前沒有可匯入的新開結團日期");
      return;
    }
    const blob = new Blob([CatalogCore.icsDocument(list)], {
        type: "text/calendar;charset=utf-8",
      }),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "鷹家買物社-團購提醒.ics";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    notify(`已下載 ${list.length} 筆開結團提醒`);
  }
  const googleURL = CatalogCore.googleCalendarUrl;
  function showReminder(list) {
    track("add_to_calendar", { group_name: list[0]?.p.brand || "", count: list.length });
    const d = document.createElement("dialog");
    d.className = "reminder-dialog";
    d.setAttribute("aria-label", "加入行事曆");
    d.innerHTML = `<div class="dialog-header"><h2>加入行事曆</h2><button class="close">關閉 ×</button></div><div class="reminder-options"><p>開結團當天，台灣時間早上 8 點。</p>${list.length ? list.map((e) => `<a class="button secondary" href="${esc(googleURL(e))}" target="_blank" rel="noopener noreferrer">${e.date.slice(5)} ${e.label} · Google</a>`).join("") + '<button class="button primary" data-download>Apple／其他行事曆（ICS）</button>' : "<p>這個商品目前沒有尚未過期的開結團日期。</p>"}</div>`;
    document.body.append(d);
    d.querySelector(".close").onclick = () => d.close();
    d.addEventListener("close", () => d.remove());
    const download = d.querySelector("[data-download]");
    if (download) download.onclick = () => exportICS(list);
    d.showModal();
  }
  window.addEventListener("catalog-rendered", resourceShelves);
  window.addEventListener("catalog-ready", () => {
    events = collectEvents();
    renderCalendar();
    resourceShelves();
    const countries = [
      ...new Set(products.map((p) => p.country).filter(Boolean)),
    ];
    $("#country").innerHTML =
      '<option value="">全部國家</option>' +
      countries.map((c) => `<option>${esc(c)}</option>`).join("");
    $("#country").value = country;
  });
  $("#country").onchange = (e) => {
    country = e.target.value;
    limit = PAGE_SIZE;
    render();
  };
  function setCalendarExpanded(expanded, returnToHeading = false) {
    $("#calendar-details").hidden = !expanded;
    $("#calendar-toggle").setAttribute("aria-expanded", String(expanded));
    $("#calendar-toggle").textContent = expanded
      ? "收起團購明細"
      : "展開團購明細";
    $("#calendar-collapse-bottom").setAttribute(
      "aria-expanded",
      String(expanded),
    );
    if (returnToHeading) {
      $("#calendar-toggle").focus({ preventScroll: true });
      $("#calendar-toggle").scrollIntoView({ block: "center" });
    }
  }
  $("#calendar-toggle").onclick = () =>
    setCalendarExpanded($("#calendar-details").hidden);
  $("#calendar-collapse-bottom").onclick = () =>
    setCalendarExpanded(false, true);
  $("#month-prev").onclick = () => shiftMonth(-1);
  $("#month-next").onclick = () => shiftMonth(1);
  $("#month-today").onclick = () => {
    month = ProductContent.today().slice(0, 7);
    selectedDate = "";
    renderCalendar();
  };
  $("#calendar-all").onclick = () => {
    selectedDate = "";
    renderCalendar();
  };
  $("#export-calendar").onclick = () =>
    exportICS(
      events.filter(
        (e) => e.date >= ProductContent.today() && e.p.status.key !== "closed",
      ),
    );
  document.addEventListener("click", async (e) => {
    const date = e.target.closest("[data-calendar-date]"),
      event = e.target.closest("[data-calendar-event]"),
      product = e.target.closest("[data-calendar-product]"),
      copy = e.target.closest("[data-copy-code]"),
      share = e.target.closest("[data-share-product]");
    if (date) {
      selectedDate = date.dataset.calendarDate;
      renderCalendar();
      setCalendarExpanded(true);
    }
    if (event) showReminder([events[Number(event.dataset.calendarEvent)]]);
    if (product) {
      const index = Number(product.dataset.calendarProduct);
      showReminder(
        events.filter(
          (x) => x.index === index && x.date >= ProductContent.today(),
        ),
      );
    }
    if (copy) {
      await PermanentOffers.copyCode(copy.dataset.copyCode, {
        onSuccess: () => {
          notify("折扣碼已複製");
          track("copy_coupon", { coupon_code: copy.dataset.copyCode });
        },
        onFailure: () => notify("請長按折扣碼複製"),
      });
    }
    if (share) {
      const p = products[Number(share.dataset.shareProduct)],
        url = "https://www.eaglish.store/?p=" + encodeURIComponent(p.key);
      try {
        if (navigator.share) await navigator.share({ title: p.brand, url });
        else {
          await navigator.clipboard.writeText(url);
          notify("商品分享連結已複製");
        }
      } catch (err) {
        if (err.name !== "AbortError") notify("目前無法分享，請複製商品網址");
      }
    }
  });
  window.addEventListener("product-detail-ready", (event) => {
    const p = event.detail,
      index = products.indexOf(p),
      details = $("#detail .detail-sections"),
      copy = $("#detail .detail-copy");
    if (p.retailers.length) {
      details.insertAdjacentHTML(
        "afterbegin",
        `<details open><summary>選擇購買通路</summary><div class="retailer-links">${p.retailers.map((r) => `<a class="retailer-link" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(r.name)}</a>`).join("")}</div></details>`,
      );
    }
    if (p.kind === "book") {
      copy.querySelector(".status").textContent = "康先生的作品";
      copy.querySelector(".date-line")?.remove();
      for (const node of copy.querySelectorAll("p"))
        if (node.textContent === "目前暫不提供訂購入口。")
          node.textContent = "下方可選擇紙本／電子书購書通路。";
    }
    if (p.warranty)
      details.insertAdjacentHTML(
        "beforeend",
        `<details><summary>官網與保固</summary><a href="${esc(p.warranty)}" target="_blank" rel="noopener noreferrer">前往官方保固資訊</a></details>`,
      );
    copy.insertAdjacentHTML(
      "beforeend",
      `<div class="detail-tools"><button data-share-product="${index}">分享商品</button>${!p.kind && (p.start || p.end) ? `<button data-calendar-product="${index}">加入行事曆</button>` : ""}</div>`,
    );
  });
  // Six shopping notices are embedded in HTML, independent of the old homepage.
  renderCalendar();
  if (loaded) {
    events = collectEvents();
    renderCalendar();
    resourceShelves();
  }
})();
