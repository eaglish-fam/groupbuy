import {matchingApprovedRoutes,assessApprovedCityRoute,feasibleApprovedDates,approvedPlanParameters,approvedPlanShareUrl} from './approved-plan-model.mjs';
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const link=(url,label)=>url?`<a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${esc(label)}</a>`:'';
export const renderPlanIssues=items=>items.length?`<ul class="approved-plan-warnings">${items.map(i=>`<li>${esc(i.message)} ${link(i.url,'查官方日期與條件')}</li>`).join('')}</ul>`:'';
export function renderApprovedPlanDay(city,day,assessment,{page='' }={}){
 const places=new Map(city.places.map(p=>[p.id,p]));
 return `<article class="approved-plan-day"><h3>${esc(day.title)}</h3><p>${esc(day.description)}</p>${renderPlanIssues(assessment.blocked)}${renderPlanIssues(assessment.unknown)}${day.blocks?.length?`<ol class="approved-plan-timeline">${day.blocks.map(b=>`<li><strong>${esc(b.start)}–${esc(b.end)}</strong><div><p>${esc(b.description)}</p>${b.placeIds.map(id=>`<a href="${esc(page)}#${esc(id)}">${esc(places.get(id).title)}</a>`).join(' · ')}</div></li>`).join('')}</ol>`:`<p>${day.stops.map(id=>`<a href="${esc(page)}#${esc(id)}">${esc(places.get(id).title)}</a>`).join(' → ')}</p>`}${renderPlanIssues(assessment.reminders)}</article>`;
}

export function bindApprovedCityPlanner(doc=document,location=window.location){
 const host=doc.querySelector('[data-approved-city-planner]'),config=doc.querySelector('#approved-city-plan-data');if(!host||!config)return;
 const city=JSON.parse(config.textContent),form=host.querySelector('form'),fields=form.elements,params=approvedPlanParameters(location.href);
 let activeDay=0,invalidShare='';
 for(const[key,value]of Object.entries(params)){
  if(key==='day'){if(/^\d+$/.test(value))activeDay=Number(value);else invalidShare='連結的日期頁碼不支援，請重新選擇。';continue;}
  if(!fields.namedItem(key))continue;
  fields.namedItem(key).value=value;
  if(fields.namedItem(key).value!==value)invalidShare='連結包含不支援的選項，請重新選擇天數與步調。';
 }
 const current=()=>Object.fromEntries(['days','pace','routeId','startDate','youngestAge'].map(k=>[k,fields.namedItem(k).value]));
 function render(){
  const state=current(),matches=matchingApprovedRoutes(city,state),select=fields.namedItem('routeId');
  if(!matches.length){host.querySelector('[data-plan-error]').textContent='請改選天數或步調，查看其他路線。';host.querySelector('[data-plan-day]').innerHTML='';host.querySelector('[data-plan-days]').innerHTML='';return;}
  const chosen=matches.find(r=>r.id===state.routeId)||matches[0];
  let blockedRoutes;try{blockedRoutes=new Set(matches.filter(r=>assessApprovedCityRoute(city,r,state).some(d=>d.assessment.blocked.length)).map(r=>r.id));}catch{host.querySelector('[data-plan-error]').textContent='日期或年齡格式不正確，請重新選擇。';return;}
  // Keep the selected conflict inspectable; prevent choosing other known
  // contradictory alternatives as though they were valid replacements.
  select.innerHTML=matches.map(r=>`<option value="${esc(r.id)}"${blockedRoutes.has(r.id)&&r.id!==chosen.id?' disabled':''}>${esc(r.label)}${blockedRoutes.has(r.id)?'（條件衝突）':''}</option>`).join('');select.value=chosen.id;
  activeDay=Math.min(activeDay,chosen.days.length-1);
  try{
   const days=assessApprovedCityRoute(city,chosen,state),conflicts=days.filter(d=>d.assessment.blocked.length),unknown=days.filter(d=>d.assessment.unknown.length),tab=days[activeDay];
   host.querySelector('[data-plan-error]').textContent=invalidShare;invalidShare='';
   host.querySelector('[data-plan-summary]').textContent=`${chosen.sightseeingDays} 個完整遊玩日${state.startDate?'，從 '+state.startDate+' 開始':''}。${conflicts.length?'有 '+conflicts.length+' 天不符合公告條件，請改日或換路線。':unknown.length?'還有日期、年齡或場次需要確認。':'請依行程確認票券、天氣與場次。'}`;
   host.querySelector('[data-plan-days]').innerHTML=days.map(d=>`<button type="button" data-plan-day-index="${d.index}" aria-pressed="${d.index===activeDay}">第 ${d.index+1} 天${d.date?' · '+d.date.slice(5):''}${d.assessment.blocked.length?'（需改排）':''}</button>`).join('');
   host.querySelector('[data-plan-day]').innerHTML=renderApprovedPlanDay(city,tab,tab.assessment);
   const dates=conflicts.length?feasibleApprovedDates(city,chosen,{startDate:state.startDate,youngestAge:state.youngestAge}):[];
   const other=matches.filter(r=>r.id!==chosen.id&&assessApprovedCityRoute(city,r,state).every(d=>d.assessment.status==='within-reviewed-rules'));
   host.querySelector('[data-plan-alternatives]').innerHTML=conflicts.length?`<h3>重新選擇</h3>${dates.length?'<p>可符合目前日期與年齡規則的改日：</p>'+dates.map(date=>`<button type="button" data-plan-date="${date}">${date}</button>`).join(''):''}${other.map(r=>`<button type="button" data-plan-route="${esc(r.id)}">改用 ${esc(r.label)}</button>`).join('')}<p>請改選日期、調整活動，並向官方確認場次。</p>`:'';
  }catch{host.querySelector('[data-plan-error]').textContent='日期或年齡格式不正確，請重新選擇。';host.querySelector('[data-plan-day]').innerHTML='';host.querySelector('[data-plan-summary]').textContent='';}
 }
 form.addEventListener('submit',e=>e.preventDefault());form.addEventListener('change',()=>{activeDay=0;render();});
 host.addEventListener('click',async event=>{
  const target=event.target.closest('button');if(!target)return;
  if(target.dataset.planDayIndex!==undefined){activeDay=Number(target.dataset.planDayIndex);render();host.querySelector(`[data-plan-day-index="${activeDay}"]`)?.focus({preventScroll:true});}
  if(target.dataset.planDate){fields.namedItem('startDate').value=target.dataset.planDate;activeDay=0;render();}
  if(target.dataset.planRoute){fields.namedItem('routeId').value=target.dataset.planRoute;activeDay=0;render();}
  if(target.hasAttribute('data-plan-share')){
   const url=approvedPlanShareUrl(location.href,{...current(),day:activeDay}),status=host.querySelector('[data-plan-share-status]');
   try{await navigator.clipboard.writeText(url);status.textContent='已複製，開啟連結可保留這份選擇。';}catch{status.innerHTML=`<label>複製這個連結<input readonly value="${esc(url)}"></label>`;status.querySelector('input').select();}
  }
 });
 host.hidden=false;doc.querySelector('[data-plan-fallback]')?.setAttribute('hidden','');render();
}
if(typeof document!=='undefined')bindApprovedCityPlanner();
