/* Keep the original content families and calendar actions in the new design. */
(() => {
  let month = ProductContent.today().slice(0, 7),
    selectedDate = "",
    events = [];
  const pad = (n) => String(n).padStart(2, "0");
  function resourceShelves() {
    if (!loaded) return;
    for (const kind of ["coupon", "book", "edu"]) {
      const list = products.filter((p) =>
        kind === "coupon"
          ? p.status.key === "open" &&
            (p.kind === "coupon" || (p.coupon && !p.kind))
          : p.kind === kind,
      );
      $(`#${kind}-products`).innerHTML = list.length
        ? list.map(card).join("")
        : `<p class="resource-empty">${kind === "coupon" ? "目前沒有開放中的優惠，之後再來看看。" : "目前沒有已公布的資料。"}</p>`;
    }
  }
  function collectEvents() {
    const list = [];
    const today = ProductContent.today();
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
  const icsText = (s) =>
    String(s)
      .replace(/\\/g, "\\\\")
      .replace(/\r?\n/g, "\\n")
      .replace(/,/g, "\\,")
      .replace(/;/g, "\\;");
  // Eight AM in Taiwan is 00:00 UTC. Preserve the original reminder time.
  function exportICS(list) {
    if (!list.length) {
      notify("目前沒有可匯入的新開結團日期");
      return;
    }
    const stamp = new Date()
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
    // RFC 5545 line folding uses UTF-8 octets, not JavaScript string length.
    const fold = (line) => {
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
    };
    const blob = new Blob([lines.map(fold).join("\r\n") + "\r\n"], {
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
  function googleURL(e) {
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
      try {
        await navigator.clipboard.writeText(copy.dataset.copyCode);
        notify("折扣碼已複製");
        track("copy_coupon", { coupon_code: copy.dataset.copyCode });
      } catch {
        notify("請長按折扣碼複製");
      }
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
      copy.querySelector(".status").textContent = "康先生的書";
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
