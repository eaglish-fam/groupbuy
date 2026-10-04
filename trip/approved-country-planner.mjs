import {countryPlanWithRules,approvedPlanParameters,approvedPlanShareUrl} from './approved-plan-model.mjs';
import {renderApprovedPlanDay} from './approved-city-planner.mjs';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reasons={'unsupported-route':'請改選目的地組合，或開啟各城市攻略。','unsupported-days':'請選表單內支援的天數。','unsupported-pace':'請選擇支援的步調。','local-start-date-required':'請先選擇出發日期。','outside-reviewed-route-dates':'日期超出這條路線的公告涵蓋期間，請先查官方日期。','insufficient-days':'請增加天數，為抵達、移動與離境保留時間。'};
export function bindApprovedCountryPlanner(doc=document,location=window.location){
 const host=doc.querySelector('[data-country-planner]'),raw=doc.querySelector('#approved-country-plan-data');if(!host||!raw)return;
 const {country,cities}=JSON.parse(raw.textContent),form=host.querySelector('form'),f=form.elements,result=host.querySelector('[data-country-plan-result]'),status=host.querySelector('[data-country-plan-status]');
 const params=approvedPlanParameters(location.href);let activeDay=0;
 for(const[k,v]of Object.entries(params)){if(k==='day'){if(/^\d+$/.test(v))activeDay=Number(v);}else if(f.namedItem(k))f.namedItem(k).value=v;}
 const get=()=>({routeId:f.namedItem('routeId').value,days:Number(f.namedItem('days').value),pace:f.namedItem('pace').value,startDate:f.namedItem('startDate').value,youngestAge:f.namedItem('youngestAge').value});
 const checked=()=>[...form.querySelectorAll('[data-country-destination]')].filter(e=>e.checked).map(e=>e.value);
 const same=(a,b)=>a.length===b.length&&a.every(x=>b.includes(x));
 const applyRoute=id=>{const route=country.allocation.routes.find(r=>r.id===id);if(!route)return;f.namedItem('routeId').value=id;form.querySelectorAll('[data-country-destination]').forEach(e=>e.checked=route.cityIds.includes(e.value));};
 applyRoute(f.namedItem('routeId').value);
 function render(){
  const args=get(),selected=checked(),route=country.allocation.routes.find(r=>r.id===args.routeId);
  if(!route||!same(route.cityIds,selected)){status.textContent=reasons['unsupported-route'];result.innerHTML='';return;}
  let plan;try{plan=countryPlanWithRules(country,cities,args);}catch{status.textContent='請確認日期、天數與同行最小年齡。';result.innerHTML='';return;}
  if(!plan.valid){status.textContent=reasons[plan.reason]+(plan.needed?` 至少需要 ${plan.needed} 天。`:'');result.innerHTML=plan.reason==='outside-reviewed-route-dates'?`<details open><summary>查活動官方日期</summary><ul>${route.cityIds.flatMap(id=>{const city=cities.find(c=>c.id===id);return city.planner.rules.map(r=>`<li><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(city.places.find(p=>p.id===r.placeId)?.title||city.name)}</a></li>`);}).join('')}</ul></details>`:'';return;}
  activeDay=Math.min(activeDay,plan.days.length-1);
  const conflicts=plan.days.filter(d=>d.assessment?.blocked.length),unknown=plan.days.filter(d=>d.unsupported||d.assessment?.unknown.length);
  status.textContent=`${route.label} · ${args.days} 天 · ${args.startDate} 至 ${plan.endDate}。${conflicts.length?`${conflicts.length} 天有條件衝突，不能照此方案安排。`:unknown.length?`${unknown.length} 天仍需確認官方日期、場次或條件。`:'請依行程確認預約、交通與天氣。'}`;
  const day=plan.days[activeDay],city=day.city,labels={arrival:'抵達與休息',departure:'離境與交通',transfer:`移動日：${cities.find(c=>c.id===day.from)?.name||''} → ${cities.find(c=>c.id===day.to)?.name||''}`};
  const body=day.kind==='stay'?day.unsupported?`<h3>${esc(city.name)}</h3><p>請改選停留天數或步調，或開啟城市攻略調整活動。</p><a href="${esc(city.path)}#plan">看城市行程</a>`:day.flexible?`<h3>${esc(city.name)} · 彈性休息日</h3><p>這天留作休息與天氣調整。</p><a href="${esc(city.path)}#plan">看城市行程</a>`:renderApprovedPlanDay(city,day.day,day.assessment,{page:city.path}):`<h3>${esc(labels[day.kind])}</h3><p>這一天保留給交通、緩衝與休息。請向交通業者確認班次。</p>`;
  result.innerHTML=`<nav class="approved-plan-tabs" aria-label="選擇單日">${plan.days.map((d,i)=>`<button type="button" data-country-day="${i}" aria-pressed="${i===activeDay}">第 ${i+1} 天${d.assessment?.blocked.length?' ⚠':''}</button>`).join('')}</nav><p>第 ${activeDay+1} 天 · ${esc(day.date)}</p>${body}${conflicts.length?'<p>請調整目的地或日期，並確認活動的旅客年齡要求。</p>':''}`;
  // Other routes stay visible but known impossible combinations are disabled.
  for(const option of f.namedItem('routeId').options){const r=country.allocation.routes.find(r=>r.id===option.value);if(r.id===route.id){option.disabled=false;continue;}const p=countryPlanWithRules(country,cities,{...args,routeId:r.id});option.disabled=!p.valid||p.days.some(d=>d.assessment?.blocked.length);}
 }
 form.addEventListener('submit',e=>{e.preventDefault();activeDay=0;render();});
 form.addEventListener('change',e=>{if(e.target.name==='routeId')applyRoute(e.target.value);if(e.target.hasAttribute('data-country-destination')){const route=country.allocation.routes.find(r=>same(r.cityIds,checked()));if(route)f.namedItem('routeId').value=route.id;}activeDay=0;render();});
 doc.addEventListener('approved:country-preset',e=>{applyRoute(e.detail.routeId);activeDay=0;render();});
 host.addEventListener('click',async e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.countryDay!==undefined){activeDay=Number(b.dataset.countryDay);render();result.querySelector(`[data-country-day="${activeDay}"]`)?.focus({preventScroll:true});}if(b.hasAttribute('data-country-share')){const url=approvedPlanShareUrl(location.href,{...get(),day:activeDay}),s=host.querySelector('[data-country-share-status]');try{await navigator.clipboard.writeText(url);s.textContent='已複製行程連結。';}catch{s.innerHTML=`<label>複製連結<input readonly value="${esc(url)}"></label>`;s.querySelector('input').select();}}});
 host.hidden=false;doc.querySelector('[data-country-plan-fallback]').hidden=true;render();
}
if(typeof document!=='undefined')bindApprovedCountryPlanner();
