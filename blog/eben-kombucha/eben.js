// Local assets are fast on the site; the archived public Drive originals are the fallback.
document.addEventListener('error', event => {
  const image=event.target;
  if (!(image instanceof HTMLImageElement) || !image.dataset.fallbackSrc || image.dataset.fallbackAttempted) return;
  image.dataset.fallbackAttempted='true';
  image.removeAttribute('srcset');
  image.src=image.dataset.fallbackSrc;
}, true);
const embeds={
  youtube:'https://www.youtube-nocookie.com/embed/CP4VrwcyUxs?playsinline=1&rel=0&autoplay=1',
  instagram:'https://www.instagram.com/reel/DIbVzxRTMlF/embed/'
};
document.addEventListener('click', event => {
  const button=event.target.closest('[data-video]');
  if (!button || !embeds[button.dataset.video]) return;
  const frame=document.createElement('iframe');
  frame.src=embeds[button.dataset.video];
  frame.title=button.getAttribute('aria-label')||'EBEN 康普茶試喝影片';
  frame.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  frame.allowFullscreen=true;
  frame.referrerPolicy='strict-origin-when-cross-origin';
  button.replaceWith(frame);
}, true);
