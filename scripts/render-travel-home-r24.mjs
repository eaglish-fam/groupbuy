// /trip/ home (鷹家遠行所). Rendered entirely at build time from portable public
// sources: the reviewed travel catalog and Taiwan atlas (trip/data/taiwan-atlas-r24.json),
// the registered approved travel packages and the pinned Natural Earth world map.
// Every link, count and photo is crawlable without JavaScript; trip/trip-home.js only
// filters the destination cards and shows a reader's own saved Taiwan list.
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {travelHomeCatalog} from '../trip/home-catalog.mjs';
import {travelHomeCommerce} from '../trip/home-commerce.mjs';
import {homeRegions} from '../trip/home-regions.mjs';
import {planStorageKey} from '../trip/taiwan-place-experience.mjs';
import {validateTravelHomeCatalog} from './build-trip-home.mjs';
import {approvedTravelRegistrations} from './trip-approved-registration.mjs';
import {taiwanHubModel,placeLink,travelWordmark} from './build-trip-taiwan.mjs';
import {renderWorldMap,assertPinNearCountry,hasCountryShape} from './trip-home-world-map.mjs';

const root=fileURLToPath(new URL('..',import.meta.url));
const origin='https://www.eaglish.store';
const read=rel=>readFileSync(resolve(root,rel),'utf8');
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hash=text=>createHash('sha256').update(text).digest('hex').slice(0,12);
const json=value=>JSON.stringify(value).replaceAll('<','\\u003c');
const regionOrder=['asia','europe','oceania','americas','africa'];

// Geographic constants, not editorial data. A guide city gets one rust pin; a new
// guide without a point here fails the build instead of silently missing the map.
export const guidePins={
 bangkok:[100.50,13.75],'chiang-mai':[98.99,18.79],'chiang-rai':[99.83,19.91],
 'cebu-bohol':[123.89,10.32],singapore:[103.82,1.35],
 penang:[100.33,5.41],'kuala-lumpur':[101.69,3.14],
 asahikawa:[142.37,43.77],sapporo:[141.35,43.06],otaru:[141.00,43.19],yoichi:[140.78,43.19],
 oslo:[10.75,59.91],svalbard:[15.63,78.22],tromso:[18.96,69.65],amsterdam:[4.90,52.37],
 'north-island':[174.76,-36.85],wellington:[174.78,-41.29],'christchurch-akaroa':[172.64,-43.53],
 'mid-canterbury':[171.75,-43.90],kaikoura:[173.68,-42.40],otago:[170.97,-45.10],
 'queenstown-arrowtown':[168.66,-45.03],'wanaka-tekapo':[169.13,-44.70],
};
// A single-destination package without discovery data (Singapore) still needs a
// continent and an ISO code for the map; both are geography, not new content.
const singleDestinationGeography={singapore:{region:'asia',isoNumeric:'702'}};
// A portrait cover keeps its people inside the 3:2 card frame.
const coverPosition={singapore:'50% 30%'};
const taiwanHome={isoNumeric:'158',point:[121,23.7],label:'家在這裡'};
const taiwanPhotoIds=['place-tw-bambi-land','place-tw-dihua','place-tw-cksmh'];

// Responsive sources of a legacy catalog image: its existing -640/-960 siblings plus
// the original at its recorded width.
function catalogPicture(image){
 const base=image.src.replace(/\.webp$/,'');
 const variants=[[640,base+'-640.webp'],[960,base+'-960.webp'],[1440,base+'-1440.webp']].filter(([w,url])=>w<image.width&&existsSync(resolve(root,url.slice(1)))).map(([width,url])=>({width,url}));
 if(image.width<=1440)variants.push({width:image.width,url:image.src});
 return {variants,width:image.width,height:image.height,alt:image.alt};
}
const approvedPicture=asset=>({variants:asset.variants.map(v=>({width:v.width,url:v.url})),width:asset.width,height:asset.height,alt:asset.alt});

