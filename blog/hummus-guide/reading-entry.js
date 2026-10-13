/* This article's mobile/tablet TOC trigger belongs in the sticky header,
   not over the text. Reuse the shared drawer, event handlers and focus flow. */
(() => {
  const drawer=document.querySelector('.reading-nav');
  const masthead=document.querySelector('.journal-chrome .masthead');
  const trigger=drawer?.querySelector('.reading-nav__tab');
  if(!drawer||!masthead||!trigger)return;
  masthead.append(trigger);
  const sync=()=>{trigger.hidden=drawer.hidden;};
  new MutationObserver(sync).observe(drawer,{attributes:true,attributeFilter:['hidden','class']});
  sync();
})();
