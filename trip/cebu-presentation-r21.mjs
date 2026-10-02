import './cebu-bohol-planner.mjs';
import {startPhotoGrids,layoutPhotoGrids} from './photo-frame-grid.mjs';
import {startPhotoRecovery} from './photo-error-recovery.mjs';
startPhotoGrids();
startPhotoRecovery();
// Cebu only: normal-flow numbered TOC, no floating duplicated chapter/planner UI.
const toc=document.querySelector('.r21-toc'),desktop=matchMedia('(min-width:701px)');
const sync=()=>{if(toc)toc.open=desktop.matches;};sync();desktop.addEventListener('change',sync);
let serial=0;
for(const event of ['wheel','touchstart','pointerdown'])window.addEventListener(event,()=>serial++,{passive:true});
document.querySelector('#main')?.addEventListener('click',event=>{
 const a=event.target.closest('a[href^="#"]');if(!a)return;
 const target=document.getElementById(decodeURIComponent(a.hash.slice(1))),heading=target?.querySelector('h2,h3,h4')||target;
 if(!heading)return;event.preventDefault();const ticket=++serial;
 if(toc&&!desktop.matches)toc.open=false;
 const place=()=>{layoutPhotoGrids();const masthead=document.querySelector('body.cb-guide > header.masthead.wrap');const edge=Math.max(0,masthead?.getBoundingClientRect().bottom||0);const y=scrollY+heading.getBoundingClientRect().top-edge-17;window.scrollTo({top:Math.max(0,y),behavior:'instant'});};
 heading.setAttribute('tabindex','-1');heading.focus({preventScroll:true});history.replaceState(null,'',a.hash);place();
 if(document.fonts?.status==='loading')document.fonts.ready.then(()=>{if(ticket===serial&&document.activeElement===heading)place();});
});
