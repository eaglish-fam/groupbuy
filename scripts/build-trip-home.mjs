import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {travelHomeCatalog} from '../trip/home-catalog.mjs';
import {travelHomeCommerce} from '../trip/home-commerce.mjs';
import {renderGlobePreview} from './trip-globe-preview.mjs';
import {regionsForCatalog} from '../trip/home-regions.mjs';

const origin='https://www.eaglish.store';
const esc=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll("'",'&#39;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const localFile=path=>fileURLToPath(new URL(`..${path}`,import.meta.url));
const isText=value=>typeof value==='string'&&value.trim().length>0;
const isRoute=value=>typeof value==='string'&&/^\/trip\/[a-z0-9/-]*\/$/.test(value);
const fail=message=>{throw new Error(`Travel home catalog: ${message}`);};

export function validateTravelHomeCatalog(catalog,{checkAssets=true}={}){
 if(!catalog||!catalog.hero||!['eyebrow','title','description'].every(key=>isText(catalog.hero[key])))fail('hero requires eyebrow, title and description');
 for(const key of ['countries','guides','themes'])if(!Array.isArray(catalog[key]))fail(`${key} must be an array`);
 if(!catalog.countries.length)fail('at least one country is required');
 const sets={};
 for(const key of ['countries','guides','themes']){
  sets[key]=new Map();
  for(const item of catalog[key]){
   if(!item||!isText(item.id)||!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(item.id))fail(`${key} has an invalid id`);
   if(sets[key].has(item.id))fail(`${key} has duplicate id ${item.id}`);
   sets[key].set(item.id,item);
  }
 }
 for(const theme of catalog.themes)if(!isText(theme.label)||!isText(theme.description))fail(`theme ${theme.id} requires label and description`);
 const routes=new Set();
 for(const item of [...catalog.countries,...catalog.guides]){
  if(!['name','englishName','summary'].every(key=>isText(item[key])))fail(`${item.id} requires name, englishName and summary`);
  if(!isRoute(item.href))fail(`${item.id} requires a local travel route`);
  if(routes.has(item.href))fail(`duplicate route ${item.href}`);
  routes.add(item.href);
  const image=item.image;
  if(!image||!/^\/trip\/assets\/[a-zA-Z0-9_-]+\.webp$/.test(image.src)||!isText(image.alt)||!Number.isInteger(image.width)||image.width<1||!Number.isInteger(image.height)||image.height<1)fail(`${item.id} requires a WebP image, alt and positive dimensions`);
  if(image.position&&!/^\d{1,3}% \d{1,3}%$/.test(image.position))fail(`${item.id} has invalid image position`);
  if(checkAssets&&!existsSync(localFile(image.src)))fail(`${item.id} image missing: ${image.src}`);
 }
 for(const guide of catalog.guides){
  if(!sets.countries.has(guide.countryId))fail(`${guide.id} references unknown country ${guide.countryId}`);
  if(!Array.isArray(guide.suitableFor)||guide.suitableFor.some(id=>!sets.themes.has(id))||new Set(guide.suitableFor).size!==guide.suitableFor.length)fail(`${guide.id} has invalid themes`);
 }
 for(const country of catalog.countries){
  if(country.subregion&&!regionsForCatalog(catalog).find(r=>r.id===country.region)?.children.some(child=>child.id===country.subregion))fail(`${country.id} references unknown subregion ${country.subregion}`);
  if(country.geography){
   const {point,isoNumeric}=country.geography;
   if(!Array.isArray(point)||point.length!==2||!point.every(Number.isFinite)||Math.abs(point[0])>180||Math.abs(point[1])>90||!/^\d{3}$/.test(isoNumeric))fail(`${country.id} has invalid globe geography`);
  }
  if(!Array.isArray(country.guideIds)||new Set(country.guideIds).size!==country.guideIds.length)fail(`${country.id} requires unique guideIds`);
  for(const id of country.guideIds)if(!sets.guides.has(id)||sets.guides.get(id).countryId!==country.id)fail(`${country.id} references invalid guide ${id}`);
  for(const guide of catalog.guides.filter(guide=>guide.countryId===country.id))if(!country.guideIds.includes(guide.id))fail(`${country.id} omits guide ${guide.id}`);
 }
 return true;
}

export function renderTravelPhoto(image,sizes){
 const base=image.src.replace(/\.webp$/,'');
 const variants=[640,960,1440].filter(width=>width<image.width&&existsSync(localFile(`${base}-${width}.webp`))).map(width=>[`${base}-${width}.webp`,width]);
 if(image.width<=1440||!variants.length)variants.push([image.src,image.width]);
 const src=variants.at(-1)[0];
 return `<img src="${esc(src)}" srcset="${variants.map(([path,width])=>`${esc(path)} ${width}w`).join(', ')}" sizes="${sizes}" width="${image.width}" height="${image.height}" alt="${esc(image.alt)}"${image.position?` style="object-position:${esc(image.position)}"`:''} loading="lazy" fetchpriority="low" decoding="async">`;
}

function countryPanel(country){
 return `<article class="home-country-panel" data-country-panel="${esc(country.id)}" aria-labelledby="country-title-${esc(country.id)}"><figure class="home-panel-photo">${renderTravelPhoto(country.image,'(max-width: 700px) calc(100vw - 40px), (max-width: 1000px) 45vw, 452px')}<figcaption>${esc(country.englishName.toUpperCase())}</figcaption></figure><div class="home-panel-copy"><p class="home-eyebrow">${esc(country.regionLabel||'旅行目的地')} · ${country.guideIds.length} 份指南</p><h3 id="country-title-${esc(country.id)}">${esc(country.name)}</h3><p>${esc(country.summary)}</p><div class="home-panel-actions"><a class="home-panel-primary" href="${esc(country.href)}">走進${esc(country.name)}<span aria-hidden="true">↗</span></a><a href="#guides" class="home-panel-secondary" data-explore-country="${esc(country.id)}">找這裡的玩法 <span aria-hidden="true">↓</span></a></div></div></article>`;
}
function atlas(catalog){
 const regions=regionsForCatalog(catalog);
 const firstRegion=regions.find(r=>r.id===(catalog.countries[0].region||'other'))||regions[0];
 const config={regions,countries:catalog.countries.map(({id,name,region,subregion,geography})=>({id,name,region,subregion,geography})),initialRegion:firstRegion.id};
 const controls=regions.map(region=>`<button type="button" data-atlas-region="${esc(region.id)}" aria-pressed="false">${esc(region.label)}</button>`).join('');
 const subregions=regions.map(region=>`<div class="home-subregion-group" data-subregion-group="${esc(region.id)}" hidden><button type="button" data-atlas-subregion="all" data-parent-region="${esc(region.id)}" aria-pressed="true">全部${esc(region.label)}</button>${region.children.map(child=>`<button type="button" data-atlas-subregion="${esc(child.id)}" data-parent-region="${esc(region.id)}" aria-pressed="false">${esc(child.label)}</button>`).join('')}</div>`).join('');
 return `<div class="home-atlas"><div class="home-atlas-explore"><div class="home-atlas-caption"><p class="home-eyebrow">A WORLD OF FAMILY JOURNEYS</p><h2>從一片風景，開始遠行。</h2><p>先選地區，再找到想去的國家。</p></div><nav class="home-region-filters" data-region-filters hidden aria-label="選擇世界大區"><button type="button" data-atlas-region="all" aria-pressed="false">世界</button>${controls}</nav><div class="home-globe-stage" data-globe-host>${renderGlobePreview(catalog.countries,firstRegion.center)}</div><div class="home-globe-toolbar" data-globe-toolbar hidden><button type="button" data-globe-enable>轉動地球 ↔</button><button type="button" data-globe-reset hidden>回到所選地區</button><span data-globe-message>選地區，讓地球帶你走近。</span></div><div class="home-atlas-browser"><nav class="home-atlas-breadcrumb" data-atlas-breadcrumb hidden aria-label="探索位置"><button type="button" data-atlas-back>世界</button><span aria-hidden="true">／</span><span data-atlas-scope>${esc(firstRegion.label)}</span></nav><nav class="home-subregions" data-subregions hidden aria-label="選擇分區">${subregions}</nav><div class="home-country-heading-row"><p data-atlas-country-heading>選一個國家</p><span data-atlas-count>${catalog.countries.length} 個目的地</span></div><nav class="home-country-list" aria-label="選擇旅行國家">${catalog.countries.map(country=>`<a href="${esc(country.href)}" data-atlas-choice="${esc(country.id)}" data-country-region="${esc(country.region||'other')}" data-country-subregion="${esc(country.subregion||'')}"><span>${esc(country.name)}</span><small>${esc(country.englishName)}</small><span class="home-choice-arrow" aria-hidden="true">↗</span></a>`).join('')}</nav><button class="home-atlas-more" data-atlas-more type="button" hidden>展開所有目的地</button><p class="home-sr-only" data-atlas-status role="status" aria-live="polite"></p><p class="home-globe-credit">Natural Earth · 地理探索示意</p></div></div><div class="home-atlas-panels">${catalog.countries.map(countryPanel).join('')}<article class="home-unmapped-panel" data-atlas-empty hidden><p class="home-eyebrow">MORE PLACES TO EXPLORE</p><h3>世界很大，<br>旅程慢慢收集。</h3><p data-atlas-empty-copy>這個地區目前沒有公開的旅行指南。</p><button type="button" data-atlas-return>看看已有的目的地 ↗</button></article></div><script type="application/json" id="home-globe-config">${JSON.stringify(config).replaceAll('<','\\u003c')}</script></div>`;
}
function commerce(catalog){
 const offers=travelHomeCommerce.offers.filter(offer=>catalog.countries.some(country=>country.id===offer.countryId));
 return `<section class="home-planning home-wrap" id="planning" aria-labelledby="planning-title"><header class="home-planning-heading"><div><p class="home-eyebrow">MAKE ROOM FOR THE GOOD PARTS</p><h2 id="planning-title">把旅程安排好。</h2></div><p>選好地方，再安排體驗、落腳處與出發的方式。</p></header><div class="home-planning-grid"><article class="home-plan-card home-plan-activities"><span class="home-plan-number" aria-hidden="true">01 / EXPERIENCES</span><h3>留一段時間，做喜歡的事。</h3><p>先看實訪指南，再比較適合自己日期的票券與方案。</p><div class="home-commerce-offers">${offers.map(offer=>`<div class="home-commerce-offer" data-offer-country="${esc(offer.countryId)}"><a class="home-offer-guide" href="${esc(offer.guideHref)}">${esc(offer.title)} <span aria-hidden="true">↗</span></a><p>${esc(offer.why)}</p><div class="home-offer-links">${offer.providers.map(provider=>{
 const url=new URL(provider.url);if(url.protocol!=='https:')fail('commerce requires https URLs');
 return `<a href="${esc(provider.url)}" target="_blank" rel="sponsored noopener">${esc(provider.label)} <span aria-hidden="true">↗</span></a>`;
 }).join('')}</div><details class="home-offer-check"><summary>預訂前核對</summary><p>${esc(offer.whatToCheck)}</p></details></div>`).join('')}</div><p class="home-commerce-empty" data-commerce-empty hidden>從各地指南挑活動，確認季節、交通與同行家人的需要，再安排預約。</p><a href="#guides" class="home-text-link">先從玩法找靈感 <span aria-hidden="true">↓</span></a><p class="home-affiliate-note">${esc(travelHomeCommerce.disclosure)}</p></article><article class="home-plan-card"><span class="home-plan-number" aria-hidden="true">02 / A PLACE TO STAY</span><h3>住得順路，玩得從容。</h3><p>先看每天想去哪裡，再選落腳的區域。少搬一次行李，也能多留一段旅行時間。</p><ul class="home-stay-tips"><li>把交通與主要景點放在一起看</li><li>確認家庭房型、停車與退改條件</li><li>跨城日，留好移動與休息時間</li></ul><a href="#guides" class="home-text-link">從當地指南安排住宿區域 <span aria-hidden="true">↓</span></a></article><article class="home-plan-card home-plan-flights"><span class="home-plan-number" aria-hidden="true">03 / THE WAY THERE</span><p class="home-paused-status">暫停更新</p><h3>便宜機票雷達</h3><p>好價格，也是出發的理由。機票雷達目前暫停更新，先把想去的地方放進旅行清單。</p><p class="home-flight-note">出發日期確定後，再向航空公司或訂票平台核對票價、行李與退改條件。</p><a href="#destinations" class="home-text-link">先看看想去的地方 <span aria-hidden="true">↑</span></a></article></div></section>`;
}

function guideCard(guide,countries,themes){
 return `<article class="home-guide" data-guide-id="${esc(guide.id)}" data-country="${esc(guide.countryId)}" data-themes="${guide.suitableFor.map(esc).join(' ')}"><a class="home-guide-link" href="${esc(guide.href)}"><div class="home-guide-photo">${renderTravelPhoto(guide.image,'(max-width: 700px) calc(100vw - 40px), (max-width: 1100px) calc(50vw - 42px), 378px')}</div><div class="home-guide-copy"><p class="home-guide-meta">${esc(countries.get(guide.countryId).name)}<span aria-hidden="true"> / </span><span lang="en">${esc(guide.englishName)}</span></p><h3>${esc(guide.name)}<span aria-hidden="true">↗</span></h3><p class="home-guide-summary">${esc(guide.summary)}</p><ul class="home-guide-tags" aria-label="旅行玩法">${guide.suitableFor.map(id=>`<li>${esc(themes.get(id).label)}</li>`).join('')}</ul></div></a></article>`;
}

export function renderTravelHome(catalog=travelHomeCatalog){
 validateTravelHomeCatalog(catalog);
 const countries=new Map(catalog.countries.map(item=>[item.id,item]));
 const guides=new Map(catalog.guides.map(item=>[item.id,item]));
 const themes=new Map(catalog.themes.map(item=>[item.id,item]));
 const title='自由行目的地與親子旅行指南｜鷹家遠行所';
 const description='從喜歡的國家與玩法，找到下一站。用鷹式一家的實訪照片探索城市、自然、動物與在地飲食，再走進各地的景點與行程指南。';
 const shareImage=catalog.countries[0].image;
 const schema={'@context':'https://schema.org','@type':'CollectionPage',name:title,description,url:origin+'/trip/',inLanguage:'zh-Hant',mainEntity:{'@type':'ItemList',itemListElement:catalog.countries.map((country,index)=>({'@type':'ListItem',position:index+1,name:country.name,url:origin+country.href}))},hasPart:catalog.guides.map(guide=>({'@type':'WebPage',name:guide.name,url:origin+guide.href}))};
 return `<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><meta name="description" content="${description}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${origin}/trip/"><meta property="og:type" content="website"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${origin}/trip/"><meta property="og:site_name" content="鷹家遠行所"><meta property="og:locale" content="zh_TW"><meta property="og:image" content="${origin+esc(shareImage.src)}"><meta property="og:image:alt" content="${esc(shareImage.alt)}"><link rel="icon" href="/icons/favicon.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@500;700&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/trip/trip.css?v=20260914-nz-media-2"><link rel="stylesheet" href="/trip/home.css?v=20260928-globe-3"><script defer src="/site-runtime.js?v=20260914-analytics-v1"></script><script defer src="/trip/home.js?v=20260928-sync-4"></script><script type="application/ld+json">${JSON.stringify(schema).replaceAll('<','\\u003c')}</script></head>
<body class="travel-home"><a class="skip" href="#main">跳到主要內容</a><header class="home-masthead home-wrap"><a class="home-brand" href="/trip/" aria-label="鷹家遠行所首頁"><img src="/flights/assets/faraway-wordmark.svg" width="220" height="65" alt="鷹家遠行所"></a><p class="home-brand-note">把走過的地方，整理成你的下一站。</p><nav aria-label="主要導覽"><a href="#destinations">目的地</a><a href="#guides">找玩法</a><a href="#planning">安排旅程</a></nav></header>
<main id="main"><section class="home-destinations home-wrap" id="destinations" aria-labelledby="home-title"><header class="home-intro"><div><p class="home-eyebrow">${esc(catalog.hero.eyebrow)}</p><h1 id="home-title">${esc(catalog.hero.title)}</h1></div><p class="home-lead">${esc(catalog.hero.description)}</p></header>${atlas(catalog)}</section>
<section class="home-discover" id="guides" aria-labelledby="guides-title"><div class="home-wrap"><span id="routes" class="home-route-anchor" aria-hidden="true"></span><header class="home-section-heading"><div><p class="home-eyebrow">FIND YOUR KIND OF JOURNEY</p><h2 id="guides-title">從喜歡的玩法，<br>找到下一站。</h2></div><p>山湖、街巷，或孩子期待的動物。<br>先找到想做的事，再走進當地的指南。</p></header><form class="home-filters" data-home-filters hidden aria-label="篩選旅行指南"><div class="home-filter"><label for="home-country-filter">目的地</label><select id="home-country-filter" name="country"><option value="all">所有國家</option><option value="" data-country-unavailable disabled hidden>此區域尚無目的地</option>${catalog.countries.map(country=>`<option value="${esc(country.id)}">${esc(country.name)}</option>`).join('')}</select></div><div class="home-filter"><label for="home-theme-filter">想怎麼玩</label><select id="home-theme-filter" name="theme"><option value="all">所有玩法</option>${catalog.themes.map(theme=>`<option value="${esc(theme.id)}">${esc(theme.label)}</option>`).join('')}</select></div><button class="home-reset" type="reset">清除篩選</button></form><div class="home-results-heading"><p data-home-status role="status" aria-live="polite" aria-atomic="true">${catalog.guides.length} 份城市・區域指南</p><span>實訪照片 · 景點 · 行程安排</span></div><div class="home-guide-grid" data-home-guides>${catalog.guides.map(guide=>guideCard(guide,countries,themes)).join('')}</div><div class="home-empty" data-home-empty hidden><h3>這個組合還沒有指南</h3><p>換個玩法，或看看其他目的地。</p><button class="home-button" type="button" data-home-reset>查看所有指南</button></div><div class="home-more"><button class="home-button" type="button" data-home-more hidden>看更多指南 <span aria-hidden="true">↓</span></button></div></div></section>
${commerce(catalog)}
<section class="home-about home-wrap" id="about" aria-labelledby="about-title"><div><p class="home-eyebrow">FROM OUR FAMILY TO YOURS</p><h2 id="about-title">從一家人的旅途，<br>到你自己的行程。</h2></div><div><p>我們是鷹式一家。把一起走過的街道、看過的風景，整理成可以拿來規劃旅行的指南。</p><p>從實訪照片挑喜歡的地方，再查交通、停留時間與行前提醒。把感興趣的留下來，也為自己的旅程留一點空白。</p><a class="home-text-link" href="#destinations">挑一個想去的地方 <span aria-hidden="true">↑</span></a></div></section></main>
<footer class="home-footer"><div class="home-wrap"><a class="home-brand" href="/trip/" aria-label="鷹家遠行所首頁"><img src="/flights/assets/faraway-wordmark.svg" width="220" height="65" alt="鷹家遠行所"></a><p>© 鷹式一家 Eaglish Family</p><nav aria-label="頁尾導覽"><a href="/">鷹家買物社 ↗</a><a href="/blog/">鷹家選物誌 ↗</a></nav></div></footer></body></html>`;
}
