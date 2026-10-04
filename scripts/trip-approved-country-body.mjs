import {validateApprovedTravelPackage, publicUrl, focalPoint, id, text} from '../trip/approved-travel-contract.mjs';
import {approvedParagraphs,approvedInlineText} from './trip-approved-text.mjs';
import {renderTravelEntryActions} from './trip-travel-entry.mjs';

export const escapeCountry = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const esc = escapeCountry;
const link = (url, label, attrs='') => `<a href="${esc(publicUrl(url))}"${attrs}>${esc(label)}</a>`;
export function countryPicture(asset, {sizes='(max-width:760px) 90vw, 520px', focal, priority=false,card=false}={}) {
  if((card||focal)&&asset.cardPhoto)asset={...asset,...asset.cardPhoto};
  const src=asset.variants.find(v=>v.width===960)||asset.variants.at(-1);
  const position=focalPoint(focal||asset.focalPoint);
  return `<img data-asset-id="${esc(asset.assetId)}" src="${esc(src.url)}" srcset="${esc(asset.variants.map(v=>`${v.url} ${v.width}w`).join(', '))}" sizes="${esc(sizes)}" width="${asset.width}" height="${asset.height}" alt="${esc(asset.alt)}" style="--photo-ratio:${asset.width}/${asset.height};object-position:${position[0]}% ${position[1]}%" loading="${priority?'eager':'lazy'}" fetchpriority="${priority?'high':'low'}" decoding="async">`;
}
function presentationFor(country, cities) {
  const p=country.presentation||{};
  for(const key of ['overviewTitle','overviewText']) if(p[key]!==undefined) text(p[key]);
  const summaries=new Map(), themes=new Map(), placeThemes=new Map();
  for(const s of p.citySummaries||[]) {
    if(!cities.some(c=>c.id===s.cityId)||summaries.has(s.cityId)) throw Error('Invalid country city summary');
    for(const key of ['tag','pace','intro']) if(s[key]!==undefined) text(s[key]);
    summaries.set(s.cityId,s);
  }
  for(const theme of p.themes||[]) {
    id(theme.id);text(theme.label);
    if(theme.id==='all'||themes.has(theme.id)) throw Error('Reserved or duplicate country theme');
    themes.set(theme.id, theme);
  }
  for(const entry of p.placeThemes||[]) {
    const city=cities.find(c=>c.id===entry.cityId);
    if(!city?.places.some(place=>place.id===entry.placeId)||!Array.isArray(entry.themeIds)||entry.themeIds.some(t=>!themes.has(t))) throw Error('Unresolved country place theme');
    const key=entry.cityId+':'+entry.placeId;
    if(placeThemes.has(key)||new Set(entry.themeIds).size!==entry.themeIds.length) throw Error('Duplicate country place theme');
    placeThemes.set(key,entry.themeIds);
  }
  return {p,summaries,themes,placeThemes};
}

