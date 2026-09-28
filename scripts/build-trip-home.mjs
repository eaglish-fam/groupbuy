import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {travelHomeCatalog} from '../trip/home-catalog.mjs';

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
  if(!Array.isArray(country.guideIds)||new Set(country.guideIds).size!==country.guideIds.length)fail(`${country.id} requires unique guideIds`);
  for(const id of country.guideIds)if(!sets.guides.has(id)||sets.guides.get(id).countryId!==country.id)fail(`${country.id} references invalid guide ${id}`);
  for(const guide of catalog.guides.filter(guide=>guide.countryId===country.id))if(!country.guideIds.includes(guide.id))fail(`${country.id} omits guide ${guide.id}`);
 }
 return true;
}

function photo(image,sizes){
 const base=image.src.replace(/\.webp$/,'');
 const variants=[640,960,1440].filter(width=>width<image.width&&existsSync(localFile(`${base}-${width}.webp`))).map(width=>[`${base}-${width}.webp`,width]);
 if(image.width<=1440||!variants.length)variants.push([image.src,image.width]);
 const src=variants.at(-1)[0];
 return `<img src="${esc(src)}" srcset="${variants.map(([path,width])=>`${esc(path)} ${width}w`).join(', ')}" sizes="${sizes}" width="${image.width}" height="${image.height}" alt="${esc(image.alt)}"${image.position?` style="object-position:${esc(image.position)}"`:''} loading="lazy" fetchpriority="low" decoding="async">`;
}

function countryCard(country,guides){
 const selected=country.guideIds.map(id=>guides.get(id));
 return `<article class="home-country" data-country-id="${esc(country.id)}"><a class="home-country-photo" href="${esc(country.href)}" tabindex="-1" aria-hidden="true">${photo(country.image,'(max-width: 700px) calc(50vw - 26px), (max-width: 767px) calc(100vw - 60px), (max-width: 1100px) calc(50vw - 44px), 578px')}</a><div class="home-country-copy"><div class="home-country-heading"><div><p class="home-eyebrow">${esc(country.englishName)}</p><h3><a href="${esc(country.href)}">${esc(country.name)}<span aria-hidden="true">↗</span></a></h3></div><span class="home-count">${selected.length} 份城市・區域指南</span></div><p class="home-country-summary">${esc(country.summary)}</p>${selected.length?`<nav class="home-country-guides" aria-label="${esc(country.name)}精選指南">${selected.slice(0,3).map(guide=>`<a href="${esc(guide.href)}">${esc(guide.name)}<span aria-hidden="true">↗</span></a>`).join('')}</nav>`:''}<a class="home-country-link" href="${esc(country.href)}">探索${esc(country.name)}<span aria-hidden="true">→</span></a></div></article>`;
}

