import {initialState,reduceAtlas,atlasNavigation,topLevels,categoryNames,selectPlaces,selectGuides,sourceGroups,csvText,safeSourceUrl} from './atlas-model.mjs';
import {syncPlanningOffers} from './atlas-planning.mjs';
import {atlasCamera} from './atlas-globe-camera.mjs';
import {displayTimecode,reviewRelationLabels} from './atlas-review-browser.mjs';
import {createGlobeLifecycle,bindGlobePageLifecycle} from './atlas-globe-lifecycle.mjs';
import {startPhotoGrids,layoutPhotoGrids} from './photo-frame-grid.mjs';
import {photoContexts} from '../scripts/trip-photo-contexts-r22.mjs';
import {canonicalTripPhoto} from './photo-source-identity.mjs';
import {startPhotoRecovery} from './photo-error-recovery.mjs';
import {readPlan,writePlan,plannedPlaces,reducePlaceExperience,selectExperiencePlaces,planFocusIntent} from './taiwan-place-experience.mjs';
import {renderPlaceSummary,renderConsumerDetail,selectRegionalFilms,renderRegionalFilms} from './taiwan-consumer-content-r24.mjs';
startPhotoGrids();
if(document.body.classList.contains('travel-home'))startPhotoRecovery();
const config=JSON.parse(document.querySelector('#atlas-config').textContent);
const {data,catalog,regions,geometry,privateAtlas}=config;
let state=initialState(),globe=null;
const placeExperience=data.placeExperience==='r24-working'&&!privateAtlas;
let storage=null,storageAvailable=true,feedback='',lastRemoved=null,detailPlaceId=null,detailOpener=null;
if(placeExperience){try{storage=window.localStorage;}catch{}const saved=readPlan(storage,data);storageAvailable=saved.available;state={...state,category:'attraction',selectedIds:saved.ids};}
const $=selector=>document.querySelector(selector);
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const button=(label,type,id,selected=false)=>`<button type="button" data-action="${type}" data-id="${escape(id)}" aria-pressed="${selected}">${escape(label)}</button>`;
const link=(label,url)=>`<a href="${escape(url)}" rel="noopener noreferrer">${escape(label)} ↗</a>`;
function placeCard(p){
 if(placeExperience)return `<article class="place-card taiwan-place-card" data-place-id="${escape(p.id)}"><div class="taiwan-place-heading">${p.photo?`<button class="place-photo-button" type="button" data-action="place-detail" data-id="${escape(p.id)}" aria-label="查看${escape(p.name)}資訊"><img class="place-circle" src="${escape(p.photo.src)}" width="${p.photo.width}" height="${p.photo.height}" alt="${escape(p.photo.alt)}" loading="lazy" fetchpriority="low" decoding="async" style="object-position:${p.photo.position[0]}% ${p.photo.position[1]}%"></button>`:''}<div><small>${escape(categoryNames[p.category])} · ${escape(countyNames(p))}</small><h3><button class="place-name-button" type="button" data-action="place-detail" data-id="${escape(p.id)}">${escape(p.name)}</button></h3></div></div>${renderPlaceSummary(p)|| (p.tags.length?`<p class="place-tags">${escape(p.tags.join(' · '))}</p>`:'')}<div class="place-actions"><button type="button" data-action="place-detail" data-id="${escape(p.id)}">查看地點資訊</button>${button(state.selectedIds.includes(p.id)?'✓ 已加入清單':'＋ 加入旅程清單','plan',p.id,state.selectedIds.includes(p.id))}</div></article>`;
 const kind=p.recordKind==='historical_event_series'?'歷史活動紀錄':[p.category,...(p.secondaryCategories??[])].map(c=>categoryNames[c]).filter(Boolean).join(' · ');
 const rawTags=privateAtlas?.places.find(raw=>raw.id===p.id)?.tags;
 return `<article class="place-card"><small>${escape(kind)} · ${escape(p.countyIds.map(id=>data.geography.counties.find(c=>c.id===id)?.name).join(' / '))}</small><h3>${escape(p.name)}</h3>${p.tags.length?`<p>${escape(p.tags.join(' · '))}</p>`:''}${rawTags?.length?`<p><small>原始標籤：${escape(rawTags.join(' · '))}</small></p>`:''}<div class="card-links">${p.articleUrl?link('閱讀旅行紀錄',p.articleUrl):''}${p.sourceLinks.filter(url=>url!==p.articleUrl).map((url,i)=>link(p.articleUrl?'原始來源':`看實訪紀錄${p.sourceLinks.length>1?' '+(i+1):''}`,url)).join('')}</div>${button(state.selectedIds.includes(p.id)?'✓ 已放入清單':'＋ 放入旅程清單','plan',p.id,state.selectedIds.includes(p.id))}</article>`;
}
function countyNames(p){return p.countyIds.map(id=>data.geography.counties.find(c=>c.id===id)?.name).filter(Boolean).join(' / ');}
function planButton(p){return button(state.selectedIds.includes(p.id)?'✓ 已加入清單':'＋ 加入旅程清單','plan',p.id,state.selectedIds.includes(p.id));}
function detailHtml(p){
 return `<div class="place-detail-header"><p>${escape(categoryNames[p.category])}</p><button type="button" data-action="detail-close" aria-label="關閉地點資訊">關閉</button></div><h2 id="place-detail-title">${escape(p.name)}</h2>${p.photo?`<img class="detail-circle" src="${escape(p.photo.src)}" width="${p.photo.width}" height="${p.photo.height}" alt="${escape(p.photo.alt)}" style="object-position:${p.photo.position[0]}% ${p.photo.position[1]}%">`:''}${renderConsumerDetail(p)}<div class="detail-actions">${planButton(p)}<button type="button" data-action="view-plan">查看旅程清單（${state.selectedIds.length}）</button></div><p id="detail-feedback" role="status" aria-live="polite">${escape(feedback)}</p>`;
}
function updateDetail(){const p=data.places.find(p=>p.id===detailPlaceId);if(p)$('#place-detail').innerHTML=detailHtml(p);}
function openDetail(id,opener){const p=data.places.find(p=>p.id===id);if(!p)return;detailPlaceId=id;detailOpener=opener;updateDetail();$('#place-detail').showModal();}
function restoreDetailFocus(){const target=detailOpener?.isConnected?detailOpener:[...document.querySelectorAll('.taiwan-place-card [data-action="place-detail"]')].find(b=>b.dataset.id===detailOpener?.dataset.id);target?.focus({preventScroll:true});}
function closeDetail(){const d=$('#place-detail');if(d?.open)d.close();detailPlaceId=null;restoreDetailFocus();}
function showPlan(){closeDetail();if(state.top!=='taiwan')dispatch({type:'top',id:'taiwan'});const title=$('#plan-title');title.tabIndex=-1;title.scrollIntoView({block:'start',behavior:'auto'});title.focus({preventScroll:true});}
function renderPlan(){
 const planned=plannedPlaces(state.selectedIds,data),n=planned.length;
 $('#trip-list-count').textContent=`旅程清單（${n}）`;
 $('#trip-list-feedback').textContent=feedback;
 $('#plan-title').textContent=`我的台灣旅程清單（${n}）`;
 $('#plan-content').innerHTML=`<p class="place-note">${storageAvailable?'已儲存在這台裝置的瀏覽器；不會自動同步到 Google 帳戶或其他裝置。':'瀏覽器未允許儲存；目前清單僅在這次頁面開啟期間保留。'}</p>${n?`<ol class="trip-list">${planned.map((p,i)=>`<li><div class="trip-list-place"><button class="place-name-button" type="button" data-action="place-detail" data-id="${escape(p.id)}">${escape(p.name)}</button><small>${escape(countyNames(p))} · ${escape(categoryNames[p.category])}</small>${link('查看地圖',p.maps.search)}</div><div class="trip-list-actions"><button type="button" data-action="plan-up" data-id="${escape(p.id)}" aria-label="上移${escape(p.name)}" ${i===0?'disabled':''}>上移</button><button type="button" data-action="plan-down" data-id="${escape(p.id)}" aria-label="下移${escape(p.name)}" ${i===n-1?'disabled':''}>下移</button><button type="button" data-action="plan-remove" data-id="${escape(p.id)}" aria-label="移除${escape(p.name)}">移除</button></div></li>`).join('')}</ol><p>先調整想去的順序，跨縣市或跨島的交通時間再另行安排。</p>`:'<p>清單還沒有地點。從上面的景點、餐廳或飯店，選「加入旅程清單」開始。</p>'}${lastRemoved?`<button type="button" data-action="plan-undo" data-id="${escape(lastRemoved.id)}">復原移除：${escape(lastRemoved.name)}</button>`:''}`;
}
function guideCard(g){
 if(!document.body.classList.contains('travel-home')){const c=catalog.countries.find(c=>c.guideIds.includes(g.id));return `<article class="place-card"><img src="${escape(g.image.src)}" alt="${escape(g.image.alt)}" width="${g.image.width}" height="${g.image.height}" loading="lazy"><small>${escape(c?.name)}</small><h3>${escape(g.name)}</h3><p>${escape(g.summary)}</p>${link('閱讀旅行指南',g.href)}</article>`;}
 const c=catalog.countries.find(c=>c.guideIds.includes(g.id)),identity=canonicalTripPhoto(g.image.src,location.href),photo=photoContexts.find(p=>p.page==='home'&&p.sequence>=7&&p.src===identity);
 if(!photo)throw Error('Unreviewed HOME guide photo: '+g.id);
 const srcset=[640,960].filter(w=>w<g.image.width).map(w=>`${escape(g.image.src.replace('.webp',`-${w}.webp`))} ${w}w`).concat(`${escape(g.image.src)} ${g.image.width}w`).join(', ');
 return `<article class="place-card"><div class="r22-photo-frame" data-photo-frame="${photo.ratio}" data-photo-context="home:${photo.sequence}" data-photo-asset="${photo.assetIndex}" style="--photo-ratio:${photo.ratio.replace(':','/')};--photo-position:${photo.position[0]}% ${photo.position[1]}%"><img src="${escape(g.image.src)}" srcset="${srcset}" sizes="(max-width:700px) calc(50vw - 40px), 340px" alt="${escape(g.image.alt)}" width="${g.image.width}" height="${g.image.height}" loading="lazy" fetchpriority="low" decoding="async"></div><small>${escape(c?.name)}</small><h3>${escape(g.name)}</h3><p>${escape(g.summary)}</p>${link('閱讀旅行指南',g.href)}</article>`;
}
function syncGlobeStatus({phase,error}){
 const host=$('#globe-stage'),failed=phase==='failed',ready=phase==='ready';
 host.dataset.globeState=phase;host.setAttribute('aria-busy',String(phase==='loading'));
 host.querySelector('[data-globe-preview]')?.toggleAttribute('hidden',ready||failed);
 const fallback=host.querySelector('[data-globe-fallback]');
 fallback.hidden=ready;fallback.textContent=failed?'互動地球暫時無法載入；目的地與旅行紀錄仍可閱讀。':'互動地球準備中；目的地與旅行紀錄已可使用。';
 $('#globe-note').textContent=failed?fallback.textContent:ready?(state.top==='taiwan'?'點選地區放大，或看世界地圖。':'拖曳旋轉地球，或點選國家。'):fallback.textContent;
 $('#globe-note').hidden=ready&&state.top!=='taiwan';
 $('#retry-globe').hidden=!failed;$('#retry-globe').disabled=phase==='loading';
 $('#recenter-map').disabled=!ready;
 if(failed){delete host.dataset.globeReady;host.dataset.globeError=error;globe=null;}
 else delete host.dataset.globeError;
 $('#regions').hidden=state.top!=='taiwan'||ready;
}
const lifecycle=createGlobeLifecycle({
 loadModule:({attempt})=>{const url=attempt===1?'./globe.js?v=r24-20261002':`./globe.js?v=r24-20261002&retry=${attempt}`;return import(url);},
 getView:()=>atlasCamera(state,geometry.globe,catalog,regions),
 mount:(m,{signal,view})=>m.mountGlobe($('#globe-stage'),{signal,countries:catalog.countries,view,onSelect:id=>dispatch({type:'country',id}),onExplore:()=>dispatch({type:'explore'}),onRegion:id=>dispatch({type:'region',id}),onCounty:id=>dispatch({type:'county',id})}),
 onState:syncGlobeStatus,
 onError:({stage,attempt})=>console.warn('atlas-globe',{revision:config.candidateRevision||'r21',stage,attempt})
});
async function updateGlobe({force=false}={}){
 try{
  await lifecycle.ensure();
  // An interrupted, older promise must never replace the restored controller.
  globe=lifecycle.controller;
  if(globe)globe.setView(atlasCamera(state,geometry.globe,catalog,regions),{force});
  syncGlobeStatus({phase:lifecycle.phase,error:$('#globe-stage').dataset.globeError});
 }catch(error){console.warn('atlas-globe',{revision:config.candidateRevision||'r21',stage:error.stage||'camera'});}
}
function render(){
 const taiwan=state.top==='taiwan',region=data.geography.regions.find(r=>r.id===state.regionId),county=data.geography.counties.find(c=>c.id===state.countyId),country=catalog.countries.find(c=>c.id===state.countryId);
 $('#top-levels').innerHTML=topLevels.map(([id,name])=>button(name,'top',id,state.top===id)).join('');
 const navigation=atlasNavigation(state,data.geography,catalog);
 $('#breadcrumbs').innerHTML=navigation.breadcrumbs.map(c=>c.type?button(c.label,c.type,c.id):`<span aria-current="location">${escape(c.label)}</span>`).join('<span aria-hidden="true"> › </span>');
 $('#back').hidden=!navigation.backLabel;$('#back').disabled=false;$('#back').textContent='← '+(navigation.backLabel||'回台灣全覽');
 $('#world-map-entry').hidden=!navigation.showWorld;
 $('#map-heading').textContent=taiwan?(county?`${county.name}，下一站。`:region?`${region.name}，下一站。`:'台灣，下一站。'):country?`${country.name}，下一站。`:state.top==='world'?'世界，下一站。':`${topLevels.find(([id])=>id===state.top)?.[1]||'世界'}，下一站。`;
 $('#location-title').textContent=county?.name||region?.name||(taiwan?'從台灣，開始下一段旅行。':country?.name||'從世界，找到下一站。');
 $('#map-attribution').hidden=!taiwan;
 for(const node of document.querySelectorAll('[data-taiwan-only]'))node.hidden=!taiwan;
 $('#regions').hidden=!taiwan||!!globe;$('#regions').innerHTML=data.geography.regions.map(r=>button(r.name,'region',r.id,state.regionId===r.id)).join('');
 $('#counties').innerHTML=taiwan?(region?data.geography.counties.filter(c=>c.regionId===region.id).map(c=>button(c.id==='tw-lienchiang-county'?'連江縣（馬祖）':c.name,'county',c.id,state.countyId===c.id)).join(''):''):(['world','asia'].includes(state.top)?button('臺灣','country','tw'):'')+catalog.countries.filter(c=>state.top==='world'||c.region===state.top).map(c=>button(c.name,'country',c.id,state.countryId===c.id)).join('');
 $('#counties').hidden=taiwan&&!region;
 $('#globe-stage').dataset.depth=taiwan?state.taiwanDepth:'world';
 $('#globe-stage').dataset.mode=taiwan?'taiwan':'world';
 $('#drill-status').textContent=taiwan?(county?`台灣 › ${region.name} › ${county.name}`:region?`台灣 › ${region.name} · 選擇縣市`:'台灣五區 · 北部／中部／南部／東部／離島'):'世界地圖 · 可拖曳旋轉或選擇國家';
 if(placeExperience){$('#category-tabs').hidden=!taiwan;for(const b of $('#category-tabs').querySelectorAll('button'))b.setAttribute('aria-pressed',String(b.dataset.id===state.category));}else{$('#category').value=state.category;$('#category').disabled=!taiwan;}
 if($('#theme')){$('#theme-control').hidden=taiwan;$('#theme').value=state.theme;}
 if($('#query').value!==state.query)$('#query').value=state.query;
 if(privateAtlas){$('#view').value=state.view;$('#relation').value=state.relation;$('#relation-control').hidden=state.view!=='sources';}
 const places=placeExperience?selectExperiencePlaces(state,data):selectPlaces(state,data),guides=selectGuides(state,catalog);
 $('#result-count').textContent=taiwan?`${places.length} 個${categoryNames[state.category]||'地點'}`:`${guides.length} 份旅行指南`;
 if(taiwan&&privateAtlas&&state.view==='sources'){
  const groups=sourceGroups(state,privateAtlas,data).map(g=>({...g,source:{...g.source,title:g.source.title||g.source.id}}));
  $('#result-count').textContent=`${groups.length} 個原始來源`;
  $('#cards').innerHTML=groups.map(g=>`<article class="source-card"><small>${escape(g.source.platform)} · 依同一來源定位排序</small><h3>${escape(g.source.title)}</h3>${safeSourceUrl(g.source.canonicalUrl)?link('打開原始來源',safeSourceUrl(g.source.canonicalUrl)):''}<ol>${g.occurrences.map(o=>{const p=data.places.find(p=>p.id===o.placeId),sec=o.evidence.find(e=>e.timecode)?.timecode.startSeconds,u=safeSourceUrl(g.source.canonicalUrl);const jump=u&&Number.isFinite(sec)&&g.source.platform==='youtube'?u+(u.includes('?')?'&':'?')+'t='+sec+'s':null;return `<li><strong>${escape(p?.name)}</strong> · ${escape(reviewRelationLabels[o.relation]??'關係待核')}${jump?' · '+link(displayTimecode(sec),jump):' · 沒有時碼'}<p>${escape(o.evidence.map(e=>e.excerpt).filter(Boolean).join(' / '))}</p></li>`;}).join('')}</ol></article>`).join('')||'<p class="empty">此篩選沒有來源紀錄。</p>';
 }else {
  const page=state.expandedResults? (taiwan?places:guides) : (taiwan?places:guides).slice(0,6);
  $('#cards').innerHTML=page.map(taiwan?placeCard:guideCard).join('')||'<p class="empty">這裡的旅行紀錄正在整理中，先看看其他地區。</p>';
  const more=$('#more-records');if(more){more.hidden=state.expandedResults||(taiwan?places:guides).length<=6;more.textContent=`展開全部 ${taiwan?places.length+' 個實訪地點':guides.length+' 份旅行指南'}`;}
 }
 if(taiwan){delete $('#cards').dataset.photoGrid;delete $('#cards').dataset.photoLayout;$('#cards').style.height='';if(placeExperience)$('#cards').dataset.placeGrid='taiwan';}
 else if(document.body.classList.contains('travel-home')){$('#cards').dataset.photoGrid='guides';layoutPhotoGrids();}
 if(!taiwan)delete $('#cards').dataset.placeGrid;
 const planned=places.filter(p=>state.selectedIds.includes(p.id));
 if(placeExperience&&taiwan)renderPlan();
 else{
 $('#plan-title').textContent=taiwan?`${county?.name||region?.name||'台灣'} · 旅程清單`:`${country?.name||topLevels.find(([id])=>id===state.top)[1]} · 安排旅程`;
 $('#plan-content').innerHTML=taiwan?(planned.length?'<ul>'+planned.map(p=>`<li>${escape(p.name)}</li>`).join('')+'</ul><p>把想去的地點放在一起，再安排交通與停留時間。</p>':'<p>把想去的地點放在一起，再安排交通與停留時間。</p>'):(country?link(`到${country.name}安排旅程`,country.href):'<p>先選目的地，再前往當地旅行指南安排。</p>');
 }
 if(placeExperience){$('#trip-list-count').textContent=`旅程清單（${state.selectedIds.length}）`;$('#trip-list-feedback').textContent=feedback;}
 for(const panel of document.querySelectorAll('[data-country-panel]'))panel.hidden=taiwan||panel.dataset.countryPanel!==state.countryId;
 const filmSection=$('#regional-films'),filmContent=$('#regional-film-content');
 if(filmSection&&filmContent){
  const films=selectRegionalFilms(state,data),ids=films.map(f=>f.videoId).join(',');filmSection.hidden=!films.length;
  // Keep native chapter disclosure/focus intact across unrelated list/category actions.
  if(filmContent.dataset.filmIds!==ids){filmContent.innerHTML=renderRegionalFilms(films);filmContent.dataset.filmIds=ids;}
 }
 syncPlanningOffers(document,state,catalog);
 updateGlobe();
}
function restoreListFocus(context){
 const intent=planFocusIntent(context.type,context.id,context.beforeIds,state.selectedIds),scope=$('#plan-content');
 const controls=[...scope.querySelectorAll('[data-action]')].filter(n=>!n.disabled&&!n.closest('[hidden]'));
 const target=intent?.actions?.map(type=>controls.find(n=>n.dataset.id===intent.id&&n.dataset.action===type)).find(Boolean);
 const title=$('#plan-title');if(!target)title.tabIndex=-1;
 const destination=target||title;destination.focus({preventScroll:true});destination.scrollIntoView({block:'nearest',behavior:'auto'});
}
function dispatch(action,origin=document.activeElement){
 const active=origin,focusAction=active?.dataset.action,focusId=active?.dataset.id;
 const listOrigin=placeExperience&&action.type.startsWith('plan')&&active?.closest('#plan-content')?{type:action.type,id:action.id,beforeIds:[...state.selectedIds]}:null;
 if(placeExperience&&action.type.startsWith('plan')){
  const p=data.places.find(p=>p.id===action.id);if(!p)return;
  const wasSelected=state.selectedIds.includes(p.id);
  if(action.type==='plan-undo'){action={type:'plan',id:p.id};lastRemoved=null;}
  else if(action.type==='plan-remove'||action.type==='plan'&&wasSelected)lastRemoved={id:p.id,name:p.name};
  else if(action.type==='plan'&&!wasSelected)lastRemoved=null;
  feedback=action.type==='plan-up'||action.type==='plan-down'?`已調整${p.name}的順序。`:(action.type==='plan-remove'||action.type==='plan'&&wasSelected)?`已從旅程清單移除${p.name}。`:`已加入${p.name}。可按「旅程清單」查看。`;
 }
 state={...(placeExperience?reducePlaceExperience(state,action,data.geography,catalog,data):reduceAtlas(state,action,data.geography,catalog)),expandedResults:action.type.startsWith('plan')?state.expandedResults:false};
 if(placeExperience&&action.type.startsWith('plan'))storageAvailable=writePlan(storage,state.selectedIds,data);
 render();if(detailPlaceId)updateDetail();
 if(action.type==='back'){(!$('#back').hidden?$('#back'):$('#world-map-entry').hidden?$('#breadcrumbs button'):$('#world-map-entry'))?.focus({preventScroll:true});return;}
 if(listOrigin){restoreListFocus(listOrigin);return;}
 if(focusAction){const scope=$('#place-detail')?.open?$('#place-detail'):document,choices=[...scope.querySelectorAll('[data-action]')].filter(n=>!n.disabled&&!n.closest('[hidden]'));const target=choices.find(n=>n.dataset.action===focusAction&&n.dataset.id===focusId)||choices.find(n=>n.dataset.id===focusId&&n.dataset.action.startsWith('plan'));(target||scope.querySelector?.('[data-action="detail-close"]')||(!$('#back').hidden?$('#back'):$('#breadcrumbs button')))?.focus({preventScroll:true});}
}
document.addEventListener('click',event=>{const b=event.target.closest('[data-action]');if(b){if(b.dataset.action==='place-detail'){openDetail(b.dataset.id,b);return;}if(b.dataset.action==='detail-close'){closeDetail();return;}if(b.dataset.action==='view-plan'){showPlan();return;}dispatch({type:b.dataset.action,id:b.dataset.id},b);}const path=event.target.closest('[data-map-county]');if(path)dispatch(state.regionId?{type:'county',id:path.dataset.mapCounty}:{type:'region',id:path.dataset.region});const countryLink=event.target.closest('[data-explore-country]');if(countryLink){event.preventDefault();dispatch({type:'country',id:countryLink.dataset.exploreCountry});$('#records-title').scrollIntoView({block:'start',behavior:'auto'});}});
document.addEventListener('keydown',event=>{if(['Enter',' '].includes(event.key)&&event.target.matches('[data-map-county]')){event.preventDefault();dispatch(state.regionId?{type:'county',id:event.target.dataset.mapCounty}:{type:'region',id:event.target.dataset.region});}});
$('#back').addEventListener('click',()=>dispatch({type:'back'}));
$('#recenter-map').addEventListener('click',()=>globe?.recenter());
$('#retry-globe').addEventListener('click',async()=>{await lifecycle.retry();globe=lifecycle.controller;});
$('#more-records')?.addEventListener('click',()=>{state={...state,expandedResults:true};render();});
bindGlobePageLifecycle(lifecycle,window,()=>updateGlobe({force:true}));
$('#category')?.addEventListener('change',e=>dispatch({type:'category',id:e.target.value}));
$('#place-detail')?.addEventListener('close',()=>{detailPlaceId=null;restoreDetailFocus();});
 $('#theme')?.addEventListener('change',e=>dispatch({type:'theme',id:e.target.value}));
$('#query').addEventListener('input',e=>dispatch({type:'query',value:e.target.value}));
if(privateAtlas){$('#view').addEventListener('change',e=>dispatch({type:'view',id:e.target.value}));$('#relation').addEventListener('change',e=>dispatch({type:'relation',id:e.target.value}));$('#csv').addEventListener('click',()=>{const blob=new Blob([csvText(selectPlaces(state,data))],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='taiwan-filtered-places.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});}
render();
document.documentElement.dataset.atlasController='ready';
document.dispatchEvent(new Event('atlas:controller-ready'));
$('#direct-destinations')?.removeAttribute('open');
