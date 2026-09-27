import {cities,allocateTrip,stateFromHash,shareHash} from './thailand-model.mjs';
const root=document.querySelector('.th-hub');
if(root){
 const cityPanels=[...root.querySelectorAll('[data-city-panel]')];
 function chooseCity(id,updateHash=true){
  if(!['all',...cities.map(c=>c.id)].includes(id))id='all';
  cityPanels.forEach(p=>p.hidden=p.dataset.cityPanel!==id);
  root.querySelectorAll('[data-city]').forEach(a=>{if(a.dataset.city===id)a.setAttribute('aria-current','true');else a.removeAttribute('aria-current');});
  root.querySelector('#th-city-status').textContent=id==='all'?`顯示${root.querySelector('.th-tabs [data-city="all"]').textContent.trim()}`:`已切換至${cities.find(c=>c.id===id).name}，照片與攻略在地圖旁或下方。`;
  if(updateHash)history.replaceState(null,'',`#city-${id}`);
 }
 root.querySelectorAll('[data-city]').forEach(a=>a.addEventListener('click',e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();chooseCity(a.dataset.city);if(matchMedia('(max-width:760px)').matches&&!a.closest('.th-tabs')){root.querySelector(`.th-tabs [data-city="${a.dataset.city}"]`)?.focus({preventScroll:true});root.querySelector('.th-explorer').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});}}));
 chooseCity(location.hash.startsWith('#city-')?location.hash.slice(6):'all',false);
 let theme='all',limit=6;
 const filter=root.querySelector('#th-filter-city'),cards=[...root.querySelectorAll('[data-place-city]')],more=root.querySelector('.th-more');
 root.querySelector('.th-filters').hidden=false;
 function filterPlaces(){
  const matches=cards.filter(c=>(theme==='all'||c.dataset.themeId===theme)&&(filter.value==='all'||c.dataset.placeCity===filter.value));
  cards.forEach(c=>c.hidden=!matches.slice(0,limit).includes(c));
  root.querySelector('#th-count').textContent=matches.length?`找到 ${matches.length} 個景點${matches.length>limit?`，先看 ${limit} 個`:''}`:'這個組合還沒有景點，試試其他玩法或城市。';
  more.hidden=matches.length<=limit;
  more.textContent=`再看 ${Math.min(6,matches.length-limit)} 個景點 ↓`;
 }
 root.querySelectorAll('[data-theme]').forEach(b=>b.addEventListener('click',()=>{theme=b.dataset.theme;limit=6;root.querySelectorAll('[data-theme]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));filterPlaces();}));
 filter.addEventListener('change',()=>{limit=6;filterPlaces();});
 more.addEventListener('click',()=>{const before=cards.filter(c=>!c.hidden);limit+=6;filterPlaces();const firstNew=cards.find(c=>!c.hidden&&!before.includes(c));firstNew?.focus({preventScroll:true});});
 root.querySelectorAll('[data-explore-city]').forEach(a=>a.addEventListener('click',()=>{filter.value=a.dataset.exploreCity;theme='all';limit=6;root.querySelectorAll('[data-theme]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.theme==='all')));filterPlaces();}));
 filterPlaces();
 const form=root.querySelector('#th-plan-form'),result=root.querySelector('.th-plan-result');
 const getState=()=>({selected:[...form.querySelectorAll('[name=city]:checked')].map(i=>i.value),first:form.elements.first.value,days:Number(form.elements.days.value),pace:form.elements.pace.value});
 const city=id=>cities.find(c=>c.id===id);
 function drawPlan(){
  const state=getState(),old=state.first;
  form.elements.first.replaceChildren(...cities.filter(c=>state.selected.includes(c.id)).map(c=>new Option(c.name,c.id)));
  form.elements.first.disabled=!state.selected.length;
  if(state.selected.includes(old))form.elements.first.value=old;
  const plan=allocateTrip(getState());
  if(!plan.valid){result.innerHTML=`<h3>調整一下，就能出發</h3><p>${plan.message}</p>`;return;}
  result.innerHTML=`<h3>${plan.days} 天・${plan.stops.map(s=>city(s.id).name).join(' → ')}</h3><p>${plan.usable} 個完整遊玩日・${plan.pace==='relaxed'?'悠閒':'緊湊'}步調</p><ol class="th-trip-line"><li><small>DAY 1</small><b>抵達${city(plan.first).name}・入住</b></li>${plan.stops.map(s=>`<li><small>DAY ${s.start}${s.end!==s.start?`–${s.end}`:''}</small><b>${city(s.id).name}・${s.count} 個完整遊玩日</b><span>${city(s.id).tag}</span><br><a href="${city(s.id).guide}#plan">到${city(s.id).name}安排每天玩法 ↗</a></li>${s.next?`<li class="th-transfer"><small>DAY ${s.transferDay}</small><b>${city(s.id).name} → ${city(s.next).name}</b><span>${[s.id,s.next].includes('bangkok')?'安排國內線或其他城際交通，預留退房、機場與入住時間。':'安排泰北城際交通，預留退房、移動與入住時間。'}</span></li>`:''}`).join('')}<li><small>DAY ${plan.days}</small><b>離開${city(plan.stops.at(-1).id).name}・返程</b></li></ol>`;
 }
 function setPlan(state){
  form.querySelectorAll('[name=city]').forEach(i=>i.checked=state.selected.includes(i.value));
  form.elements.days.value=String(state.days);form.elements.pace.value=state.pace;
  form.elements.first.replaceChildren(...cities.filter(c=>state.selected.includes(c.id)).map(c=>new Option(c.name,c.id)));
  form.elements.first.value=state.first||state.selected[0]||'';drawPlan();
 }
 form.addEventListener('submit',e=>e.preventDefault());
 form.addEventListener('change',()=>{drawPlan();root.querySelector('.th-share').textContent='複製旅程連結 ↗';});
 root.querySelector('.th-planner').hidden=false;root.querySelector('.th-plan-fallback').hidden=true;
 setPlan(stateFromHash(location.hash));
 root.querySelectorAll('[data-preset]').forEach(a=>a.addEventListener('click',()=>{const id=a.dataset.preset;setPlan({selected:id==='bangkok'?['bangkok']:id==='north'?['chiang-mai','chiang-rai']:cities.map(c=>c.id),days:id==='bangkok'?5:id==='north'?7:10,pace:'relaxed'});}));
 root.querySelector('.th-share').addEventListener('click',async e=>{
  const button=e.currentTarget;
  const url=new URL(location.href);url.hash=shareHash(getState());
  try{await navigator.clipboard.writeText(url.href);button.textContent='連結已複製 ✓';root.querySelector('#th-share-status').textContent='旅程連結已複製，可貼給旅伴。';}
  catch{root.querySelector('#th-share-status').textContent='請複製下方的旅程連結。';let field=root.querySelector('.th-share-fallback');if(!field){field=document.createElement('input');field.className='th-share-fallback';field.setAttribute('aria-label','旅程分享連結');field.readOnly=true;form.append(field);}field.value=url.href;field.focus();field.select();}
 });
 window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#city-'))chooseCity(location.hash.slice(6),false);else if(location.hash.includes('cities=')){setPlan(stateFromHash(location.hash));root.querySelector('#plan').scrollIntoView({behavior:'instant'});}});
 if(location.hash.includes('cities='))requestAnimationFrame(()=>root.querySelector('#plan').scrollIntoView({behavior:'instant'}));
}