function guideCard(guide,countries,themes){
 return `<article class="home-guide" data-guide-id="${esc(guide.id)}" data-country="${esc(guide.countryId)}" data-themes="${guide.suitableFor.map(esc).join(' ')}"><a class="home-guide-link" href="${esc(guide.href)}"><div class="home-guide-photo">${photo(guide.image,'(max-width: 700px) calc(100vw - 40px), (max-width: 1100px) calc(50vw - 42px), 378px')}</div><div class="home-guide-copy"><p class="home-guide-meta">${esc(countries.get(guide.countryId).name)}<span aria-hidden="true"> / </span><span lang="en">${esc(guide.englishName)}</span></p><h3>${esc(guide.name)}<span aria-hidden="true">↗</span></h3><p class="home-guide-summary">${esc(guide.summary)}</p><ul class="home-guide-tags" aria-label="旅行玩法">${guide.suitableFor.map(id=>`<li>${esc(themes.get(id).label)}</li>`).join('')}</ul></div></a></article>`;
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
<html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title><meta name="description" content="${description}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${origin}/trip/"><meta property="og:type" content="website"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${origin}/trip/"><meta property="og:site_name" content="鷹家遠行所"><meta property="og:locale" content="zh_TW"><meta property="og:image" content="${origin+esc(shareImage.src)}"><meta property="og:image:alt" content="${esc(shareImage.alt)}"><link rel="icon" href="/icons/favicon.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@500;700&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/trip/trip.css?v=20260914-nz-media-2"><link rel="stylesheet" href="/trip/home.css?v=20260928-destinations-1"><script defer src="/site-runtime.js?v=20260914-analytics-v1"></script><script defer src="/trip/home.js?v=20260928-destinations-1"></script><script type="application/ld+json">${JSON.stringify(schema).replaceAll('<','\\u003c')}</script></head>
<body class="travel-home"><a class="skip" href="#main">跳到主要內容</a><header class="home-masthead home-wrap"><a class="home-brand" href="/trip/" aria-label="鷹家遠行所首頁"><img src="/flights/assets/faraway-wordmark.svg" width="220" height="65" alt="鷹家遠行所"></a><p class="home-brand-note">把走過的地方，整理成你的下一站。</p><nav aria-label="主要導覽"><a href="#destinations">目的地</a><a href="#guides">找玩法</a><a href="#about">關於遠行所</a></nav></header>
<main id="main"><section class="home-destinations home-wrap" id="destinations" aria-labelledby="home-title"><header class="home-intro"><div><p class="home-eyebrow">${esc(catalog.hero.eyebrow)}</p><h1 id="home-title">${esc(catalog.hero.title)}</h1></div><p class="home-lead">${esc(catalog.hero.description)}</p></header><h2 class="home-sr-only">選個國家，開始探索</h2><div class="home-country-grid">${catalog.countries.map(country=>countryCard(country,guides)).join('')}</div></section>
<section class="home-discover" id="guides" aria-labelledby="guides-title"><div class="home-wrap"><span id="routes" class="home-route-anchor" aria-hidden="true"></span><header class="home-section-heading"><div><p class="home-eyebrow">FIND YOUR KIND OF JOURNEY</p><h2 id="guides-title">從喜歡的玩法，<br>找到下一站。</h2></div><p>山湖、街巷，或孩子期待的動物。<br>先找到想做的事，再走進當地的指南。</p></header><form class="home-filters" data-home-filters hidden aria-label="篩選旅行指南"><div class="home-filter"><label for="home-country-filter">目的地</label><select id="home-country-filter" name="country"><option value="all">所有國家</option>${catalog.countries.map(country=>`<option value="${esc(country.id)}">${esc(country.name)}</option>`).join('')}</select></div><div class="home-filter"><label for="home-theme-filter">想怎麼玩</label><select id="home-theme-filter" name="theme"><option value="all">所有玩法</option>${catalog.themes.map(theme=>`<option value="${esc(theme.id)}">${esc(theme.label)}</option>`).join('')}</select></div><button class="home-reset" type="reset">清除篩選</button></form><div class="home-results-heading"><p data-home-status role="status" aria-live="polite" aria-atomic="true">${catalog.guides.length} 份城市・區域指南</p><span>實訪照片 · 景點 · 行程安排</span></div><div class="home-guide-grid" data-home-guides>${catalog.guides.map(guide=>guideCard(guide,countries,themes)).join('')}</div><div class="home-empty" data-home-empty hidden><h3>這個組合還沒有指南</h3><p>換個玩法，或看看其他目的地。</p><button class="home-button" type="button" data-home-reset>查看所有指南</button></div><div class="home-more"><button class="home-button" type="button" data-home-more hidden>看更多指南 <span aria-hidden="true">↓</span></button></div></div></section>
<section class="home-about home-wrap" id="about" aria-labelledby="about-title"><div><p class="home-eyebrow">FROM OUR FAMILY TO YOURS</p><h2 id="about-title">從一家人的旅途，<br>到你自己的行程。</h2></div><div><p>我們是鷹式一家。把一起走過的街道、看過的風景，整理成可以拿來規劃旅行的指南。</p><p>從實訪照片挑喜歡的地方，再查交通、停留時間與行前提醒。把感興趣的留下來，也為自己的旅程留一點空白。</p><a class="home-text-link" href="#destinations">挑一個想去的地方 <span aria-hidden="true">↑</span></a></div></section></main>
<footer class="home-footer"><div class="home-wrap"><a class="home-brand" href="/trip/" aria-label="鷹家遠行所首頁"><img src="/flights/assets/faraway-wordmark.svg" width="220" height="65" alt="鷹家遠行所"></a><p>© 鷹式一家 Eaglish Family</p><nav aria-label="頁尾導覽"><a href="/">鷹家買物社 ↗</a><a href="/blog/">鷹家選物誌 ↗</a></nav></div></footer></body></html>`;
}
