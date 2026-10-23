(() => {
  const container = document.querySelector('#family-video');
  if (!container || !window.ProductContent) return;
  window.ProductContent.mountVideos(container, [{
    title: '三富旅行影片 · 12:20 開始',
    url: 'https://www.youtube.com/watch?v=zOMsrQ6z2xc&t=740s'
  }]);
  const poster = container.querySelector('.video-poster img');
  if (poster) {
    poster.src = '/assets/sanfufarm/video-poster.webp';
    poster.width = 640;
    poster.height = 360;
  }
})();
