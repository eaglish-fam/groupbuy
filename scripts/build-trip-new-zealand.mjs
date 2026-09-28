import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {basename, resolve} from 'node:path';
import {regions, byId, countryRoute, updatedAt} from '../trip/new-zealand-data.mjs';
import {galleries} from '../trip/new-zealand-galleries.mjs';
import {defaultSelectedStops, planCountry, planRegion} from '../trip/new-zealand-planner-model.mjs';
import {prioritizeFirstTravelImage} from './trip-image-priority.mjs';
import {plannerAssets, plannerEntry} from './trip-planner-entry.mjs';
import {newZealandAtlas} from './trip-new-zealand-atlas.mjs';

const origin = 'https://www.eaglish.store';
const root = resolve(import.meta.dirname, '..');
const imageRoot = resolve(root, 'trip/assets');
const media = new Map(JSON.parse(readFileSync(resolve(imageRoot,'nz-media.json'),'utf8')).map(item => [item.name,item]));
const markdownRoutes = new Map(regions.map(region => [region.manuscript,region.route]));
markdownRoutes.set('new-zealand-family-travel-overview.md',countryRoute);
const esc = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const schema = value => `<script type="application/ld+json">${JSON.stringify(value).replaceAll('<','\\u003c')}</script>`;
const external = (url,label) => `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(label)} ↗</a>`;
const placeLink = place => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.map)}`;

function photo(name,alt,priority=false,className='',sizes='(max-width:700px) 92vw, (max-width:1100px) 60vw, 720px') {
  if (!name) return '';
  const entry = media.get(name);
  const width = entry?.width ?? (name === 'nz-farm' ? 3274 : name === 'nz-boat' ? 3280 : 1440);
  const height = entry?.height ?? (name === 'nz-farm' || name === 'nz-boat' ? 4096 : 960);
  const desktop = existsSync(resolve(imageRoot,`${name}-1440.webp`)) ? `${name}-1440` : name;
  const variants = [640,960].filter(size => existsSync(resolve(imageRoot,`${name}-${size}.webp`))).map(size => `/trip/assets/${name}-${size}.webp ${size}w`);
  variants.push(`/trip/assets/${desktop}.webp ${Math.min(width,1440)}w`);
  return `<img${className?` class="${esc(className)}"`:''} src="/trip/assets/${desktop}.webp" srcset="${variants.join(', ')}" sizes="${esc(sizes)}" width="${width}" height="${height}" alt="${esc(alt)}" loading="${priority?'eager':'lazy'}" fetchpriority="${priority?'high':'low'}" decoding="async">`;
}

function placePhotos(regionId,place) {
  const photos = galleries[regionId]?.[place.id] ?? (place.photo ? [{name:place.photo,alt:place.photoAlt}] : []);
  if (!photos.length) return '';
  return `<div class="nz-place-gallery${photos.length===1?' nz-place-gallery--single':''}" aria-label="${esc(place.name)}旅行照片">${photos.map((item,index)=>`<figure class="nz-place-photo${index===0?' nz-place-photo--hero':''}${item.portrait?' nz-place-photo--portrait':''}">${photo(item.name,item.alt,false,'',index===0?'(max-width:700px) 92vw, (max-width:1100px) 60vw, 720px':'(max-width:700px) 45vw, (max-width:1100px) 29vw, 350px')}<figcaption>${esc(item.caption ?? item.alt)}</figcaption></figure>`).join('')}</div>`;
}

function safeHref(raw) {
  const manuscript = raw.replace(/^\.\//,'');
  if (markdownRoutes.has(manuscript)) return markdownRoutes.get(manuscript);
  if (raw.startsWith('#') || raw.startsWith('/trip/')) return raw;
  try {
    const url = new URL(raw);
    return ['http:','https:'].includes(url.protocol) ? url.href : null;
  } catch { return null; }
}

function inline(markdown) {
  const tokens = [];
  let safe = String(markdown).replace(/!\[([^\]]+)\]\(([^)]+)\)|\[([^\]]+)\]\(([^)]+)\)/g, (full,imgAlt,imgUrl,label,linkUrl) => {
    let html = '';
    if (imgAlt) {
      const name = basename(imgUrl).replace(/-(?:640|960|1440)\.webp$/,'.webp').replace(/\.webp$/,'');
      html = imgUrl.startsWith('/trip/assets/') && existsSync(resolve(imageRoot,`${name}.webp`)) ? `<figure class="nz-inline-photo">${photo(name,imgAlt)}<figcaption>${esc(imgAlt)}</figcaption></figure>` : '';
    } else {
      const href = safeHref(linkUrl);
      html = href ? `<a href="${esc(href)}"${/^https?:/.test(href)?' target="_blank" rel="noopener"':''}>${esc(label)}</a>` : esc(label);
    }
    const index = tokens.push(html)-1;
    return `\u0001${index}\u0002`;
  });
  safe = esc(safe).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
  return safe.replace(/\u0001(\d+)\u0002/g,(_,index) => tokens[Number(index)]);
}

function paragraphs(lines,anchorForH3 = () => null) {
  const result = [];
  let paragraph = [];
  let list = [];
  let table = [];
  const flushParagraph = () => { if (paragraph.length) { result.push(`<p>${inline(paragraph.join(' '))}</p>`); paragraph=[]; } };
  const flushList = () => { if (list.length) { result.push(`<ul>${list.map(line=>`<li>${inline(line)}</li>`).join('')}</ul>`); list=[]; } };
  const flushTable = () => {
    if (table.length) {
      const rows = table.filter((_,index) => index !== 1).map(row => row.split('|').slice(1,-1).map(value => value.trim()));
      result.push(`<div class="nz-table-scroll"><table><thead><tr>${rows[0].map(value=>`<th scope="col">${inline(value)}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map(row=>`<tr>${row.map(value=>`<td>${inline(value)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);
      table=[];
    }
  };
  for (const line of lines) {
    const value = line.trim();
    if (!value || value === '<a id="plan"></a>') { flushParagraph(); flushList(); flushTable(); continue; }
    if (value.startsWith('|')) { flushParagraph(); flushList(); table.push(value); continue; }
    flushTable();
    if (value.startsWith('- ')) { flushParagraph(); list.push(value.slice(2)); continue; }
    flushList();
    if (value.startsWith('### ')) {
      flushParagraph();
      const title=value.slice(4);
      const detail=anchorForH3(title);
      const anchor=typeof detail==='string'?detail:detail?.id;
      result.push(`<h3${anchor?` id="${esc(anchor)}"`:''}>${inline(title)}</h3>${typeof detail==='object'?detail?.after??'':''}`);
      continue;
    }
    if (value.startsWith('![')) { flushParagraph(); result.push(inline(value)); continue; }
    paragraph.push(value);
  }
  flushParagraph(); flushList(); flushTable();
  return result.join('');
}

function parseManuscript(name) {
  const lines = readFileSync(resolve(root,'trip/content/new-zealand',name),'utf8').replaceAll('\r\n','\n').split('\n');
  const title = lines.find(line=>line.startsWith('# '))?.slice(2).trim();
  if (!title) throw new Error(`Missing H1 in ${name}`);
  const firstHeading = lines.findIndex(line=>line.startsWith('## '));
  const intro = lines.slice(1,firstHeading).filter(line=>line.trim() && !line.startsWith('![')).join(' ').trim();
  const sections = [];
  for (const line of lines.slice(firstHeading)) {
    if (line.startsWith('## ')) sections.push({title:line.slice(3).trim(),lines:[]});
    else if (sections.length) sections.at(-1).lines.push(line);
  }
  return {title,intro,sections};
}

function head({title,description,path,hero,heroAlt,article}) {
  const image = hero ? `/trip/assets/${hero}.webp` : '/flights/assets/faraway-wordmark.svg';
  const breadcrumbItems = [['鷹家遠行所','/trip/'],['紐西蘭',countryRoute],...(article?[['區域攻略',path]]:[])];
  return `<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}｜鷹家遠行所</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${origin+path}"><meta property="og:type" content="${article?'article':'website'}"><meta property="og:title" content="${esc(title)}｜鷹家遠行所"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${origin+path}"><meta property="og:image" content="${origin+image}"><meta property="og:image:alt" content="${esc(heroAlt ?? '鷹家遠行所旅行標誌')}"><meta property="og:locale" content="zh_TW"><meta name="twitter:card" content="summary_large_image"><link rel="icon" href="/icons/favicon.svg"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Noto+Serif+TC:wght@500;700&family=Noto+Sans+TC:wght@400;500;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/trip/trip.css"><link rel="stylesheet" href="/trip/new-zealand.css"><link rel="stylesheet" href="/blog/reading-nav.css"><script defer src="/blog/reading-nav.js"></script>${plannerAssets}<script type="module" src="/trip/new-zealand-planner.js"></script><script defer src="/site-runtime.js?v=20260914-analytics-v1"></script>${schema({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:breadcrumbItems.map(([name,url],index)=>({'@type':'ListItem',position:index+1,name,item:origin+url}))})}${article?schema({'@context':'https://schema.org','@type':'Article',headline:title,description,inLanguage:'zh-Hant',datePublished:updatedAt,dateModified:updatedAt,author:{'@type':'Organization',name:'鷹式一家',url:origin+'/trip/'},publisher:{'@type':'Organization',name:'鷹家遠行所',url:origin+'/trip/'},image:hero?[origin+image]:[],mainEntityOfPage:origin+path}):schema({'@context':'https://schema.org','@type':'CollectionPage',name:title,description,url:origin+path,inLanguage:'zh-Hant',hasPart:regions.map(region=>({'@type':'WebPage',url:origin+region.route}))})}</head><body class="bkk-guide nz-guide${article?' nz-article':' nz-country'}"><a class="skip" href="#main">跳到主要內容</a><header class="masthead wrap"><a class="brand" href="/trip/" aria-label="鷹家遠行所首頁"><img src="/flights/assets/faraway-wordmark.svg" width="220" height="65" alt="鷹家遠行所"></a><span class="brand-note">出發，找下一個好玩的地方！<small>EAGLISH TRAVEL JOURNAL</small></span><nav aria-label="主要導覽"><a href="/trip/#destinations">目的地</a><a href="/trip/new-zealand/">紐西蘭</a><a href="/blog/">選物誌 ↗</a></nav></header>`;
}

const footer = `<footer class="footer"><div class="wrap footer-inner"><a class="brand" href="/trip/"><img src="/flights/assets/faraway-wordmark.svg" width="220" height="65" loading="lazy" decoding="async" alt="鷹家遠行所"></a><p>出發，找下一個好玩的地方！<br><small>© 鷹式一家 Eaglish Family</small></p><nav aria-label="頁尾導覽"><a href="/trip/new-zealand/">紐西蘭旅行總覽 ↗</a><a href="/">鷹家買物社 ↗</a><a href="/blog/">鷹家選物誌 ↗</a></nav></div></footer></body></html>`;
const breadcrumb = (title,article) => `<nav class="breadcrumbs" aria-label="麵包屑"><a href="/trip/">鷹家遠行所</a> / ${article?`<a href="${countryRoute}">紐西蘭</a> / <span aria-current="page">${esc(title)}</span>`:'<span aria-current="page">紐西蘭</span>'}</nav>`;

function planner(kind,region) {
  const options = kind === 'country' ? [7,13,21] : region.days;
  const choices = kind === 'country' ? regions.map(item=>({id:item.id,label:item.label})) : region.stops.map(item=>({id:item.id,label:item.name}));
  const defaults = kind === 'country' ? ['north-island'] : defaultSelectedStops(region.id);
  const initial = kind === 'country' ? planCountry() : planRegion(region.id);
  const staticDays = initial.itinerary.map(day=>`<li><strong>Day ${day.number}</strong>　${esc(day.label ?? (day.stops.length ? day.stops.map(stop=>stop.name).join(' → ') : '休息與交通緩衝'))}</li>`).join('');
  return `<div class="nz-planner" data-nz-planner data-kind="${kind}"${region?` data-region-id="${region.id}"`:''}><p>選日期、天數、步調和想去的站；路線會重新排。出發前請再核對營業、道路與預約通知。</p><div class="nz-plan-controls"><label>旅行天數<select name="days">${options.map(day=>`<option value="${day}">${day} 天</option>`).join('')}</select></label><label>步調<select name="pace"><option value="relaxed">悠閒</option><option value="packed">緊湊</option></select></label><label>第一天日期<input type="date" name="date" aria-label="第一天日期"></label></div><fieldset><legend>${kind==='country'?'想看的區域':'想排的景點'}</legend><div class="nz-plan-choices">${choices.map(choice=>`<label><input type="checkbox" data-choice value="${choice.id}"${defaults.includes(choice.id)?' checked':''}><span>${esc(choice.label)}</span></label>`).join('')}</div></fieldset><div data-nz-plan-output aria-live="polite"><p class="nz-plan-summary">以下是可離線閱讀的起始安排；啟用 JavaScript 後可調整。</p><ol class="nz-plan-days">${staticDays}</ol></div><p class="nz-plan-share">調整會寫入網址，複製目前網址即可分享；正式搜尋網址仍以本頁 canonical 為準。</p></div>`;
}

function renderFaq(lines) {
  const blocks = [];
  let question = null;
  let answer = [];
  for (const line of lines) {
    if (line.startsWith('### ')) {
      if (question) blocks.push(`<details><summary>${inline(question)}</summary>${paragraphs(answer)}</details>`);
      question=line.slice(4); answer=[];
    } else if (question) answer.push(line);
    else if (line.trim()) blocks.push(paragraphs([line]));
  }
  if (question) blocks.push(`<details><summary>${inline(question)}</summary>${paragraphs(answer)}</details>`);
  return blocks.join('');
}

function sectionId(section,index,region) {
  if (/常見問題/.test(section.title)) return 'faq';
  if (/影片|旅行照片|看我們的海岸旅行|先看我們的旅行現場/.test(section.title)) return 'video';
  if (/行程建議|行程試排|建議安排|按假期長度選路線|兩到三日建議|兩至三天建議|兩到三日行程/.test(section.title)) return 'plan';
  for (const stop of region?.stops ?? []) if (section.title.includes(stop.heading)) return stop.id;
  return `section-${index+1}`;
}

const legacyChristchurch = {
  'itinerary':'plan','plan-two':'plan','plan-three':'plan','plan-five':'plan',
  'city-walk':'tram','new-regent':'tram','riverside':'tram','gardens':'tram','gallery':'ninja-valley','airforce':'ninja-valley',
  'farm':'shamarra','dolphins':'akaroa-dolphins','museum':'akaroa-museum','fish-chips':'akaroa-museum','waterfront':'akaroa-museum','before':'before','places':'before','rain':'section-7'
};

function articlePage(region) {
  const manuscript = parseManuscript(region.manuscript);
  const description = manuscript.intro.slice(0,150);
  const photos = region.stops.filter(stop=>!stop.alternate).sort((a,b)=>Number(Boolean(b.photo))-Number(Boolean(a.photo))).slice(0,6);
  const toc = manuscript.sections.map((section,index)=>`<a href="#${sectionId(section,index,region)}">${esc(section.title)}</a>`).join('');
  const modernIds = new Set(['before',...manuscript.sections.map((section,index)=>sectionId(section,index,region)),...region.stops.map(stop=>stop.id)]);
  const legacyAliasFor = target => region.id==='christchurch-akaroa'
    ? Object.entries(legacyChristchurch).filter(([name,destination])=>destination===target && !modernIds.has(name)).map(([name])=>`<span id="${name}" class="nz-anchor-alias" aria-hidden="true"></span>`).join('')
    : '';
  const sections = manuscript.sections.map((section,index)=>{
    const id = sectionId(section,index,region);
    const place = region.stops.find(stop=>stop.id===id);
    const alias = region.id==='wanaka-tekapo' && id==='tekapo-lake' ? '<span id="church" class="nz-anchor-alias"></span>' : '';
    const source = place ? `<div class="nz-place-meta"><span>建議停留：${esc(place.time)}</span>${external(placeLink(place),'Google Maps')}</div>${placePhotos(region.id,place)}` : '';
    const content = id==='faq' ? renderFaq(section.lines) : paragraphs(section.lines,title => {
      const nestedPlace=region.stops.find(stop=>title.includes(stop.heading) && stop.id!==id);
      if (!nestedPlace) return null;
      return {id:nestedPlace.id,after:`<div class="nz-place-meta"><span>建議停留：${esc(nestedPlace.time)}</span>${external(placeLink(nestedPlace),'Google Maps')}</div>${placePhotos(region.id,nestedPlace)}`};
    });
    return `${legacyAliasFor(id)}${alias}<section id="${id}" class="nz-copy-section"><h2>${esc(section.title)}</h2>${id==='plan'?planner('region',region):''}${source}${content}</section>`;
  }).join('');
  const body = `${head({title:manuscript.title,description,path:region.route,hero:region.hero,heroAlt:region.heroAlt,article:true})}<main id="main"><header class="article-header wrap nz-header">${breadcrumb(region.label,true)}<p class="eyebrow"><i class="dot"></i> NEW ZEALAND / ${region.island==='north'?'NORTH':'SOUTH'} ISLAND</p><h1>${esc(manuscript.title)}</h1><p class="article-lead">${inline(manuscript.intro)}</p><p class="byline">撰文・影像：鷹式一家 <span>更新 ${updatedAt.replaceAll('-','.')}</span></p><figure class="nz-hero">${photo(region.hero,region.heroAlt,true)}<figcaption>${esc(region.heroCaption ?? region.label)}</figcaption></figure></header><div class="article-layout wrap"><nav class="toc guide-nav" data-reading-nav aria-label="文章目錄"><p class="eyebrow">${esc(region.short)}</p><a href="#before">景點與玩法</a>${toc}</nav><article class="prose">${legacyAliasFor('before')}<section id="before" class="nz-choose"><h2>看景點與玩法，挑想去的地方</h2><p>從照片與玩法挑選今天想去的地方。點進各站看交通、建議停留與雨備；跨城和預約活動記得預留移動及報到時間。</p><div class="nz-photo-grid">${photos.map(stop=>`<a class="nz-photo-card${stop.photo?'':' nz-photo-card--text'}" href="#${stop.id}">${photo(stop.photo,stop.photoAlt)}<span><strong>${esc(stop.name)}</strong><small>${esc(stop.time)}</small><em>看景點詳情 ↗</em></span></a>`).join('')}</div></section>${sections}<section class="nz-next"><h2>再選下一段</h2><p>這篇以 ${esc(region.label)} 為範圍；跨區移動請回國家總覽重新分配天數。</p><a href="${countryRoute}#regions">回紐西蘭旅行總覽 ↗</a></section></article></div></main>${plannerEntry}${footer}`;
  return prioritizeFirstTravelImage(body);
}


function countryPage() {
  const manuscript = parseManuscript('new-zealand-family-travel-overview.md');
  const description = manuscript.intro.slice(0,150);
  const sections = manuscript.sections.map((section,index)=>{
    const id = sectionId(section,index,null);
    const content = id==='faq' ? renderFaq(section.lines) : paragraphs(section.lines);
    return `<section id="${id}" class="nz-copy-section"><h2>${esc(section.title)}</h2>${id==='plan'?planner('country'):''}${content}</section>`;
  }).join('');
  const oldAnchors = Array.from({length:10},(_,index)=>`<span id="region-${index+1}" class="nz-anchor-alias"></span>`).join('');
  const cards = regions.map(region=>`<a class="nz-region-card" href="${region.route}" data-island-card="${region.island}">${photo(region.hero,region.heroAlt ?? `${region.label} 實景照片待核對`)}<span class="nz-region-card-copy"><small>${region.island==='north'?'北島':'南島'} · ${esc(region.short)}</small><strong>${esc(region.label)}</strong><span>${esc(region.summary)}</span><em>看完整攻略 ↗</em></span></a>`).join('');
  const toc = manuscript.sections.map((section,index)=>`<a href="#${sectionId(section,index,null)}">${esc(section.title)}</a>`).join('');
  const body = `${head({title:manuscript.title,description,path:countryRoute,hero:'nz-christchurch-tram',heroAlt:'一家人在基督城復古電車前合照',article:false})}<main id="main"><header class="article-header wrap nz-header">${breadcrumb('紐西蘭',false)}<p class="eyebrow"><i class="dot"></i> 🇳🇿 New Zealand / 旅行總覽</p><h1>${esc(manuscript.title)}</h1><p class="article-lead">${inline(manuscript.intro)}</p><p class="byline">撰文・影像：鷹式一家 <span>更新 ${updatedAt.replaceAll('-','.')}</span></p><div class="nz-country-hero"><figure>${photo('nz-christchurch-tram','一家人在基督城復古電車前合照',true)}<figcaption>南島 · 基督城電車</figcaption></figure><figure>${photo('nz-rotorua-luge','Rotorua Skyline 纜椅旅行畫格')}<figcaption>北島 · Rotorua</figcaption></figure><figure>${photo('nz-queenstown-lake','皇后鎮湖畔旅行畫格')}<figcaption>南島 · 皇后鎮</figcaption></figure></div></header><div class="article-layout wrap"><nav class="toc guide-nav" data-reading-nav aria-label="文章目錄"><p class="eyebrow">紐西蘭旅行總覽</p><a href="#regions">八個區域</a>${toc}</nav><article class="prose"><section id="regions" class="nz-choose"><span id="nz-places" class="nz-anchor-alias"></span>${oldAnchors}<h2>先選北島、南島，再看照片挑區域</h2><p>依玩法與交通選，不把八個區域塞進同一趟短旅行。地圖上的點與下方文字卡通往同一頁。</p>${newZealandAtlas()}<div class="nz-island-filters" role="group" aria-label="按島嶼篩選區域"><button type="button" data-island-filter="all" aria-pressed="true">全部</button><button type="button" data-island-filter="north" aria-pressed="false">北島</button><button type="button" data-island-filter="south" aria-pressed="false">南島</button></div><div class="nz-region-grid">${cards}</div></section>${sections}</article></div></main>${plannerEntry}${footer}`;
  return prioritizeFirstTravelImage(body);
}

function write(path,html) {
  const directory = resolve(root,`.`+path);
  mkdirSync(directory,{recursive:true});
  writeFileSync(resolve(directory,'index.html'),html);
}

export function buildNewZealand() {
  write(countryRoute,countryPage());
  for (const region of regions) write(region.route,articlePage(region));
  console.log(`Built New Zealand country hub and ${regions.length} regional guides.`);
}
