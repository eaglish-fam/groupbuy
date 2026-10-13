document.querySelector('[data-local-video] button')?.addEventListener('click', function () {
  const video = document.createElement('video');
  video.controls = true;
  video.playsInline = true;
  video.preload = 'metadata';
  video.poster = '/assets/knsh/video-poster.webp';
  video.src = '/assets/knsh/reading-video.mp4';
  video.setAttribute('aria-label', '秀秀介紹康軒學習雜誌');
  this.replaceWith(video);
  video.play().catch(() => {});
});
