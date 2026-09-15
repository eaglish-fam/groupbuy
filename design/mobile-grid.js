/* Row spans create an actual two-column masonry layout while retaining DOM/tab order. */
(() => {
  const grids = [...document.querySelectorAll('.product-grid')];
  const mobile = matchMedia("(max-width: 700px)");
  let frame;
  const measure = () => {
    cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      for (const card of document.querySelectorAll('.product-grid .product-card')) {
        const span = mobile.matches && !card.hasAttribute('data-snapshot-card')
          ? `span ${Math.ceil(card.getBoundingClientRect().height) + 14}`
          : "";
        if (card.style.gridRowEnd !== span) card.style.gridRowEnd = span;
      }
    });
  };
  const sizes = new ResizeObserver(measure);
  function connect() {
    sizes.disconnect();
    for (const card of document.querySelectorAll('.product-grid .product-card')) {
      sizes.observe(card);
    }
    measure();
  }
  const changes = new MutationObserver(connect);
  grids.forEach(grid=>changes.observe(grid, {childList:true}));
  mobile.addEventListener("change", measure);
  window.addEventListener("resize", measure);
  document.fonts.ready.then(measure);
  connect();
})();
