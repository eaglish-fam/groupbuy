/* GIF-like original clips: autoplay loops in view, no extra playback controls. */
(() => {
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const clips=[...document.querySelectorAll('.loop-item video')].map(video=>({video,visible:false,loaded:false}));
  for(const clip of clips)clip.video.autoplay=!motion.matches;
  function load(clip){if(clip.loaded)return;const source=clip.video.querySelector('source');source.src=source.dataset.src;clip.video.load();clip.loaded=true;}
  function update(clip){
    const playing=clip.visible&&!motion.matches&&!document.hidden;
    clip.video.autoplay=playing;
    if(!playing){clip.video.pause();return;}
    clip.video.muted=true;load(clip);clip.video.play().catch(()=>{});
  }
  const observer=new IntersectionObserver(entries=>{for(const entry of entries){const clip=clips.find(c=>c.video===entry.target);clip.visible=entry.isIntersecting;update(clip);}},{threshold:.15});
  for(const clip of clips)observer.observe(clip.video);
  document.addEventListener('visibilitychange',()=>clips.forEach(update));
  motion.addEventListener('change',()=>clips.forEach(update));
})();