function img(picture,{sizes,position}){
 const variants=[...picture.variants].sort((a,b)=>a.width-b.width);
 if(variants.length<2||variants[0].width>640)throw Error('Cover needs a ≤640px variant: '+variants[0]?.url);
 for(const v of variants)if(!existsSync(resolve(root,v.url.slice(1))))throw Error('Missing photo '+v.url);
 const src=(variants.find(v=>v.width===960)||variants.at(-1)).url;
 return `<img src="${escape(src)}" srcset="${escape(variants.map(v=>`${v.url} ${v.width}w`).join(', '))}" sizes="${sizes}" width="${picture.width}" height="${picture.height}" alt="${escape(picture.alt)}"${position?` style="object-position:${position}"`:''} loading="lazy" decoding="async">`;
}

// The reviewed catalog's countries (Thailand, New Zealand, the Philippines).
export function catalogDestinations(catalog){
 return catalog.countries.map(c=>({id:c.id,name:c.name,href:c.href,region:c.region,isoNumeric:c.geography.isoNumeric,
  guides:c.guideIds.map(id=>catalog.guides.find(g=>g.id===id)).map(g=>({id:g.id,name:g.name,href:g.href})),picture:catalogPicture(c.image)}));
}
// Registered approved packages: a country the catalog already lists keeps its
// reviewed record (same URLs, same guides); any other country joins from its
// package with its discovery photo and geography. Unexpected drift fails closed.
export function mergeApprovedDestinations(base,packages){
 const countries=[...base];
 for(const data of packages){
  for(const c of data.countries){
   const cities=c.cityIds.map(id=>data.cities.find(city=>city.id===id));
   if(cities.some(city=>!city))throw Error('Approved country lists an unknown city: '+c.id);
   const existing=countries.find(k=>k.id===c.id);
   if(existing){
    if(existing.href!==c.path||existing.guides.length!==cities.length||!cities.every(city=>existing.guides.some(g=>g.id===city.id&&g.href===city.path)))throw Error('Reconcile the reviewed home entry for '+c.id);
    continue;
   }
   if(countries.some(k=>k.href===c.path))throw Error('Duplicate destination path '+c.path);
   for(const city of cities)if(countries.some(k=>k.guides.some(g=>g.id===city.id||g.href===city.path)))throw Error('Duplicate destination guide '+city.id);
   const d=c.discovery,single=singleDestinationGeography[c.id];
   if(!d&&!(c.singleDestination&&single))throw Error('Approved country geography/discovery required: '+c.id);
   const asset=data.assets.find(a=>a.assetId===(d?d.assetId:cities[0].hero[0]));
   if(!asset)throw Error('Missing approved cover for '+c.id);
   countries.push({id:c.id,name:c.name,href:c.path,region:d?d.region:single.region,isoNumeric:d?d.isoNumeric:single.isoNumeric,
    guides:cities.map(city=>({id:city.id,name:city.name,href:city.path})),picture:approvedPicture(asset)});
  }
 }
 for(const c of countries)for(const href of [c.href,...c.guides.map(g=>g.href)])if(!/^\/trip\/[a-z0-9/-]+\/$/.test(href))throw Error('Unsafe destination link '+href);
 return countries;
}

