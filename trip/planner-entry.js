(() => {
  const entry = document.querySelector('[data-plan-entry]');
  const plan = document.getElementById('plan');
  if (!entry || !plan) return;
  const heading = plan.querySelector('h2');
  const footer = document.querySelector('footer');
  const nav = document.querySelector('.reading-nav');
  let queued = false;
  const visible = el => {
    if (!el) return false;
    const rect = el.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  };
  function update() {
    queued = false;
    const focus = document.activeElement;
    const rect = focus && focus !== document.body && focus !== entry ? focus.getBoundingClientRect() : null;
    // Reserve the launcher's whole touch area, including its focus ring and safe area.
    const obscuresFocus = rect && rect.right > window.innerWidth - 90 && rect.bottom > window.innerHeight - 110 && rect.top < window.innerHeight;
    entry.hidden = visible(plan) || visible(footer) || Boolean(nav?.classList.contains('is-open')) || Boolean(obscuresFocus);
  }
  function schedule() {
    if (!queued) { queued = true; requestAnimationFrame(update); }
  }
  window.addEventListener('scroll', schedule, {passive: true});
  window.addEventListener('resize', schedule);
  document.addEventListener('focusin', schedule);
  document.addEventListener('focusout', schedule);
  // Reading navigation is inserted by its defer script before this script runs.
  if (nav) new MutationObserver(schedule).observe(nav, {attributes: true, attributeFilter: ['class']});
  if ('ResizeObserver' in window) new ResizeObserver(schedule).observe(document.body);
  entry.addEventListener('click', event => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (location.hash !== '#plan') history.pushState(null, '', '#plan');
    if (heading) { heading.setAttribute('tabindex', '-1'); heading.focus({preventScroll: true}); }
    plan.scrollIntoView({block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
    schedule();
  });
  update();
})();
