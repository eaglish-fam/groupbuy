(() => {
  // trip/singapore-approved-model.mjs
  function validDate(value) {
    if (value === "") return true;
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = /* @__PURE__ */ new Date(value + "T00:00:00Z");
    return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
  }
  function dateForDay(value, index) {
    if (!validDate(value) || !Number.isInteger(index) || index < 0) throw new RangeError("Invalid date/day");
    if (!value) return "";
    const date = /* @__PURE__ */ new Date(value + "T00:00:00Z");
    date.setUTCDate(date.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  }
  function selectedRoute(routes, days, pace) {
    const r = routes.find((r2) => r2.sightseeingDays === Number(days) && r2.pace === pace);
    if (!r) throw Error("Choose approved 2\u20134 day route");
    return r;
  }
  function approvedDay(routes, days, pace, index, startDate = "") {
    const route = selectedRoute(routes, days, pace);
    if (!Number.isInteger(index) || index < 0 || index >= route.days.length) throw Error("Invalid day");
    const day = route.days[index], date = dateForDay(startDate, index);
    const closures = { "flower-dome": ["2026-10-06"], "cloud-forest": ["2026-10-26"], "supertree": ["2026-10-15"] };
    const stops = day.stops.map((s) => ({ ...s, blocked: Boolean(date && closures[s.target]?.includes(date)) }));
    const warnings = [];
    if (!date) warnings.push("\u5C1A\u672A\u9078\u65E5\u671F\uFF1B\u51FA\u767C\u524D\u6838\u5C0D\u7DAD\u8B77\u65E5\u3001\u5834\u6B21\u8207\u7968\u5238\u3002");
    else warnings.push("\u586B\u5165\u65B0\u52A0\u5761\u7576\u5730\u65E5\u671F\uFF0C\u67E5\u770B\u71DF\u904B\u8207\u7DAD\u8B77\u65E5\u63D0\u9192\u3002\u8CC7\u8A0A\u6838\u5C0D\uFF1A2026/10/3\uFF0C\u51FA\u767C\u524D\u53EF\u518D\u67E5\u5404\u7AD9\u516C\u544A\u3002");
    for (const s of stops) if (s.blocked) warnings.push(s.label + " \u5728 " + date + " \u516C\u544A\u7DAD\u8B77\uFF0C\u8ACB\u63DB\u65E5\u671F\u6216\u9078\u5176\u4ED6\u6D3B\u52D5\u3002");
    if (date === "2026-10-09" && stops.some((s) => s.target === "national-museum")) warnings.push("Odyssea \u7576\u65E5 16:00 \u9589\u5C55\uFF0C15:30 \u6700\u5F8C\u5165\u5834\uFF1B\u4E0A\u5348\u884C\u7A0B\u4E5F\u9808\u518D\u6B21\u6838\u5C0D\u3002");
    if (stops.some((s) => s.target === "duck-tour")) warnings.push("\u4F9D\u9078\u8CFC\u7522\u54C1\u78BA\u8A8D\u96C6\u5408\u5730\u9EDE\u3001\u5831\u5230\u6642\u9593\u3001\u8A9E\u8A00\u3001\u65E5\u671F\u3001\u5152\u7AE5\u898F\u5247\u8207\u96E8\u5929\u5B89\u6392\u3002");
    return { route, day, date, stops, warnings };
  }

  // trip/singapore-photo-retry.mjs
  function installPhotoRetry(images, pageUrl) {
    const retried = /* @__PURE__ */ new WeakSet(), origin = new URL(pageUrl).origin;
    for (const img of images) {
      const retry = () => {
        if (retried.has(img)) return;
        const url = new URL(img.currentSrc || img.src, pageUrl);
        if (url.origin !== origin || !/\/trip\/assets\/singapore\/[A-Za-z0-9_-]+\.webp$/.test(url.pathname)) return;
        retried.add(img);
        url.searchParams.set("sg-image-retry", "1");
        img.dataset.imageRetry = "1";
        img.removeAttribute("srcset");
        img.src = url.href;
      };
      img.addEventListener("error", retry);
      if (img.complete && !img.naturalWidth) retry();
    }
  }

  // trip/singapore-approved-planner.mjs
  installPhotoRetry(document.querySelectorAll("img"), location.href);
  var cards = document.querySelector(".sg-guide #places .bkk-overview");
  cards?.addEventListener("click", (event) => {
    const card = event.target.closest("a[data-place-ref]");
    if (!card || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || !document.querySelector("aside.reading-nav")) return;
    const chapter = [...document.querySelectorAll('nav.toc a[href^="#"]')].find((a) => a.hash === card.hash);
    if (chapter) {
      event.preventDefault();
      chapter.click();
    }
  });
  var root = document.querySelector("[data-approved-plan]");
  if (root) {
    let render = function() {
      const { route, day, stops, date: localDate, warnings } = approvedDay(data.routes, count, pace, active, start);
      root.querySelector("[data-route-label]").textContent = route.label;
      root.querySelector("[data-route-fit]").textContent = route.fit;
      root.querySelector("[data-route-note]").textContent = route.note;
      if (switcher.children.length !== count) switcher.replaceChildren(...route.days.map((_, i) => {
        const b = node("button", "");
        b.type = "button";
        b.dataset.day = String(i);
        b.setAttribute("aria-controls", "sg-day-panel");
        b.addEventListener("click", () => {
          active = i;
          render();
        });
        return b;
      }));
      [...switcher.children].forEach((b, i) => {
        b.textContent = `\u7B2C ${i + 1} \u5929 \xB7 ${route.days[i].title}`;
        b.setAttribute("aria-pressed", String(i === active));
      });
      const list = document.createElement("ol");
      list.className = "sg-approved-stops";
      for (const s of stops) {
        const li = document.createElement("li");
        li.dataset.stepKind = s.blocked ? "blocked" : "visit";
        li.append(node("span", s.blocked ? "\u7576\u65E5\u7DAD\u8B77" : "\u884C\u7A0B\u9078\u9EDE"));
        const body = document.createElement("div");
        body.append(link(s.target, s.label));
        if (s.blocked) body.append(node("p", "\u9019\u7AD9\u7576\u65E5\u7DAD\u8B77\uFF0C\u53EF\u6539\u9078\u5176\u4ED6\u65E5\u671F\uFF0C\u6216\u53C3\u8003\u4E0B\u65B9\u9078\u9805\u8ABF\u6574\u884C\u7A0B\u3002"));
        li.append(body);
        list.append(li);
      }
      const optional = document.createElement("p");
      if (day.optionalTargets.length) {
        optional.append(node("strong", day.optionalMode === "choose_one" ? "\u4E0B\u5348\u9078\u4E00\u500B\uFF1A" : day.optionalMode === "replace" ? "\u53EF\u66FF\u63DB\uFF1A" : "\u52A0\u9078\u6216\u66FF\u63DB\u4F9D\u4E0A\u8FF0\u5B89\u6392\uFF1A"));
        day.optionalTargets.forEach((id, i) => {
          if (i) optional.append(document.createTextNode("\u3001"));
          optional.append(link(id, data.titles[id]));
        });
      }
      const ul = document.createElement("ul");
      ul.className = "sg-plan-notes";
      ul.append(...warnings.map((w) => node("li", w)));
      panel.replaceChildren(node("h3", `\u7B2C ${active + 1} \u500B\u89C0\u5149\u65E5 \xB7 ${day.title}${localDate ? " \xB7 " + localDate : ""}`), list, node("p", day.description), optional, ul);
      status.textContent = `${count} \u5929${pace === "compact" ? "\u7DCA\u6E4A" : "\u60A0\u9592"}\uFF0C\u6B63\u5728\u770B\u7B2C ${active + 1} \u5929\uFF1A${day.title}\u3002`;
    };
    const data = JSON.parse(root.querySelector("[data-approved-routes]").textContent), days = root.querySelector("#sg-days"), date = root.querySelector("#sg-date"), switcher = root.querySelector("[data-day-switcher]"), panel = root.querySelector("[data-day-panel]"), status = root.querySelector('[role="status"]'), error = root.querySelector("[data-plan-error]");
    let active = 0, pace = "leisure", count = 2, start = "";
    const node = (tag, text) => {
      const n = document.createElement(tag);
      n.textContent = text;
      return n;
    };
    const link = (target, label) => {
      const a = node("a", label);
      a.href = "#" + target;
      return a;
    };
    days.addEventListener("change", () => {
      count = Number(days.value);
      selectedRoute(data.routes, count, pace);
      active = Math.min(active, count - 1);
      render();
    });
    root.querySelectorAll('[name="sg-pace"]').forEach((r) => r.addEventListener("change", () => {
      if (r.checked) {
        pace = r.value;
        render();
      }
    }));
    date.addEventListener("change", () => {
      const invalid = date.validity.badInput || !date.checkValidity() || !validDate(date.value);
      date.setAttribute("aria-invalid", String(invalid));
      error.hidden = !invalid;
      if (invalid) {
        error.textContent = "\u8ACB\u9078\u6709\u6548\u65E5\u671F\uFF1B\u5148\u524D\u6709\u6548\u65E5\u671F\u4ECD\u4FDD\u7559\u3002";
        return;
      }
      start = date.value;
      render();
    });
    render();
    root.querySelector("[data-plan-controls]").hidden = false;
    root.querySelector("[data-plan-fallback]").hidden = true;
  }
})();