export function travelHomeModel(){
 const config=JSON.parse(read('trip/data/taiwan-atlas-r24.json'));
 validateTravelHomeCatalog(config.catalog);
 // A catalog update must explicitly update this reviewed projection, rather than
 // silently serving an old set of countries after a successful build.
 if(JSON.stringify(config.catalog)!==JSON.stringify(travelHomeCatalog))throw Error('Travel catalog changed; reconcile the reviewed public atlas');
 if(config.privateAtlas!==null||config.data.places.length!==53)throw Error('Invalid public atlas');
 const countries=mergeApprovedDestinations(catalogDestinations(config.catalog),approvedTravelRegistrations(root).map(r=>r.data));
 const regionLabel=new Map(homeRegions.map(r=>[r.id,r.label]));
 for(const c of countries){
  if(!regionLabel.has(c.region))throw Error('Unknown continent for '+c.id);
  if(!/^\d{3}$/.test(c.isoNumeric))throw Error('Invalid map code for '+c.id);
  for(const href of [c.href,...c.guides.map(g=>g.href)])if(!existsSync(resolve(root,href.slice(1),'index.html')))throw Error('Unpublished destination link '+href);
  for(const g of c.guides){if(!guidePins[g.id])throw Error('Add a map point for guide '+g.id);assertPinNearCountry(c.isoNumeric,guidePins[g.id],g.id);}
  c.regionLabel=regionLabel.get(c.region);
  c.position=coverPosition[c.id];
 }
 // Continent, then the countries with more guides first; ties keep catalog order.
 const ordered=countries.map((c,i)=>({c,i})).sort((a,b)=>regionOrder.indexOf(a.c.region)-regionOrder.indexOf(b.c.region)||b.c.guides.length-a.c.guides.length||a.i-b.i).map(x=>x.c);
 const continents=regionOrder.filter(id=>ordered.some(c=>c.region===id)).map(id=>({id,label:regionLabel.get(id)}));
 const taiwan=taiwanHubModel(root);
 const photographed=taiwan.places.filter(p=>p.photo);
 const taiwanPhotos=[...taiwanPhotoIds.map(id=>photographed.find(p=>p.id===id)).filter(Boolean),...photographed].filter((p,i,a)=>a.indexOf(p)===i).slice(0,3);
 // A film's cover is the first photographed place in its county; otherwise a text tile.
 const films=config.data.regionalFilms.map(f=>{
  const cover=photographed.find(p=>f.countyIds.includes(p.countyIds[0]));
  const county=taiwan.countyById.get(f.countyIds[0]);
  if(!county||!/^https:\/\/www\.youtube\.com\/watch\?v=[\w-]+$/.test(f.fullUrl))throw Error('Invalid regional film '+f.videoId);
  return {...f,cover,placeName:county.name.replace(/[市縣]$/,'')};
 });
 return {config,countries:ordered,continents,taiwan,taiwanPhotos,films,guideCount:ordered.reduce((n,c)=>n+c.guides.length,0)};
}

const arrow='<span aria-hidden="true">↗</span>';
const ext=(href,label,cls='')=>`<a${cls?` class="${cls}"`:''} href="${escape(href)}" rel="noopener noreferrer">${label} ${arrow}</a>`;

function renderHero(model){
 const {countries,taiwan}=model;
 const visited=new Set([taiwanHome.isoNumeric,...countries.map(c=>c.isoNumeric)]);
 const pins=countries.flatMap(c=>c.guides.map(g=>guidePins[g.id]));
 const missingShapes=countries.filter(c=>!hasCountryShape(c.isoNumeric)).map(c=>c.name);
 const map=renderWorldMap({visited,pins,home:taiwanHome});
 const total=taiwan.places.length;
 const rows=[`<li><a href="/trip/taiwan/"><span class="place-name">台灣</span><span class="place-count">${total} 個地點</span></a></li>`,
  ...countries.map(c=>`<li><a href="${c.href}"><span class="place-name">${escape(c.name)}</span><span class="place-count">${c.guides.length} 份指南</span></a></li>`)].join('');
 const mapText=`彩色的是去過的國家：台灣（${total} 個地點）、${countries.map(c=>`${c.name}（${c.guides.length} 份指南）`).join('、')}。小圓點是有指南的城市${missingShapes.length?`；${missingShapes.join('、')}在這個比例下太小，只標城市`:''}。`;
 return `<section class="home-hero" aria-labelledby="home-title"><div class="wrap hero-grid">
<div class="hero-main"><h1 id="home-title">我們帶孩子走過的地方</h1><p class="hero-lead">選一個國家，看那裡的親子玩法和我們住過的地方；台灣是家，另有一整頁。</p>
<div class="world-map" role="region" aria-label="鷹式一家去過的國家地圖" aria-describedby="world-map-text">${map}<p class="sr-only" id="world-map-text">${escape(mapText)}</p></div></div>
<nav class="hero-places" aria-label="去過的國家與指南數"><ul>${rows}</ul></nav>
</div></section>`;
}

