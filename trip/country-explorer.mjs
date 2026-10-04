/** Progressive enhancement only. Country planners/calendars belong to the caller. */
export function initApprovedCountryExplorer(root) {
  if(!root||root.dataset.countryExplorerReady==='true') return ()=>{};
  root.dataset.countryExplorerReady='true';
  const q=s=>root.querySelector(s), all=s=>[...root.querySelectorAll(s)];
  const panels=all('[data-country-panel]'), cards=all('[data-country-place-city]');
  const citySelect=q('[data-country-filter-city]'), more=q('[data-country-more]');
  let theme='all', city='all', limit=6;
  // Explicit modality avoids WebKit's programmatic :focus-visible heuristic.
  root.dataset.countryFocusMode='keyboard';
  function onPointer(){root.dataset.countryFocusMode='pointer';}
  function onKey(event){if(['Tab','Enter',' '].includes(event.key))root.dataset.countryFocusMode='keyboard';}
  function filter() {
    const matching=cards.filter(card=>(city==='all'||card.dataset.countryPlaceCity===city)&&(theme==='all'||card.dataset.countryPlaceThemes.split(' ').includes(theme)));
    cards.forEach(card=>{card.hidden=!matching.includes(card)||matching.indexOf(card)>=limit;});
    const shown=Math.min(limit,matching.length);
    if(q('[data-country-count]')) q('[data-country-count]').textContent=`找到 ${matching.length} 個景點，顯示 ${shown} 個`;
    if(q('[data-country-empty]')) q('[data-country-empty]').hidden=matching.length!==0;
    if(more) {more.hidden=shown>=matching.length;more.textContent=`再看 ${Math.min(6,matching.length-shown)} 個景點`;}
    all('[data-country-theme]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.countryTheme===theme)));
    if(citySelect) citySelect.value=city;
  }
  function switchCity(value,{focus=false}={}) {
    const panel=panels.find(p=>p.dataset.countryPanel===value);
    if(!panel) return false;
    panels.forEach(p=>{p.hidden=p!==panel;});
    all('[data-country-city]').forEach(control=>{
      if(control.dataset.countryCity===value) control.setAttribute('aria-current','true'); else control.removeAttribute('aria-current');
    });
    const title=panel.querySelector('h2');
    if(q('[data-country-city-status]')) q('[data-country-city-status]').textContent='顯示'+(title?.textContent||'旅行總覽');
    if(focus&&title) {
      title.setAttribute('tabindex','-1');title.focus({preventScroll:true});
      if(root.dataset.countryFocusMode==='keyboard')title.scrollIntoView?.({block:'nearest',behavior:'auto'});
    }
    return true;
  }
  function onClick(event) {
    const target=event.target.closest('a,button');
    if(!target||!root.contains(target)||event.button>0||event.metaKey||event.ctrlKey||event.altKey||event.shiftKey) return;
    if(target.hasAttribute('data-country-city')) {
      if(event.detail>0)onPointer();
      if(switchCity(target.dataset.countryCity,{focus:true})) event.preventDefault();
    } else if(target.hasAttribute('data-country-explore-city')) {
      city=target.dataset.countryExploreCity;theme='all';limit=6;filter();
    } else if(target.hasAttribute('data-country-theme')) {
      theme=target.dataset.countryTheme;limit=6;filter();
    } else if(target.hasAttribute('data-country-more')) {
      const firstNew=cards.filter(c=>c.hidden&&(city==='all'||c.dataset.countryPlaceCity===city)&&(theme==='all'||c.dataset.countryPlaceThemes.split(' ').includes(theme)))[0];
      limit+=6;filter();firstNew?.focus({preventScroll:true});
    } else if(target.hasAttribute('data-country-reset')) {
      city='all';theme='all';limit=6;filter();q('[data-country-theme]')?.focus();
    } else if(target.hasAttribute('data-country-preset')) {
      // Do not modify forms or claim the parent planner has handled this event.
      const CustomEventCtor=root.ownerDocument.defaultView.CustomEvent;
      root.dispatchEvent(new CustomEventCtor('approved:country-preset',{bubbles:true,detail:{routeId:target.dataset.countryPreset}}));
    }
  }
  function onChange(event) {if(event.target===citySelect) {city=citySelect.value;limit=6;filter();}}
  const win=root.ownerDocument.defaultView;
  function fromHash() {
    const match=/^#(?:city-|country-)([a-z0-9-]+)$/.exec(win.location.hash);
    if(match) switchCity(match[1]);
  }
  q('[data-country-filters]')?.removeAttribute('hidden');
  switchCity('all');fromHash();filter();
  root.addEventListener('click',onClick);root.addEventListener('change',onChange);win.addEventListener('hashchange',fromHash);
  root.addEventListener('pointerdown',onPointer);root.addEventListener('touchstart',onPointer,{passive:true});root.addEventListener('keydown',onKey);
  return ()=>{root.removeEventListener('click',onClick);root.removeEventListener('change',onChange);root.removeEventListener('pointerdown',onPointer);root.removeEventListener('touchstart',onPointer);root.removeEventListener('keydown',onKey);win.removeEventListener('hashchange',fromHash);delete root.dataset.countryExplorerReady;delete root.dataset.countryFocusMode;panels.forEach(p=>p.hidden=false);cards.forEach(c=>c.hidden=false);q('[data-country-filters]')?.setAttribute('hidden','');if(more)more.hidden=true;};
}
export function initApprovedCountryExplorers(documentRoot=globalThis.document) {
  return [...documentRoot.querySelectorAll('[data-approved-country]')].map(initApprovedCountryExplorer);
}
if(typeof document!=='undefined') {
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>initApprovedCountryExplorers(),{once:true});
  else initApprovedCountryExplorers();
}
