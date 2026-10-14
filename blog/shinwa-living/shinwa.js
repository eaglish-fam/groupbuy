(() => {
  const status = document.querySelector('.copy-status');
  document.addEventListener('click', async event => {
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
    await PermanentOffers.copyCode(copy.dataset.shinwaCopy, {
      onSuccess: () => { status.textContent = '折扣碼已複製'; },
      onFailure: () => { status.textContent = `請長按複製：${copy.dataset.shinwaCopy}`; },
    });
  });
})();