function renderDestinations(model){
 const chips=[`<button type="button" data-continent="all" aria-pressed="true">全部</button>`,...model.continents.map(r=>`<button type="button" data-continent="${r.id}" aria-pressed="false">${escape(r.label)}</button>`)].join('');
 const cards=model.countries.map(c=>{
  const meta=`${escape(c.regionLabel)}｜${c.guides.length} 份指南`;
  // Guides open from the card; a single guide that is the country page needs no list.
  const list=c.guides.length===1&&c.guides[0].href===c.href?`<p class="dest-meta">${meta}</p>`
   :`<details class="dest-guides"><summary><span class="dest-meta">${meta}</span><span class="dest-toggle">看指南</span></summary><ul>${c.guides.map(g=>`<li><a href="${g.href}">${escape(g.name)}</a></li>`).join('')}</ul></details>`;
  return `<li class="dest-card" data-country="${c.id}" data-region="${c.region}"><a class="dest-link" href="${c.href}"><div class="dest-photo">${img(c.picture,{sizes:'(max-width:900px) calc(50vw - 24px), 277px',position:c.position})}</div><h3>${escape(c.name)}</h3></a>${list}</li>`;
 }).join('');
 return `<section class="home-block" id="destinations" aria-labelledby="destinations-title"><div class="wrap">
<div class="block-head"><h2 id="destinations-title">目的地</h2><p class="block-note">${model.countries.length} 個國家，${model.guideCount} 份指南</p></div>
<div class="chips" role="group" aria-label="依洲別篩選" data-continent-chips hidden>${chips}</div>
<p class="sr-only" id="destinations-status" role="status" aria-live="polite"></p>
<ul class="dest-grid" id="guides" data-home-guides>${cards}</ul>
</div></section>`;
}

function renderTaiwan(model){
 const {taiwan,taiwanPhotos}=model,total=taiwan.places.length,c=taiwan.categoryCounts;
 const rows=taiwan.regionRows.map(r=>{
  const inner=`<span class="region-name">${escape(r.region.name)}</span><span class="region-counties">${r.count?escape(r.counties.join('、')):'還沒有紀錄'}</span><span class="region-count">${r.count} 個</span>`;
  return r.count?`<li><a href="/trip/taiwan/#${r.slug}">${inner}</a></li>`:`<li class="is-empty"><div>${inner}</div></li>`;
 }).join('');
 const photos=taiwanPhotos.map(p=>`<figure><div class="tw-photo"><img src="${escape(p.photo.src)}" width="${p.photo.width}" height="${p.photo.height}" alt="${escape(p.photo.alt)}" loading="lazy" decoding="async"></div><figcaption>${escape(p.name)}</figcaption></figure>`).join('');
 return `<section class="home-block home-taiwan" id="taiwan" aria-labelledby="taiwan-title"><div class="wrap tw-grid">
<div class="tw-copy"><h2 id="taiwan-title">台灣，從家門口出發</h2><p class="tw-lead">${total} 個我們帶孩子去過的地方：${c.attraction} 個景點、${c.restaurant} 間餐廳、${c.hotel} 間住宿，照地區找。</p>
<ul class="tw-regions" aria-label="台灣各地區去過的地點數">${rows}</ul>
<a class="button" href="/trip/taiwan/">看台灣全部地點</a></div>
<div class="tw-photos">${photos}</div>
</div></section>`;
}

