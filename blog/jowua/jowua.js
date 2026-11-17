(() => {
  const status = document.querySelector('.copy-status');
  document.querySelectorAll('[data-jowua-offer]').forEach((offer, i) => {
    if (i === document.querySelectorAll('[data-jowua-offer]').length - 1 && window.ArticleFloatingOffer) ArticleFloatingOffer.mount(offer, { available: true });
  });
  document.addEventListener('click', event => {
    const copy = event.target.closest('[data-jowua-copy]');
    if (!copy || !window.PermanentOffers) return;
    void PermanentOffers.copyCode(copy.dataset.jowuaCopy, {
      onSuccess: () => { status.textContent = '折扣碼 eagle 已複製'; },
      onFailure: () => { status.textContent = '請長按複製折扣碼：eagle'; },
    });
  });
})();
