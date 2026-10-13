document.querySelector('[data-local-video] button')?.addEventListener('click', function () {
  const video = document.createElement('video');
  video.controls = true;
  video.playsInline = true;
  video.preload = 'metadata';
  video.poster = '/assets/knsh/video-poster.webp';
  for (const [src, type] of [
    ['/assets/knsh/reading-video.webm', 'video/webm'],
    ['/assets/knsh/reading-video-mobile.mp4', 'video/mp4'],
  ]) {
    const source = document.createElement('source');
    source.src = src;
    source.type = type;
    video.append(source);
  }
  video.setAttribute('aria-label', '康軒學習雜誌介紹影片');
  this.replaceWith(video);
  video.play().catch(() => {});
});