function renderFilms(model){
 const cards=model.films.map(f=>{
  const media=f.cover
   ?`<div class="film-media"><img src="${escape(f.cover.photo.src)}" width="${f.cover.photo.width}" height="${f.cover.photo.height}" alt="${escape(f.cover.photo.alt)}" loading="lazy" decoding="async"></div>`
   :`<div class="film-media film-tile" aria-hidden="true"><span class="film-tile-name">${escape(f.placeName)}</span><span class="film-tile-note">${f.chapters.length} 段旅行章節</span></div>`;
  const chapters=f.chapters.map(ch=>`<li class="film-chapter">${ext(ch.url,escape(ch.label))}<p>${escape(ch.description)}</p>${ch.planningNotice?`<p class="film-notice">${escape(ch.planningNotice.text)} ${ext(ch.planningNotice.sourceUrl,'查看官方公告')}</p>`:''}</li>`).join('');
  return `<article class="regional-film" data-film-id="${escape(f.videoId)}">${media}<div class="film-body"><h3>${escape(f.title)}</h3><p class="film-intro">${escape(f.introduction)}</p><p class="film-full-link">${ext(f.fullUrl,escape(f.fullLinkLabel),'film-watch')}</p><details><summary>看旅行章節（${f.chapters.length}）</summary><ol>${chapters}</ol></details></div></article>`;
 }).join('');
 return `<section class="home-block" id="records" aria-labelledby="records-title"><div class="wrap">
<div class="block-head"><h2 id="records-title">完整旅行紀錄</h2><p class="block-note">從頭到尾的旅行影片，可以只看想去的那一段。</p></div>
<div class="film-grid" id="regional-films">${cards}</div>
</div></section>`;
}

function renderPlanning(model){
 const {taiwan}=model;
 const offers=travelHomeCommerce.offers.map(o=>`<li class="offer" data-offer-country="${escape(o.countryId)}"><a class="offer-guide" href="${escape(o.guideHref)}">${escape(o.title)}</a><span class="offer-links">${o.providers.map(p=>`<a href="${escape(p.url)}" target="_blank" rel="sponsored noopener">${escape(p.label.split('：')[0])} ${arrow}<span class="sr-only">：${escape(p.label)}（另開新分頁）</span></a>`).join('')}</span></li>`).join('');
 // The saved Taiwan list lives in this browser only (the atlas used the same key);
 // the card appears only when a reader has saved places.
 const listData=Object.fromEntries(taiwan.places.map(p=>{const link=placeLink(p);return [p.id,[p.name,link.href]];}));
 return `<section class="home-block" id="planning" aria-labelledby="planning-title"><div class="wrap">
<div class="block-head"><h2 id="planning-title">把旅程排好</h2></div>
<div class="plan-grid">
<article class="plan-card plan-list" id="atlas-planning" aria-labelledby="plan-title" data-trip-list hidden><h3 id="plan-title">我的旅程清單</h3><p class="plan-text" data-trip-list-count></p><ol class="plan-saved" data-trip-list-items></ol><p class="sr-only" id="trip-list-feedback" role="status" aria-live="polite"></p><a class="plan-link" href="/trip/taiwan/">看台灣全部地點</a></article>
<article class="plan-card"><h3>住在哪一區</h3><p class="plan-text">先看每天想去哪裡，再選落腳的區域，少搬一次行李。各地指南都有我們住過的地方。</p><a class="plan-link" href="#guides">從當地指南找住宿區域</a></article>
<article class="plan-card plan-paused"><h3>便宜機票雷達</h3><p class="plan-status">暫停更新</p><p class="plan-text">機票雷達目前暫停更新。出發日期確定後，再向航空公司或訂票平台核對票價、行李與退改條件。</p><a class="plan-link" href="#destinations">先看看想去的地方</a></article>
<article class="plan-card"><h3>活動與票券</h3><p class="plan-text">先看實訪指南，再比較適合自己日期的票券。</p><p class="plan-note home-affiliate-note">${escape(travelHomeCommerce.disclosure)}</p><ul class="offers">${offers}</ul></article>
</div>
<script type="application/json" id="trip-list-places" data-storage-key="${planStorageKey}">${json(listData)}</script>
</div></section>`;
}

