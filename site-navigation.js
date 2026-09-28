/* Same-tab reading context only. No analytics, requests, cookies or cross-tab sync. */
(() => {
 'use strict';
 const KEY='eaglish.travel-return.v1';
 const TTL=6*60*60*1000;
 const bar=document.querySelector('[data-travel-return]');
 if(!bar)return;
 const link=bar.querySelector('[data-travel-return-link]');
 const label=bar.querySelector('[data-travel-return-title]');
 const dismiss=bar.querySelector('[data-travel-return-dismiss]');
 const cleanText=(value,max)=>typeof value==='string'?value.replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max):'';
 const pathIsTravel=path=>/^\/trip\/(?:[a-z0-9-]+\/)*$/.test(path);
 function validHash(value){
  if(typeof value!=='string'||value.length>220||!value.startsWith('#'))return '';
  try{const decoded=decodeURIComponent(value.slice(1));return decoded&&!/[\u0000-\u001f\u007f]/.test(decoded)?'#'+encodeURIComponent(decoded):'';}catch{return '';}
 }
 function clear(){try{sessionStorage.removeItem(KEY);}catch{}}
 function save(record){try{sessionStorage.setItem(KEY,JSON.stringify(record));return true;}catch{return false;}}
 function load(){
  let record;try{record=JSON.parse(sessionStorage.getItem(KEY));}catch{return null;}
  if(!record)return null;
  const now=Date.now();
  if(record.version!==1||record.origin!==location.origin||!pathIsTravel(record.path)||!Number.isFinite(record.savedAt)||record.savedAt>now+60000||now-record.savedAt>TTL){clear();return null;}
  return {version:1,origin:location.origin,path:record.path,hash:validHash(record.hash),title:cleanText(record.title,100),section:cleanText(record.section,80),scrollY:Number.isFinite(record.scrollY)?Math.max(0,Math.min(record.scrollY,1000000)):0,savedAt:record.savedAt,returningAt:Number.isFinite(record.returningAt)?record.returningAt:0};
 }
 function normalClick(event,anchor){
  const target=(anchor.getAttribute('target')||document.querySelector('base[target]')?.getAttribute('target')||'').toLowerCase();
  return !event.defaultPrevented&&event.button===0&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey&&!anchor.hasAttribute('download')&&(!target||target==='_self');
 }
 function destination(anchor){try{return new URL(anchor.getAttribute('href'),location.href);}catch{return null;}}
 function currentSection(anchor){
  let section=anchor.closest('main section[id], main article[id]');
  if(!section){
   const sections=[...document.querySelectorAll('main section[id], main h2[id], main h3[id]')];
   section=sections.filter(node=>node.getBoundingClientRect().top<=140&&node.getBoundingClientRect().bottom>0).at(-1);
  }
  if(!section&&location.hash){try{section=document.getElementById(decodeURIComponent(location.hash.slice(1)));}catch{}}
  return section;
 }
 function recordDeparture(anchor){
  const section=currentSection(anchor);
  const hash=section?.id?'#'+encodeURIComponent(section.id):validHash(location.hash);
  const heading=section?.matches?.('h1,h2,h3')?section:section?.querySelector('h1,h2,h3');
  save({version:1,origin:location.origin,path:location.pathname,hash,title:cleanText(document.querySelector('h1')?.textContent||document.title,100),section:cleanText(heading?.textContent,80),scrollY:window.scrollY||0,savedAt:Date.now()});
 }
 function sizeBar(){
  document.documentElement.classList.toggle('site-return-active',!bar.hidden);
  document.documentElement.style.setProperty('--site-return-height',bar.hidden?'0px':Math.ceil(bar.getBoundingClientRect().height)+'px');
  const stickyHeader=document.querySelector('body > .journal-chrome, body > .site-header');
  const headerHeight=Math.ceil(stickyHeader?.getBoundingClientRect().height||0);
  document.documentElement.style.setProperty('--site-next-header-height',bar.hidden?'0px':headerHeight+'px');
  // The journal's older navigation writes an inline scroll-padding value.
  // Keep native anchors below both sticky rows while this return is visible.
  document.documentElement.style.scrollPaddingTop=bar.hidden
   ? (stickyHeader?.classList?.contains('journal-chrome')?headerHeight+16+'px':'')
   : Math.ceil(bar.getBoundingClientRect().height)+headerHeight+24+'px';
 }
 function display(){
  const record=load();
  if(pathIsTravel(location.pathname)||!record){bar.hidden=true;sizeBar();return;}
  link.setAttribute('href',record.path+record.hash);
  label.textContent=[record.section,record.title&&record.title!==record.section?record.title:''].filter(Boolean).join(' · ')||'繼續剛才的旅行指南';
  bar.hidden=false;sizeBar();
 }
 function arrive(){
  const record=load();
  if(!pathIsTravel(location.pathname))return;
  clear();bar.hidden=true;sizeBar();
  // Only our explicit return may repair the final anchor position after load.
  const now=Date.now();
  if(!record||record.path!==location.pathname||!record.returningAt||record.returningAt>now||now-record.returningAt>5*60*1000||validHash(location.hash)!==record.hash)return;
  let cancelled=false;
  const cancel=()=>{cancelled=true;};
  const events=['pointerdown','touchstart','wheel','keydown'];
  events.forEach(name=>window.addEventListener(name,cancel,{once:true,passive:true}));
  const restore=()=>requestAnimationFrame(()=>{
   if(!cancelled){
    if(record.hash){
     const target=document.getElementById(decodeURIComponent(record.hash.slice(1)));
     target?.scrollIntoView?.({block:'start',behavior:'instant'});
    }else window.scrollTo({top:record.scrollY,behavior:'instant'});
   }
   events.forEach(name=>window.removeEventListener(name,cancel));
  });
  if(document.readyState==='complete')restore();else window.addEventListener('load',restore,{once:true});
 }
 document.addEventListener('click',event=>{
  const anchor=event.target.closest?.('a[href]');
  if(!anchor||!normalClick(event,anchor))return;
  const url=destination(anchor);
  if(!url||url.origin!==location.origin||url.username||url.password)return;
  if(anchor===link){
   const record=load();
   if(!record){event.preventDefault();display();return;}
   if(url.pathname===record.path){record.returningAt=Date.now();save(record);}
   return;
  }
  // A detour through several journal/shop pages must not overwrite its travel origin.
  if(pathIsTravel(location.pathname)&&(url.pathname==='/'||url.pathname==='/blog/'||url.pathname.startsWith('/blog/')||url.pathname==='/guides/'||url.pathname==='/how-we-select/'))recordDeparture(anchor);
 });
 dismiss.addEventListener('click',()=>{clear();bar.hidden=true;sizeBar();});
 if(typeof ResizeObserver==='function'){const observer=new ResizeObserver(sizeBar);observer.observe(bar);const header=document.querySelector('body > .journal-chrome, body > .site-header');if(header)observer.observe(header);}
 window.addEventListener('pageshow',()=>{if(pathIsTravel(location.pathname))arrive();display();});
 arrive();display();
})();
