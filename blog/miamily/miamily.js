// The known first-party Reel is a story source, not a generation-two product test.
// Keep the visible poster until the reader chooses to load Instagram.
document.querySelector('#play-miamily')?.addEventListener('click', event => {
  ProductContent.mountVideos(document.querySelector('#miamily-player'), [{
    title: '鷹式一家 MiaMily 旅行影片',
    url: 'https://www.instagram.com/reel/DGvPO7zTUdX/'
  }]);
  event.currentTarget.hidden = true;
  // The shared player supplies its own original-platform fallback link.
  document.querySelector('.video-section > a').hidden = true;
  document.querySelector('#miamily-player iframe')?.focus();
}, { once: true });
