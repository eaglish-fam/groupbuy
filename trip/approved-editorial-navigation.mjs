// Optional chapter-guide card jumps. Native links remain usable without JS.
// Measured chrome offsets and reserved source-image dimensions keep the first
// lazy-image jump stable; user input always wins over a pending font correction.
export function initEditorialNavigation(doc=document){
 const win=doc.defaultView;
 if(!win||!doc.querySelector('.city-editorial-chapter'))return()=>{};
 const chrome=doc.querySelector('[data-reading-nav-chrome]');
 const measure=()=>doc.body.style.setProperty('--approved-chrome-height',Math.ceil(chrome?.getBoundingClientRect().height||110)+'px');
 measure();const observer=typeof win.ResizeObserver==='function'?new win.ResizeObserver(measure):null;if(chrome)observer?.observe(chrome);win.addEventListener('resize',measure);
 let cancelPending=()=>{},focusMode='pointer';
 const pointer=()=>{focusMode='pointer';},keyboard=event=>{if(['Tab','Enter',' '].includes(event.key))focusMode='keyboard';};
 doc.addEventListener('pointerdown',pointer,{passive:true});doc.addEventListener('touchstart',pointer,{passive:true});doc.addEventListener('keydown',keyboard);
 const jump=(id,{focus=false}={})=>{
  const target=doc.getElementById(id);if(!target?.classList.contains('city-editorial-place'))return;
  cancelPending();
  const heading=target.querySelector('h3'),chrome=doc.querySelector('[data-reading-nav-chrome]');
  if(!heading)return;
  const offset=()=>Math.max(0,chrome?.getBoundingClientRect().bottom||0)+17;
  const align=()=>win.scrollTo({top:win.scrollY+heading.getBoundingClientRect().top-offset(),behavior:'instant'});
  align();
  if(focus){heading.setAttribute('tabindex','-1');heading.setAttribute('data-reading-nav-target','');heading.setAttribute('data-editorial-focus',focusMode);heading.focus({preventScroll:true});heading.addEventListener('blur',()=>{heading.removeAttribute('tabindex');heading.removeAttribute('data-reading-nav-target');heading.removeAttribute('data-editorial-focus');},{once:true});}
  let cancelled=false;
  const inputs=['wheel','touchstart','pointerdown','keydown'];
  let timer;
  const settled=()=>{if(!cancelled&&win.location.hash==='#'+id)align();};
  const cancel=()=>{cancelled=true;win.clearTimeout(timer);inputs.forEach(type=>doc.removeEventListener(type,cancel));doc.removeEventListener('eaglish:font-ready',settled);};
  cancelPending=cancel;inputs.forEach(type=>doc.addEventListener(type,cancel,{passive:true,once:true}));
  doc.addEventListener('eaglish:font-ready',settled,{once:true});timer=win.setTimeout(cancel,5000);
  const ready=doc.fonts?.ready||Promise.resolve();
  ready.then(()=>win.requestAnimationFrame(settled));
 };
 const click=event=>{
  const link=event.target.closest('.city-approved-cards a[href^="#"]');
  if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  const id=decodeURIComponent(link.hash.slice(1));if(!doc.getElementById(id))return;
  event.preventDefault();win.history.pushState(null,'',link.hash);jump(id,{focus:true});
 };
 doc.addEventListener('click',click);
 // Country-card deep links may land before the phase-two heading font settles.
 if(win.location.hash)jump(decodeURIComponent(win.location.hash.slice(1)));
 return()=>{cancelPending();observer?.disconnect();win.removeEventListener('resize',measure);doc.removeEventListener('click',click);doc.removeEventListener('pointerdown',pointer);doc.removeEventListener('touchstart',pointer);doc.removeEventListener('keydown',keyboard);};
}
if(typeof document!=='undefined')initEditorialNavigation();