// Inline the shared stylesheet for a deterministic first paint without a second request.
// Only listed travel stylesheets are inlined; other sites are never replaced.
export function inlineTravelStyles(html){
 const allowed=new Set(['/trip/trip.css','/trip/home.css','/trip/atlas-component.css','/trip/atlas-navigation.css','/trip/bangkok.css','/trip/cebu-bohol.css','/trip/cebu-presentation-r21.css','/site-navigation.css','/trip/heading-theme-r24.css','/trip/travel-entry.css','/trip/trip-home.css']);
 return html.replace(/<link\b[^>]*rel="stylesheet"[^>]*href="([^"<>]+)"[^>]*>/g,(tag,href)=>{
  const p=new URL(href,origin).pathname;
  if(!allowed.has(p))return tag;
  const css=read(p.slice(1));if(/<\/style/i.test(css))throw Error('Invalid stylesheet');
  return `<style data-site-style="${p}">${css}</style>`;
 });
}

export function renderTravelHomeR24(){
 const model=travelHomeModel();
 const {countries,taiwan,guideCount}=model;
 const title='自由行目的地與親子旅行指南｜鷹家遠行所';
 const description=`鷹式一家帶孩子走過的地方：${countries.length} 個國家、${guideCount} 份親子旅行指南，加上台灣 ${taiwan.places.length} 個實際去過的景點、餐廳和住宿。從地圖選目的地，再看各地的玩法、住宿與完整旅行影片。`;
 const canonical=origin+'/trip/';
 const share=countries.find(c=>c.id==='thailand')?.picture||countries[0].picture;
 const shareSrc=share.variants.at(-1).url;
 const jsVersion=hash(read('trip/trip-home.js'));
 const runtimeVersion=hash(read('site-runtime.js'));
 const jsonld={'@context':'https://schema.org','@type':'CollectionPage',name:title,description,url:canonical,inLanguage:'zh-Hant',
  mainEntity:{'@type':'ItemList',numberOfItems:countries.length+1,itemListElement:[{name:'台灣',href:'/trip/taiwan/'},...countries].map((c,i)=>({'@type':'ListItem',position:i+1,name:c.name,url:origin+c.href}))},
  hasPart:countries.flatMap(c=>c.guides).map(g=>({'@type':'WebPage',name:g.name,url:origin+g.href}))};
 const brand=(n,width)=>travelWordmark(root,{className:'home-wordmark',idPrefix:'home-wordmark-title-',n,width});
 const html=`<!doctype html>
<html lang="zh-Hant-TW">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><meta name="description" content="${escape(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${canonical}"><meta property="og:site_name" content="鷹家遠行所"><meta property="og:locale" content="zh_TW"><meta property="og:image" content="${origin}${escape(shareSrc)}"><meta property="og:image:alt" content="${escape(share.alt)}"><link rel="icon" href="/icons/favicon.svg"><link rel="stylesheet" href="/trip/trip-home.css"><script type="application/ld+json">${json(jsonld)}</script><script defer src="/trip/trip-home.js?v=${jsVersion}"></script><script defer src="/site-runtime.js?v=${runtimeVersion}"></script></head>
<body class="trip-home"><a class="skip" href="#main">跳到主要內容</a>
<header class="home-top"><div class="wrap home-top-inner"><a class="home-brand" href="/trip/" aria-label="鷹家遠行所首頁">${brand(1,168)}</a><nav class="home-nav" aria-label="遠行所"><a href="#destinations">目的地</a><a href="/trip/taiwan/">台灣</a><a href="#records">旅行紀錄</a><a href="#planning">排行程</a></nav></div></header>
<main id="main">
${renderHero(model)}
${renderDestinations(model)}
${renderTaiwan(model)}
${renderFilms(model)}
${renderPlanning(model)}
</main>
<footer class="home-footer"><div class="wrap home-footer-inner"><a class="home-brand" href="/trip/" aria-label="鷹家遠行所首頁">${brand(2,150)}</a><p>© 鷹式一家 Eaglish Family</p><nav aria-label="頁尾導覽"><a href="/">鷹家買物社</a><a href="/blog/">鷹家選物誌</a></nav></div></footer>
</body>
</html>
`;
 return inlineTravelStyles(html);
}
