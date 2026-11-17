(() => {
  // The coupon CTA floats like other journal purchase controls (Hiram 2026-11-06).
  const offer = document.querySelector('#offer .offer-link');
  if (offer && window.ArticleFloatingOffer) ArticleFloatingOffer.mount(offer, { available: true });
})();
