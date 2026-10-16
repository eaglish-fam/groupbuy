(function (root) {
  'use strict';

  function mount(button, { available = true } = {}) {
    if (!button) throw Error('Floating offer control is required');
    if (button.__floatingOfferController) return button.__floatingOfferController;

    const slot = document.createElement('div');
    slot.className = 'offer-slot';
    const bar = document.createElement('div');
    bar.className = 'offer-bar';
    button.before(slot);
    slot.append(bar);
    bar.append(button);

    let enabled = Boolean(available);
    let frame = 0;
    let reservedHeight = 0;
    function update() {
      frame = 0;
      // Keep the dock threshold stable when floating styles shorten the button.
      const height = reservedHeight = Math.max(reservedHeight, button.getBoundingClientRect().height);
      slot.style.minHeight = `${height}px`;
      const home = slot.getBoundingClientRect();
      const bottom = parseFloat(getComputedStyle(bar).bottom) || 12;
      const viewport = window.visualViewport;
      const editing = document.activeElement?.matches('input,textarea,[contenteditable="true"]');
      const keyboard = editing && viewport && viewport.height < window.innerHeight * .8;
      const homeReached = home.top <= window.innerHeight - bottom - height;
      // Stay in place while the reader is still on the title and cover; float only once they scroll.
      const intro = window.scrollY < window.innerHeight * 0.5;
      bar.classList.toggle('is-floating', enabled && !intro && !homeReached && !keyboard && !document.fullscreenElement);
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update);
    }

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule, { passive: true });
    window.visualViewport?.addEventListener('resize', schedule, { passive: true });
    document.addEventListener('fullscreenchange', schedule);
    document.addEventListener('focusin', schedule);
    document.addEventListener('focusout', schedule);
    new ResizeObserver(schedule).observe(button);
    new ResizeObserver(schedule).observe(document.body);

    const controller = {
      setAvailable(value) {
        enabled = Boolean(value);
        schedule();
      },
      schedule,
    };
    button.__floatingOfferController = controller;
    schedule();
    return controller;
  }

  root.ArticleFloatingOffer = Object.freeze({ mount });
})(globalThis);
