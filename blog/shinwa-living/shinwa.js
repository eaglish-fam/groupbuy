(() => {
  const status = document.querySelector('.copy-status');
  const offer = document.querySelector('[data-shinwa-offer]');
  ArticleFloatingOffer.mount(offer, { available: true });
  const feedback = document.createElement('p');
  feedback.className = 'offer-feedback';
  feedback.setAttribute('aria-hidden', 'true');
  offer.parentElement.append(feedback);
  let feedbackTimer;
  function showCopyResult(message) {
    status.textContent = message;
    feedback.textContent = message;
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => { feedback.textContent = ''; }, 8000);
  }
  document.addEventListener('click', event => {
    const offerLink = event.target.closest('[data-shinwa-offer]');
    if (offerLink) {
      void PermanentOffers.copyCode(offerLink.dataset.shinwaCopyOnOpen, {
        onSuccess: () => { showCopyResult('折扣碼 eaglish 已複製'); },
        onFailure: () => { showCopyResult('請長按複製折扣碼：eaglish'); },
      });
      return;
    }
    const poster = event.target.closest('[data-video-src]');
    if (poster) {
      const iframe = document.createElement('iframe');
      iframe.src = poster.dataset.videoSrc;
      iframe.title = poster.getAttribute('aria-label').replace(/^播放：/, '');
      iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
      iframe.allowFullscreen = true;
      iframe.referrerPolicy = 'strict-origin-when-cross-origin';
      poster.replaceWith(iframe);
      return;
    }
    const copy = event.target.closest('[data-shinwa-copy]');
    if (!copy) return;
    void PermanentOffers.copyCode(copy.dataset.shinwaCopy, {
      onSuccess: () => { status.textContent = '折扣碼已複製'; },
      onFailure: () => { status.textContent = `請長按複製：${copy.dataset.shinwaCopy}`; },
    });
  });
})();
