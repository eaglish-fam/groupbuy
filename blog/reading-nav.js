/* Opt-in article navigation. The inline table of contents remains the source of truth. */
(() => {
  const source = document.querySelector('[data-reading-nav]');
  if (!source || document.querySelector('.reading-nav')) return;
  const entries = [...source.querySelectorAll('a[href^="#"]')].map(link => ({
    link, target: document.getElementById(decodeURIComponent(link.hash.slice(1)))
  })).filter(entry => entry.target);
  if (!entries.length) return;

  const desktop = matchMedia('(min-width: 1200px)');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const chrome = document.querySelector('.journal-chrome');
  const article = source.closest('article') || document.querySelector('main');
  const root = document.createElement('aside');
  root.className = 'reading-nav';
  root.hidden = true;
  root.innerHTML = `
    <button class="reading-nav__shade" type="button" tabindex="-1" aria-label="收合文章目錄"></button>
    <button class="reading-nav__tab" type="button" aria-expanded="false" aria-controls="reading-nav-panel" aria-label="展開文章目錄">
      <span class="reading-nav__tab-label">文章目錄</span><span class="reading-nav__chevron" aria-hidden="true">›</span>
    </button>
    <nav class="reading-nav__panel" id="reading-nav-panel" aria-label="文章章節導覽" inert>
      <div class="reading-nav__heading"><span>這篇怎麼讀</span><button class="reading-nav__close" type="button" aria-label="收合文章目錄">×</button></div>
      <ol class="reading-nav__list"></ol>
    </nav>`;
  const tab = root.querySelector('.reading-nav__tab');
  const panel = root.querySelector('.reading-nav__panel');
  const list = root.querySelector('.reading-nav__list');
  entries.forEach(entry => {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = entry.link.hash;
    link.textContent = entry.link.textContent;
    item.append(link);
    list.append(item);
    entry.sideLink = link;
  });
  document.body.append(root);

  let opened = false;
  let shownOnce = false;
  let scheduled = false;
  let current = null;
  let sawSource = false;
  let flight = null;
  let arrivalAnimations = [];
  const headerBottom = () => Math.max(0, chrome?.getBoundingClientRect().bottom || 0);

  function cancelArrival() {
    for (const animation of arrivalAnimations) animation.cancel();
    arrivalAnimations = [];
    flight?.remove();
    flight = null;
  }

  function arriveFromSource(rect, top) {
    cancelArrival();
    if (reducedMotion.matches || typeof source.animate !== 'function') return;
    const destination = desktop.matches ? panel : tab;
    const end = destination.getBoundingClientRect();
    // Keep a visual copy below the masthead as the real inline navigation exits.
    // It is decorative only: original anchors and the live destination remain interactive.
    const copy = source.cloneNode(true);
    copy.removeAttribute('data-reading-nav');
    copy.removeAttribute('id');
    copy.setAttribute('aria-hidden', 'true');
    copy.inert = true;
    copy.classList.add('reading-nav__flight');
    for (const element of copy.querySelectorAll('[id],a')) {
      element.removeAttribute('id');
      if (element.tagName === 'A') element.setAttribute('tabindex', '-1');
    }
    const startY = top + 8;
    Object.assign(copy.style, {left: `${rect.left}px`, top: `${startY}px`, width: `${rect.width}px`, height: `${rect.height}px`});
    document.body.append(copy);
    flight = copy;
    const endWidth = desktop.matches ? 48 : end.width;
    const endHeight = desktop.matches ? 48 : end.height;
    const transform = `translate(${end.left - rect.left}px, ${end.top - startY}px) scale(${endWidth / rect.width}, ${endHeight / rect.height})`;
    const moving = copy.animate([
      {transform:'translate(0, 0) scale(1)', opacity:.96, borderRadius:'12px', offset:0},
      {opacity:.96, offset:.82},
      {transform, opacity:0, borderRadius:'28px', offset:1}
    ], {duration:760, easing:'cubic-bezier(.4,0,.2,1)', fill:'forwards'});
    const reveal = destination.animate([{opacity:.15}, {opacity:1}], {duration:420, delay:340, fill:'backwards'});
    arrivalAnimations = [moving, reveal];
    moving.onfinish = () => { if (flight === copy) {copy.remove(); flight = null;} };
  }

  function setOpen(value, restoreFocus = false) {
    if (value) cancelArrival();
    opened = value && !desktop.matches && !root.hidden;
    root.classList.toggle('is-open', opened);
    tab.setAttribute('aria-expanded', String(opened));
    tab.setAttribute('aria-label', opened ? '收合文章目錄' : '展開文章目錄');
    panel.inert = !desktop.matches && !opened;
    if (restoreFocus && !root.hidden && !desktop.matches) tab.focus({preventScroll: true});
    if (opened) {
      // Reveal the current entry without moving the article underneath the drawer.
      const active = current?.sideLink;
      if (active) list.scrollTop = Math.max(0, active.offsetTop - list.offsetTop - list.clientHeight / 2);
      (active || entries[0].sideLink).focus({preventScroll: true});
    }
  }

  function update() {
    scheduled = false;
    const top = headerBottom();
    root.style.setProperty('--reading-nav-top', `${Math.ceil(top + 20)}px`);
    const sourceRect = source.getBoundingClientRect();
    if (sourceRect.top < innerHeight - 24 && sourceRect.bottom > top + 24) sawSource = true;
    const visible = sourceRect.bottom < top + 12 && article.getBoundingClientRect().bottom > top + 80;
    if (root.hidden === visible) {
      if (!visible && root.contains(document.activeElement)) {
        (current?.link || entries[0].link).focus({preventScroll: true});
      }
      root.hidden = !visible;
      setOpen(false);
      if (!visible) cancelArrival();
      else if (sawSource) {
        arriveFromSource(sourceRect, top);
        sawSource = false;
      }
      if (visible && !shownOnce) {
        root.classList.add('has-hint');
        shownOnce = true;
      }
    }
    let active = null;
    // A reading line below the sticky site masthead; never select a future heading.
    for (const entry of entries) {
      if (entry.target.getBoundingClientRect().top <= top + 100) active = entry;
    }
    if (active !== current) {
      current = active;
      for (const entry of entries) {
        for (const link of [entry.link, entry.sideLink]) {
          if (entry === active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        }
      }
      if (active && (desktop.matches || opened)) {
        const linkRect = active.sideLink.getBoundingClientRect();
        const listRect = list.getBoundingClientRect();
        if (linkRect.bottom > listRect.bottom) list.scrollTop += linkRect.bottom - listRect.bottom;
        else if (linkRect.top < listRect.top) list.scrollTop -= listRect.top - linkRect.top;
      }
    }
  }
  function schedule() {
    if (!scheduled) { scheduled = true; requestAnimationFrame(update); }
  }

  function jump(event) {
    const link = event.target.closest('a[href^="#"]');
    if (!link || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const entry = entries.find(item => item.target.id === decodeURIComponent(link.hash.slice(1)));
    if (!entry) return;
    event.preventDefault();
    setOpen(false);
    if (location.hash !== link.hash) history.pushState(null, '', link.hash);
    // Use one measured offset instead of accumulating scroll-padding and scroll-margin.
    const padding = parseFloat(getComputedStyle(entry.target).paddingTop) || 0;
    const y = scrollY + entry.target.getBoundingClientRect().top + padding - headerBottom() - 16;
    scrollTo({top: y, behavior: reducedMotion.matches ? 'instant' : 'smooth'});
    const heading = entry.target.querySelector('h2') || entry.target;
    if (!heading.hasAttribute('tabindex')) {
      heading.setAttribute('tabindex', '-1');
      heading.addEventListener('blur', () => heading.removeAttribute('tabindex'), {once: true});
    }
    heading.focus({preventScroll: true});
    schedule();
  }
  source.addEventListener('click', jump);
  list.addEventListener('click', jump);
  tab.addEventListener('click', () => setOpen(!opened));
  root.querySelector('.reading-nav__close').addEventListener('click', () => setOpen(false, true));
  root.querySelector('.reading-nav__shade').addEventListener('click', () => setOpen(false, true));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && opened) { setOpen(false, true); event.preventDefault(); }
  });
  root.addEventListener('focusout', event => {
    if (opened && event.relatedTarget && !root.contains(event.relatedTarget)) setOpen(false);
  });

  // Local gestures only: the article retains its normal vertical scrolling.
  let pointerStart = null;
  let suppressClickUntil = 0;
  root.addEventListener('click', event => {
    if (performance.now() < suppressClickUntil) { event.preventDefault(); event.stopPropagation(); }
  }, true);
  root.addEventListener('pointerdown', event => {
    if (!desktop.matches && event.isPrimary && event.button === 0 &&
        (panel.contains(event.target) || tab.contains(event.target))) {
      pointerStart = {id: event.pointerId, x: event.clientX, y: event.clientY};
    }
  });
  root.addEventListener('pointermove', event => {
    if (!pointerStart || event.pointerId !== pointerStart.id) return;
    const dx = event.clientX - pointerStart.x, dy = event.clientY - pointerStart.y;
    if (Math.abs(dy) > 28 && Math.abs(dy) > Math.abs(dx)) pointerStart = null;
    else if (Math.abs(dx) > 32 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      setOpen(dx > 0, dx < 0);
      pointerStart = null;
      // Suppress the click following a swipe, which would toggle the drawer twice.
      suppressClickUntil = performance.now() + 350;
    }
  });
  for (const type of ['pointerup', 'pointercancel']) root.addEventListener(type, () => { pointerStart = null; });
  desktop.addEventListener('change', () => { cancelArrival(); setOpen(false); schedule(); });
  reducedMotion.addEventListener('change', cancelArrival);
  addEventListener('scroll', schedule, {passive: true});
  addEventListener('resize', () => { cancelArrival(); schedule(); }, {passive: true});
  addEventListener('pageshow', schedule);
  addEventListener('hashchange', schedule);
  document.addEventListener('load', schedule, true);
  if (typeof ResizeObserver !== 'undefined') {
    const observer = new ResizeObserver(schedule);
    observer.observe(source);
    if (chrome) observer.observe(chrome);
  }
  update();
})();
