/* Homepage editorial carousel. Article facts stay in ProductContent.catalog. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object") module.exports = api;
  else {
    root.EditorPicks = api;
    api.mount(root.ProductContent);
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  function ordered(catalog) {
    return Object.entries(catalog || {})
      .map(([key, item], sourceOrder) => ({ key, sourceOrder, ...item }))
      .filter((item) => item.article && item.image && item.title && /^\d{4}-\d{2}-\d{2}$/.test(item.published || ""))
      .sort((a, b) => b.published.localeCompare(a.published) || a.sourceOrder - b.sourceOrder);
  }

  // 從所有選物文章挑出正在開團的：限時團依截止日排（最快結束的在前），常駐團排在後面。
  function openPicks(all, products, now = Date.now()) {
    const core = globalThis.CatalogCore;
    const seen = new Set();
    const rows = [];
    for (const p of products || []) {
      const href = p?.article?.article;
      if (!href || p.kind || p.status?.key !== "open" || p.status.soldOut || seen.has(href)) continue;
      const item = all.find((pick) => pick.article === href);
      if (!item) continue;
      seen.add(href);
      const timed = !p.status.long && !!p.end;
      rows.push({
        ...item,
        campaign: {
          key: p.key,
          url: p.url,
          end: timed ? p.end : "",
          countdown: timed && core ? core.countdownText(p.end, now) : "",
          urgent: timed && core ? core.isClosingSoon(p.end, now) : false,
        },
      });
    }
    // 限時團全放；常駐團取最新的幾篇補到 8 張，輪播不要長到沒人看完。
    rows.sort((a, b) => (a.campaign.end || "9999").localeCompare(b.campaign.end || "9999") || b.published.localeCompare(a.published));
    const timedRows = rows.filter((r) => r.campaign.end);
    return timedRows.concat(rows.filter((r) => !r.campaign.end).slice(0, Math.max(0, 8 - timedRows.length)));
  }

  function wrap(index, length) {
    return length ? ((index % length) + length) % length : 0;
  }

  function mount(content) {
    const carousel = document.querySelector("[data-editor-picks]");
    if (!carousel || !content?.catalog) return null;
    // data-editor-picks-media keeps a carousel that CSS hides on small screens from loading its slides there.
    const gate = carousel.dataset.editorPicksMedia ? matchMedia(carousel.dataset.editorPicksMedia) : null;
    if (gate && !gate.matches) {
      gate.addEventListener?.("change", function opened(event) {
        if (!event.matches) return;
        gate.removeEventListener("change", opened);
        mount(content);
      });
      return null;
    }
    let picks = ordered(content.catalog);
    if (!picks.length) return null;

    const track = carousel.querySelector(".hero-slides");
    const previous = carousel.querySelector("[data-pick-prev]");
    const next = carousel.querySelector("[data-pick-next]");
    const toggle = carousel.querySelector("[data-pick-toggle]");
    const controls = carousel.querySelector(".hero-pick-controls");
    const dotsRoot = carousel.querySelector("[data-pick-dots]");
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    let active = 0;
    let timer = 0;
    let pausedByUser = reducedMotion.matches;
    let interacting = false;
    let pointerStart = null;
    let suppressClick = false;

    function slide(item, index) {
      const article = document.createElement("article");
      article.className = "hero-slide";
      article.dataset.pickKey = item.key;
      article.setAttribute("aria-label", `第 ${index + 1} 篇，共 ${picks.length} 篇精選文章`);

      const link = document.createElement("a");
      link.className = "hero-image-link";
      link.href = item.article;
      link.setAttribute("aria-label", `閱讀：${item.title}`);

      const image = document.createElement("img");
      const originalWidth = globalThis.EntryImageWidths?.[item.image];
      const srcset = /^\/assets\/[a-z0-9/_-]+\.webp$/i.test(item.image)
        ? `${item.image.replace(/\.webp$/, '-480.webp')} 480w, ${item.image.replace(/\.webp$/, '-960.webp')} 960w${originalWidth ? `, ${item.image} ${originalWidth}w` : ''}`
        : '';
      if (index === 0) {
        image.src = item.image;
        if (srcset) image.srcset = srcset;
      } else {
        image.dataset.src = item.image;
        if (srcset) image.dataset.srcset = srcset;
      }
      image.sizes = "(max-width:700px) 100vw, 50vw";
      image.alt = `${item.brands?.[0] || "選物文章"}：${item.title}`;
      image.width = 1400;
      image.height = 1000;
      image.decoding = "async";
      if (index === 0) image.fetchPriority = "high";
      else { image.loading = "lazy"; image.fetchPriority = "low"; }

      link.append(image);

      const caption = document.createElement("div");
      caption.className = "hero-caption";
      caption.setAttribute("aria-hidden", "true");
      const title = document.createElement("strong");
      title.textContent = item.title;
      caption.append(title);

      const number = document.createElement("span");
      number.className = "photo-index";
      number.textContent = `EDITOR'S PICK / ${String(index + 1).padStart(2, "0")}`;
      if (item.campaign) {
        // 開團中的選物：圖上標「開團中・剩 N 天」（倒數由 design.js 每分鐘更新），標題旁放「去團購」。
        const c = item.campaign;
        number.className = "photo-index hero-campaign-badge" + (c.urgent ? " is-urgent" : "");
        number.textContent = "開團中";
        if (c.end) {
          const left = document.createElement("span");
          left.dataset.closingDate = c.end;
          left.textContent = c.countdown;
          number.append("・", left);
        } else number.textContent = "常駐開團";
        const buy = document.createElement("a");
        buy.className = "hero-buy";
        buy.href = c.url;
        buy.target = "_blank";
        buy.rel = "noopener noreferrer";
        buy.dataset.buyKey = c.key;
        buy.innerHTML = '去團購<span aria-hidden="true">↗</span>';
        buy.setAttribute("aria-label", `去團購：${item.brands?.[0] || item.title}`);
        caption.removeAttribute("aria-hidden");
        title.setAttribute("aria-hidden", "true");
        caption.classList.add("has-buy");
        caption.append(buy);
      }
      article.append(link, caption, number);
      return article;
    }

    let slides = picks.map(slide);
    track.replaceChildren(...slides);
    // A "3／18" counter instead of one dot per pick: 18 dots were too small to tap or tell apart.
    const counter = document.createElement("span");
    counter.className = "pick-count";
    dotsRoot.replaceChildren(counter);
    controls.hidden = picks.length < 2;

    function stop() {
      clearTimeout(timer);
      timer = 0;
    }

    function schedule() {
      stop();
      if (pausedByUser || interacting || document.hidden || gate?.matches === false || picks.length < 2) return;
      timer = setTimeout(() => {
        show(active + 1, false);
        schedule();
      }, 6500);
    }

    function show(index, userInitiated = true) {
      active = wrap(index, slides.length);
      slides.forEach((item, position) => {
        const selected = position === active;
        const image = item.querySelector('img');
        if (selected && image.dataset.src) {
          if (image.dataset.srcset) image.srcset = image.dataset.srcset;
          image.src = image.dataset.src;
          delete image.dataset.src;
          delete image.dataset.srcset;
        }
        item.classList.toggle("is-active", selected);
        item.setAttribute("aria-hidden", String(!selected));
        item.inert = !selected;
      });
      counter.textContent = `${active + 1}／${picks.length}`;
      carousel.setAttribute("aria-label", `Editor's Pick 選物文章：${picks[active].title}`);
      if (userInitiated) schedule();
    }

    function setPaused(value) {
      pausedByUser = value;
      toggle.setAttribute("aria-pressed", String(value));
      toggle.innerHTML = `<span aria-hidden="true">${value ? "▶" : "Ⅱ"}</span>`;
      toggle.setAttribute("aria-label", value ? "播放自動輪播" : "暫停自動輪播");
      schedule();
    }

    previous.addEventListener("click", () => show(active - 1));
    next.addEventListener("click", () => show(active + 1));
    toggle.addEventListener("click", () => setPaused(!pausedByUser));
    carousel.addEventListener("mouseenter", () => { interacting = true; stop(); });
    carousel.addEventListener("mouseleave", () => { interacting = false; schedule(); });
    carousel.addEventListener("focusin", () => { interacting = true; stop(); });
    carousel.addEventListener("focusout", (event) => {
      if (carousel.contains(event.relatedTarget)) return;
      interacting = false;
      schedule();
    });
    carousel.addEventListener("pointerdown", (event) => {
      suppressClick = false;
      pointerStart = { x: event.clientX, y: event.clientY, at: performance.now() };
      stop();
    });
    carousel.addEventListener("pointerup", (event) => {
      if (!pointerStart) return schedule();
      const dx = event.clientX - pointerStart.x;
      const dy = event.clientY - pointerStart.y;
      const elapsed = performance.now() - pointerStart.at;
      pointerStart = null;
      if (elapsed < 900 && Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) {
        suppressClick = true;
        show(active + (dx < 0 ? 1 : -1));
      }
      else schedule();
    });
    carousel.addEventListener("click", (event) => {
      if (!suppressClick || !event.target.closest(".hero-image-link")) return;
      event.preventDefault();
      suppressClick = false;
    });
    carousel.addEventListener("pointercancel", () => {
      pointerStart = null;
      schedule();
    });
    document.addEventListener("visibilitychange", schedule);
    gate?.addEventListener?.("change", schedule);
    reducedMotion.addEventListener?.("change", (event) => setPaused(event.matches));
    // Sheet 載入後只輪播「開團中」的選物（快結束的排前面）；一檔都沒開時維持全部文章。
    function setPicks(next) {
      if (!next.length) return;
      stop();
      picks = next;
      slides = picks.map(slide);
      track.replaceChildren(...slides);
      controls.hidden = picks.length < 2;
      carousel.dataset.mode = "open";
      show(0, false);
      schedule();
    }
    window.addEventListener?.("catalog-rendered", () => {
      if (carousel.dataset.mode === "open" || typeof products === "undefined") return;
      setPicks(openPicks(picks, products));
    });
    show(0, false);
    setPaused(pausedByUser);
    return { count: () => picks.length, show, stop, setPicks };
  }

  return { ordered, openPicks, wrap, mount };
});
