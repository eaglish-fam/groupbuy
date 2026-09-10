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

  function wrap(index, length) {
    return length ? ((index % length) + length) % length : 0;
  }

  function mount(content) {
    const carousel = document.querySelector("[data-editor-picks]");
    if (!carousel || !content?.catalog) return null;
    const picks = ordered(content.catalog);
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

    function slide(item, index) {
      const article = document.createElement("article");
      article.className = "hero-slide";
      article.dataset.pickKey = item.key;
      article.setAttribute("aria-label", `第 ${index + 1} 篇，共 ${picks.length} 篇精選文章`);
      article.style.setProperty("--pick-image", `url(${JSON.stringify(item.image)})`);

      const image = document.createElement("img");
      image.src = item.image;
      image.alt = `${item.brands?.[0] || "選物文章"}：${item.title}`;
      image.width = 1400;
      image.height = 1000;
      if (index === 0) image.fetchPriority = "high";
      else image.loading = "lazy";

      const link = document.createElement("a");
      link.className = "hero-caption";
      link.href = item.article;
      const copy = document.createElement("span");
      const category = document.createElement("small");
      category.textContent = item.category;
      const title = document.createElement("strong");
      title.textContent = item.title;
      copy.append(category, title);
      const arrow = document.createElement("span");
      arrow.className = "round-arrow";
      arrow.setAttribute("aria-hidden", "true");
      arrow.textContent = "↗";
      link.append(copy, arrow);

      const number = document.createElement("span");
      number.className = "photo-index";
      number.textContent = `EDITOR'S PICK / ${String(index + 1).padStart(2, "0")}`;
      article.append(image, link, number);
      return article;
    }

    const slides = picks.map(slide);
    track.replaceChildren(...slides);
    const dots = picks.map((item, index) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.className = "pick-dot";
      dot.setAttribute("aria-label", `顯示第 ${index + 1} 篇：${item.title}`);
      dot.setAttribute("aria-pressed", "false");
      dot.addEventListener("click", () => show(index));
      return dot;
    });
    dotsRoot.replaceChildren(...dots);
    controls.hidden = picks.length < 2;

    function stop() {
      clearTimeout(timer);
      timer = 0;
    }

    function schedule() {
      stop();
      if (pausedByUser || interacting || document.hidden || picks.length < 2) return;
      timer = setTimeout(() => {
        show(active + 1, false);
        schedule();
      }, 6500);
    }

    function show(index, userInitiated = true) {
      active = wrap(index, slides.length);
      slides.forEach((item, position) => {
        const selected = position === active;
        item.classList.toggle("is-active", selected);
        item.setAttribute("aria-hidden", String(!selected));
        item.inert = !selected;
      });
      dots.forEach((dot, position) => dot.setAttribute("aria-pressed", String(position === active)));
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
      pointerStart = { x: event.clientX, y: event.clientY, at: performance.now() };
      stop();
    });
    carousel.addEventListener("pointerup", (event) => {
      if (!pointerStart) return schedule();
      const dx = event.clientX - pointerStart.x;
      const dy = event.clientY - pointerStart.y;
      const elapsed = performance.now() - pointerStart.at;
      pointerStart = null;
      if (elapsed < 900 && Math.abs(dx) > 48 && Math.abs(dx) > Math.abs(dy)) show(active + (dx < 0 ? 1 : -1));
      else schedule();
    });
    carousel.addEventListener("pointercancel", () => {
      pointerStart = null;
      schedule();
    });
    document.addEventListener("visibilitychange", schedule);
    reducedMotion.addEventListener?.("change", (event) => setPaused(event.matches));
    show(0, false);
    setPaused(pausedByUser);
    return { count: picks.length, show, stop };
  }

  return { ordered, wrap, mount };
});