/** mapHtml is a trusted, parent-rendered HTML slot; data fields are always escaped. */
export function renderApprovedCountryBody(data,countryId,{mapHtml=''}={}) {
  const view=validateApprovedTravelPackage(data), country=view.countries.get(countryId);
  if(!country) throw Error('Unknown approved country');
  if(country.intro.length!==2) throw Error('Country requires exactly two supplied leads');
  if(typeof mapHtml!=='string') throw Error('mapHtml must be parent-rendered HTML');
  const cities=country.cityIds.map(cid=>view.cities.get(cid));
  const {p,summaries,themes,placeThemes}=presentationFor(country,cities);
  const summary=city=>summaries.get(city.id)||{};
  const cards=cities.flatMap(city=>city.cards.map(card=>({city,card,place:city.places.find(p=>p.id===card.target),themes:placeThemes.get(city.id+':'+card.target)||[]})));
  const usedThemeIds=new Set(cards.flatMap(c=>c.themes));
  const usableThemes=[...themes.values()].filter(t=>usedThemeIds.has(t.id));
  // A selector that cannot narrow anything adds no useful action.
  const showThemes=usableThemes.some(t=>cards.some(c=>!c.themes.includes(t.id)));
  const showCities=cities.length>1;
  const countryLead=cities.find(city=>city.hero.includes(country.image))||cities[0];
  const photoRefs=cities.length===1?cities[0].hero.map(assetId=>({city:cities[0],assetId})):
    [{city:countryLead,assetId:country.image},...cities.filter(city=>city!==countryLead).map(city=>({city,assetId:city.hero[0]})),...countryLead.hero.slice(1).map(assetId=>({city:countryLead,assetId}))].slice(0,3);
  // Source ratios control each frame; the image fills its frame without crops or bands.
  const overviewPhotos=`<div class="th-photo-trio">${photoRefs.map(({city,assetId},index)=>{const asset=view.assets.get(assetId);return `<figure style="--photo-ratio:${asset.width}/${asset.height}"><a href="${esc(showCities?'#city-'+city.id:city.path)}"${showCities?` data-country-city="${esc(city.id)}"`:''}>${countryPicture(asset,{sizes:'(max-width:760px) 28vw, 180px',priority:index===0})}</a><figcaption>${esc(asset.caption)}</figcaption></figure>`;}).join('')}</div>`;
  const cityLinks=cities.map(city=>link(city.path+'#plan',city.name+'行程規劃')).join('');
  const tabs=showCities?`<nav class="th-tabs" aria-label="選擇目的地"><a href="#city-all" data-country-city="all" aria-current="true">旅行總覽</a>${cities.map(city=>link('#city-'+city.id,city.name,` data-country-city="${esc(city.id)}"`)).join('')}</nav>`:'';
  const cityActions=city=>renderTravelEntryActions({href:city.path,label:'看'+city.name+'攻略'},{href:'#experiences',label:'挑'+city.name+'景點',data:{'data-country-explore-city':city.id}},{className:'th-panel-actions'});
  const overview=`<section id="city-all" class="th-city-panel th-overview" data-country-panel="all">${overviewPhotos}<div class="th-panel-copy"><h2>${esc(p.overviewTitle||country.name+'旅行總覽')}</h2><p>${esc(p.overviewText||country.description)}</p>${(p.destinationNotes||[]).map(c=>`<div class="th-destination-note"><h3>${esc(c.title)}</h3>${approvedParagraphs(c.paragraphs)}${c.links.map(l=>link(l.url,l.label,' class="th-text-link"')).join('')}</div>`).join('')}${showCities?link('#experiences','看圖挑玩法',' class="th-text-link"'):cityActions(cities[0])}</div></section>`;
  const panels=showCities?cities.map(city=>{const asset=view.assets.get(city.hero[0]),s=summary(city);return `<article id="city-${esc(city.id)}" class="th-city-panel" data-country-panel="${esc(city.id)}"><figure class="th-city-photo">${countryPicture(asset)}<figcaption>${esc(asset.caption)}</figcaption></figure><div class="th-panel-copy"><p lang="en">${esc(city.englishName)}</p><h2>${esc(city.name)}</h2><p>${esc(s.intro||city.description)}</p>${cityActions(city)}</div></article>`;}).join(''):'';
  const compare=showCities?`<section class="th-compare" aria-label="目的地玩法比較">${cities.map(city=>{const s=summary(city);return `<a href="${esc(city.path)}"><div><h2>${esc(city.name)} <small lang="en">${esc(city.englishName)}</small></h2><p>${esc(s.intro||city.description)}</p>${s.pace?`<span>${esc(s.pace)}</span>`:''}</div></a>`;}).join('')}</section>`:'';
  const filters=showThemes||showCities?`<div class="th-filters" data-country-filters hidden>${showThemes?`<div class="th-chips" role="group" aria-label="篩選玩法"><button type="button" data-country-theme="all" aria-pressed="true">全部玩法</button>${usableThemes.map(theme=>`<button type="button" data-country-theme="${esc(theme.id)}" aria-pressed="false">${esc(theme.label)}</button>`).join('')}</div>`:''}${showCities?`<label class="th-city-filter">目的地 <select data-country-filter-city><option value="all">全部目的地</option>${cities.map(city=>`<option value="${esc(city.id)}">${esc(city.name)}</option>`).join('')}</select></label>`:''}</div>`:'';
  const experiences=`<section class="th-section" id="experiences"><div class="th-section-heading"><h2>${esc(p.experienceTitle||'這趟，你想玩什麼？')}</h2></div>${approvedParagraphs(p.experienceParagraphs||[])}${filters}<p class="th-result-count" data-country-count role="status" aria-live="polite">${cards.length} 個景點，可直接進入完整攻略。</p><div class="th-place-grid">${cards.map(({city,card,place,themes})=>`<a class="th-place" href="${esc(city.path+'#'+place.id)}" data-country-place-city="${esc(city.id)}" data-country-place-themes="${esc(themes.join(' '))}" data-place-ref="${esc(place.stableId)}"><div class="th-place-photo">${countryPicture(view.assets.get(card.assetId),{sizes:'(max-width:600px) 44vw, 300px',focal:card.focalPoint})}<span>${esc(place.locality??city.name)}</span></div><div class="th-place-copy"><h3>${esc(card.title)}</h3><p>${esc(card.play)}</p><small>${esc(card.time)}</small><span class="th-place-cta">看玩法與地圖</span></div></a>`).join('')}</div><p data-country-empty hidden>這個篩選沒有景點。${showCities||showThemes?'<button type="button" data-country-reset>顯示全部景點</button>':''}</p><button class="th-more" type="button" data-country-more hidden>再看更多景點</button></section>`;
  const routes=country.allocation?.routes||[];
  const editorialModule=(anchor,value)=>value?`<section class="th-section" id="${anchor}"><h2>${esc(value.title)}</h2>${approvedParagraphs(value.paragraphs)}${(value.links||[]).map(l=>link(l.url,l.label)).join(' · ')}</section>`:'';
  const transport=country.transport?`<section class="th-section approved-transport" id="transport"><h2>${esc(country.transport.heading)}</h2><p>${esc(country.transport.intro)}</p><div class="approved-transport-routes">${country.transport.cards.map(r=>`<article data-transport-route="${esc(r.id)}"><h3>${esc(r.title)}</h3><p class="approved-transport-sequence">${esc(r.routeLabel)}</p><p>${esc(r.body)}</p></article>`).join('')}</div><div class="th-inline-links">${country.transport.links.map(l=>link(l.url,l.label)).join('')}</div></section>`:'';
  const paceChangesStay=routes.some(r=>r.cityIds.some(id=>country.allocation.minimumStay[id].leisure!==country.allocation.minimumStay[id].compact));
  const paceControl=paceChangesStay?'<label>停留步調<select name="pace"><option value="leisure">悠閒</option><option value="compact">緊湊</option></select></label><p>步調調整各地停留天數；固定活動與交通時間不會縮短。</p>':'<input type="hidden" name="pace" value="leisure"><p>依這條路線分配停留日；固定活動與交通時間不會縮短。</p>';
  const connections=p.routeInspirations?.length?`<section class="th-section th-connections" id="connections"><h2>旅行路線靈感</h2><div class="th-route-options">${p.routeInspirations.map(r=>`<article><h3>${esc(r.title)}</h3>${approvedParagraphs(r.paragraphs)}${r.links.map(l=>link(l.url,l.label)).join(' · ')}</article>`).join('')}</div></section>`:routes.length?`<section class="th-section th-connections" id="connections"><h2>旅行路線靈感</h2><div class="th-route-options">${routes.map(r=>`<a href="#plan" data-country-preset="${esc(r.id)}"><h3>${esc(r.label)}</h3><p>${esc(r.description)}</p><b>試排這條路線</b></a>`).join('')}</div></section>`:'';
  const faq=`<section class="th-section th-faq" id="faq"><h2>出發前，先想好這幾件事</h2>${country.faq.map(q=>`<details><summary>${esc(q.question)}</summary><p>${approvedInlineText(q.answer)}</p></details>`).join('')}</section>`;
const controls=routes.length?`<div class="th-planner" data-country-planner hidden><form data-country-plan><label>旅行路線<select name="routeId">${routes.map(r=>`<option value="${esc(r.id)}">${esc(r.label)}</option>`).join('')}</select></label><div class="th-form-row"><label>整趟旅行天數<input name="days" type="number" min="${country.allocation.dayRange[0]}" max="${country.allocation.dayRange[1]}" value="${country.allocation.dayRange[0]}" step="1" required></label><label>出發日期<input name="startDate" type="date" required></label></div>${paceControl}<button type="submit" class="th-share">安排旅程</button><p role="status" data-country-plan-status></p></form><div class="th-plan-result" data-country-plan-result aria-live="polite" aria-atomic="true"></div></div>`:'';
  const fallback=`<div class="th-plan-fallback" data-country-plan-fallback>${routes.map(r=>`<details data-approved-route="${esc(r.id)}"><summary>${esc(r.label)}</summary><p>${esc(r.description)}</p><p>${r.cityIds.map(cid=>link(view.cities.get(cid).path+'#plan',view.cities.get(cid).name+'行程規劃')).join(' → ')}</p></details>`).join('')}<div class="th-inline-links">${cityLinks}</div></div>`;
  const referenceKinds={international_outbound:'出發與飛行',arrival:'抵達與休息',full_play:'遊玩日',full_play_flexible:'遊玩與彈性安排',full_play_regional:'近郊日遊',transfer:'移動日',international_departure:'離境與飛行',international_arrival:'返抵台灣'};
  const references=(country.referencePlans||[]).map(r=>`<details class="approved-reference-plan"><summary>${esc(r.title)}・參考時間表</summary><p>以下為跨國參考表；請依活動日期、年齡與實際航班銜接調整。</p><ol>${r.days.map(day=>`<li><h3>第 ${day.day} 天・${esc(referenceKinds[day.kind])}</h3><p>${esc(day.destination)}</p>${approvedParagraphs(day.paragraphs)}</li>`).join('')}</ol></details>`).join('');
  const plan=`<section class="th-section" id="plan"><h2 tabindex="-1">${esc(country.planInfo?.title||'把目的地串成你的旅程')}</h2>${approvedParagraphs(country.planInfo?.paragraphs||[])}${controls}${fallback}${references}</section>`;
  return `<div class="approved-country-body" data-approved-country="${esc(country.id)}"><header class="th-intro"><nav class="breadcrumbs" aria-label="麵包屑">${link('/trip/','遠行所')} / <span aria-current="page">${esc(country.name)}</span></nav><div class="th-heading"><div><p class="th-country"><span aria-hidden="true">${esc(country.flag)}</span> <span lang="en">${esc(country.englishName)}</span></p><h1>${esc(country.title)}</h1>${country.subtitle?`<p>${esc(country.subtitle)}</p>`:''}</div><div class="country-leads">${country.intro.map(lead=>`<p>${esc(lead)}</p>`).join('')}</div></div></header><section class="th-atlas${mapHtml?'':' country-without-map'}" id="atlas" aria-label="${esc(country.name)}旅行總覽">${mapHtml?`<div class="country-map-slot">${mapHtml}</div>`:''}<div class="th-explorer">${tabs}${overview}${panels}<p class="th-sr" data-country-city-status role="status" aria-live="polite"></p></div></section>${compare}${experiences}${transport}${connections}${editorialModule('packing',country.packing)}${faq}${plan}${editorialModule('videos',country.videos)}${editorialModule('related',country.related)}</div>`;
}

export const approvedCountryAssets=`<link rel="stylesheet" href="/trip/country-explorer.css"><script type="module" src="/trip/country-explorer.mjs"></script>`;
