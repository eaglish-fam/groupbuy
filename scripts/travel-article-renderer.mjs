import {prioritizeFirstTravelImage} from './trip-image-priority.mjs';
import {plannerAssets,plannerEntry} from './trip-planner-entry.mjs';
import {planCebuBohol} from '../trip/cebu-bohol-planner-model.mjs';
import {planMediaRows,galleryImageSizes,topicImageSizes} from './travel-media-layout.mjs';

export const escapeHtml=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const origin='https://www.eaglish.store';
const jsonld=value=>`<script type="application/ld+json">${JSON.stringify(value).replaceAll('<','\\u003c')}</script>`;
export function safeHref(raw){
 if(/^#[a-z0-9-]+$/.test(raw)||/^\/(?!\/)[a-z0-9/_.?#=&%-]*$/i.test(raw))return raw;
 try{const u=new URL(raw);return ['https:','http:'].includes(u.protocol)?u.href:null;}catch{return null;}
}
export function inlineMarkdown(text){
 const tokens=[];
 let value=String(text).replace(/\[([^\]]+)\]\(([^)]+)\)/g,(_,label,url)=>{
  const href=safeHref(url);const index=tokens.push(href?`<a href="${escapeHtml(href)}"${href.startsWith('http')?' target="_blank" rel="noopener"':''}>${escapeHtml(label)}</a>`:escapeHtml(label))-1;
  return `\u0001${index}\u0002`;
 });
 value=escapeHtml(value).replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>').replace(/`([^`]+)`/g,'<span>$1</span>');
 return value.replace(/\u0001(\d+)\u0002/g,(_,i)=>tokens[Number(i)]);
}

// Deliberately small, escaped editorial Markdown subset; raw HTML never executes.
export function renderMarkdown(lines){
 const out=[];let para=[],list=[],table=[];
 const flushPara=()=>{if(para.length){out.push(`<p>${inlineMarkdown(para.join(' '))}</p>`);para=[];}};
 const flushList=()=>{if(list.length){out.push(`<ul>${list.map(v=>`<li>${inlineMarkdown(v)}</li>`).join('')}</ul>`);list=[];}};
 const flushTable=()=>{if(table.length){const rows=table.filter(v=>!/^\|[\s:|\-]+\|$/.test(v)).map(v=>v.split('|').slice(1,-1).map(x=>x.trim()));out.push(`<div class="cb-table-scroll"><table><thead><tr>${rows[0].map(v=>`<th scope="col">${inlineMarkdown(v)}</th>`).join('')}</tr></thead><tbody>${rows.slice(1).map(r=>`<tr>${r.map(v=>`<td>${inlineMarkdown(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`);table=[];}};
 for(const raw of lines){const v=raw.trim();if(!v||v==='---'){flushPara();flushList();flushTable();continue;}if(v.startsWith('|')){flushPara();flushList();table.push(v);continue;}flushTable();if(/^[-*] /.test(v)){flushPara();list.push(v.slice(2));continue;}flushList();if(/^#{3,4} /.test(v)){flushPara();const level=v.startsWith('#### ')?4:3;out.push(`<h${level}>${inlineMarkdown(v.slice(level+1))}</h${level}>`);continue;}if(/^!\[/.test(v))throw Error('Editorial image requires an explicit source-bound media mapping');para.push(v);}
 flushPara();flushList();flushTable();return out.join('');
}

export function parseArticleMarkdown(markdown,sectionMap){
 const lines=markdown.replaceAll('\r\n','\n').split('\n');
 const first=lines.findIndex(v=>v.startsWith('# ')),start=lines.findIndex(v=>v.startsWith('## '));
 if(first<0||start<=first)throw Error('Article requires H1, intro and H2 sections');
 const title=lines[first].slice(2).trim();
 const metadata={};
 if(lines[0]==='---'){
  const end=lines.indexOf('---',1);if(end<0||end>=first)throw Error('Invalid article frontmatter');
  for(const line of lines.slice(1,end)){const m=line.match(/^([a-z_]+): (.*)$/);if(m)metadata[m[1]]=m[2].trim();}
  if(metadata.title&&metadata.title!==title)throw Error('Frontmatter title differs from H1');
 }
 const introEnd=lines.findIndex((v,i)=>i>first&&v.startsWith('!['));
 const intro=lines.slice(first+1,introEnd>first&&introEnd<start?introEnd:start).filter(v=>v.trim()&&!/^撰文|^更新|^---$/.test(v)).join(' ').trim();
 const sections=[];
 let skip=false;
 for(const line of lines.slice(start)){if(line.startsWith('## ')){const title=line.slice(3).trim(),mapping=sectionMap[title];if(!mapping)throw Error(`Unmapped editorial heading: ${title}`);skip=!!mapping.omit;if(!skip)sections.push({title,...mapping,lines:[]});}else if(!skip&&sections.length&&!/^<a id="[a-z0-9-]+"><\/a>$/.test(line.trim()))sections.at(-1).lines.push(line);}
 const heroMatch=introEnd>first&&introEnd<start?lines[introEnd].match(/^!\[([^\]]*)\]\(([^)]+)\)$/):null;
 let captionLine=introEnd+1;while(captionLine<start&&!lines[captionLine].trim())captionLine++;
 const heroImage=heroMatch?{alt:heroMatch[1],source:heroMatch[2],caption:captionLine<start?lines[captionLine]:''}:null;
 return {title,intro,sections,metadata,...(heroImage?{heroImage}:{})};
}

export function renderTravelImage(media,{sizes='(max-width:700px) calc(100vw - 40px), 760px',card=false,thumbnail=false,decorative=false}={}){
 if(!media?.file||!media.alt||!media.width||!media.height||!media.variants?.length)throw Error('Missing source-bound responsive image');
 const variants=[...media.variants].sort((a,b)=>a.width-b.width),fallback=thumbnail?variants[0]:variants.find(v=>v.width===960)||variants.at(-1);
 return `<img src="${escapeHtml(fallback.file)}" srcset="${variants.map(v=>`${escapeHtml(v.file)} ${v.width}w`).join(', ')}" sizes="${escapeHtml(sizes)}" width="${fallback.width}" height="${fallback.height}" alt="${decorative?'':escapeHtml(media.alt)}" loading="lazy" fetchpriority="low" decoding="async" style="--cb-photo-ratio:${fallback.width}/${fallback.height};${card?`object-position:${escapeHtml(media.position||'50% 50%')}`:''}">`;
}
export function renderGallery(ids,media){
 if(!ids?.length)return '';
 return renderEditorialGallery(ids.map(id=>{const m=media[id];if(!m)throw Error(`Missing media ${id}`);return {media:m,caption:m.caption};}));
}
export function renderEditorialGallery(photos){
 if(!photos.length)return '';
 const rows=planMediaRows(photos.map(p=>p.media));
 return `<div class="cb-gallery${photos.length===1?' cb-gallery-single':''}" data-photo-count="${photos.length}" data-media-layout="source-ratio-v4">${rows.map(row=>`<div class="cb-gallery-row cb-gallery-row-${row.indices.length===1?'single':'pair'}${row.mixed?' cb-gallery-row-mixed':''}" style="--cb-columns:${row.columns}">${row.indices.map((photoIndex,i)=>{const photo=photos[photoIndex];return `<figure class="cb-editorial-photo ${row.indices.length===1?'cb-photo-lead':'cb-photo-support'}${row.portraits[i]?' cb-photo-portrait':''}" data-media-orientation="${row.portraits[i]?'portrait':'landscape'}">${renderTravelImage(photo.media,{sizes:galleryImageSizes(row,i)})}<figcaption>${inlineMarkdown(photo.caption)}</figcaption></figure>`;}).join('')}</div>`).join('')}</div>`;
}
export function renderSourceBoundLines(lines,config,media,{omitTables=false}={}){
 const out=[];let text=[],photos=[];
 const flushPhotos=()=>{if(!photos.length)return;out.push(renderEditorialGallery(photos));photos=[];};
 const flush=()=>{if(text.length){out.push(renderMarkdown(text));text=[];}};
 for(let i=0;i<lines.length;i++){
  const v=lines[i].trim();
  if(omitTables&&v.startsWith('|'))continue;
  const image=v.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
  if(!image){if(v)flushPhotos();text.push(lines[i]);continue;}
  flush();const id=config.mediaMap?.[image[2]],source=media[id];
  if(!source)throw Error(`Unmapped editorial image: ${image[2]}`);
  let next=i+1;while(next<lines.length&&!lines[next].trim())next++;
  let caption=source.caption;
  if(next<lines.length&&!/^#|^!\[|^\||^<a |^[-*] /.test(lines[next].trim())){caption=lines[next];i=next;}
  photos.push({media:{...source,alt:image[1]},caption});
 }
 flushPhotos();flush();return out.join('');
}
function faq(lines){
 const blocks=[];let question,answer=[];
 const flush=()=>{if(question)blocks.push(`<details><summary>${inlineMarkdown(question)}</summary>${renderMarkdown(answer)}</details>`);};
 for(const line of lines){if(line.startsWith('### ')){flush();question=line.slice(4);answer=[];}else if(question)answer.push(line);else if(line.trim())blocks.push(renderMarkdown([line]));}flush();return blocks.join('');
}
function planner(){
 const p=planCebuBohol();
 const initial=p.days.map(d=>`<h4>第 ${d.number} 個完整日</h4><ol>${d.stops.map(s=>`<li><a href="${s.href}">${escapeHtml(s.label)}</a>：${escapeHtml(s.note)}</li>`).join('')}</ol><p>${escapeHtml(d.rest)}</p>`).join('');
 return `<div class="cb-planner" data-cb-planner><form hidden><div class="cb-plan-controls"><label>完整薄荷島遊玩日<select name="days"><option value="1">1 個完整日</option><option value="2">2 個完整日</option></select></label><label>步調<select name="pace"><option value="relaxed">悠閒</option><option value="packed">緊湊</option></select></label></div><fieldset><legend>想安排的活動</legend><label><input type="checkbox" name="buggy"> 家庭 buggy</label><label><input type="checkbox" name="lunch"> Loboc 午餐船</label></fieldset></form><div data-plan-output aria-live="polite" aria-atomic="false"><p>兩個完整日的悠閒參考安排；啟用 JavaScript 後可調整。</p>${initial}<h4>完整日之外，再留移動与宿霧停留</h4><p>${escapeHtml(p.transfers.before)}</p><p>${escapeHtml(p.transfers.after)}</p><p>${escapeHtml(p.scope)}</p></div><p class="cb-plan-note">調整後可直接複製網址分享；船班、場館與預約仍需依出發日確認。</p></div>`;
}

export function validateTravelArticle(article,config,media){
 const type=config.articleType||'destination';
 if(!['destination','hotel'].includes(type))throw Error('Unsupported article type');
 const pathPattern=type==='hotel'?/^\/trip\/(?:guides|stays)\/[a-z0-9-]+\/$/:/^\/trip\/guides\/[a-z0-9-]+\/$/;
 if(!article.title||!article.intro||!pathPattern.test(config.path))throw Error('Missing article identity');
 const ids=article.sections.map(s=>s.id);if(new Set(ids).size!==ids.length||ids.some(id=>!/^[a-z0-9-]+$/.test(id)))throw Error('Invalid/duplicate section ID');
 for(const id of type==='hotel'?['faq']:[config.chooseId||'before','faq','plan',config.videoId||'video'])if(!ids.includes(id))throw Error(`Required section: ${id}`);
 if(type==='destination'&&!(ids.indexOf('faq')<ids.indexOf('plan')&&ids.indexOf('plan')<ids.indexOf(config.videoId||'video')))throw Error('Planner must follow FAQ and precede videos');
 if(type==='hotel'){
  if(ids.length<2||ids.length>24||ids.includes('plan')||config.planner)throw Error('Hotel articles must not attach the Cebu/Bohol day planner');
  if(!config.related?.length||config.related.length>6||config.related.some(l=>!l.label||!/^\/trip\/(?!\/)[a-z0-9/#-]+$/.test(l.href)))throw Error('Hotel requires bounded, reviewed related travel links');
 }
 if(!media[config.hero])throw Error('Missing hero');
 for(const card of config.cards||[]){if(!ids.includes(card.target)||!media[card.image])throw Error(`Invalid photo card: ${card.target}`);}
 for(const topic of config.topics||[]){
  if(!ids.includes(topic.target)||!media[topic.image]||!topic.label)throw Error(`Invalid topic entry: ${topic.target}`);
  if(topic.labelLines&&(!Array.isArray(topic.labelLines)||topic.labelLines.length!==2||topic.labelLines.some(s=>typeof s!=='string'||!s.trim())))throw Error('Invalid topic label lines');
  if(topic.position&&!/^(?:100|\d{1,2})(?:\.\d+)?% (?:100|\d{1,2})(?:\.\d+)?%$/.test(topic.position))throw Error('Invalid topic focal position');
 }
 if(config.countryId&&!/^[a-z0-9-]+$/.test(config.countryId))throw Error('Invalid article country ID');
 for(const section of article.sections)for(const id of section.images||[])if(!media[id])throw Error(`Missing section image: ${id}`);
 return true;
}

export function renderTravelArticle(article,config,media){
 validateTravelArticle(article,config,media);
 const isHotel=config.articleType==='hotel';
 if(article.heroImage&&config.mediaMap?.[article.heroImage.source]!==config.hero)throw Error('Editorial hero does not match source-bound configuration');
 media={...media};
 for(const line of article.sections.flatMap(s=>s.lines)){const image=line.trim().match(/^!\[([^\]]*)\]\(([^)]+)\)$/);if(image){const id=config.mediaMap?.[image[2]];if(!media[id])throw Error(`Unmapped editorial image: ${image[2]}`);media[id]={...media[id],alt:image[1]};}}
 const description=article.metadata?.description||article.intro.replace(/\*\*|`/g,'').slice(0,160),canonical=origin+config.path,hero={...media[config.hero],...(article.heroImage?{alt:article.heroImage.alt,caption:article.heroImage.caption}:{})};
 const topics=config.topics?.length?`<nav class="cb-topic-entries" aria-label="景點、餐廳與住宿" data-media-layout="topic-circles-v5">${config.topics.map(t=>`<a href="#${t.target}" aria-label="${escapeHtml(t.label)}"><span class="cb-topic-photo" style="--cb-topic-position:${escapeHtml(t.position||'50% 50%')}">${renderTravelImage(media[t.image],{sizes:topicImageSizes(),thumbnail:true,decorative:true})}</span><span class="cb-topic-label">${(t.labelLines||[t.label]).map(line=>`<span>${escapeHtml(line)}</span>`).join('')}</span><span class="cb-topic-chevron" aria-hidden="true"></span></a>`).join('')}</nav>`:'';
 const toc=`<nav class="toc guide-nav cb-toc" data-reading-nav aria-label="文章目錄"><p class="eyebrow">${escapeHtml(config.tocTitle)}</p>${article.sections.map((s,i)=>`<a href="#${s.id}"><span class="cb-toc-number">${String(i+1).padStart(2,'0')}</span> <span>${escapeHtml(s.label)}</span></a>`).join('')}</nav>`;
 const cards=`<div class="cb-photo-cards">${(config.cards||[]).map(c=>`<a href="#${c.target}">${renderTravelImage(media[c.image],{card:true,sizes:'(max-width:700px) calc((100vw - 50px)/2), 240px'})}<span><strong>${escapeHtml(c.name)}</strong><small>${escapeHtml(c.region)}</small>${c.reason?`<small>${escapeHtml(c.reason)}</small>`:''}<em>${escapeHtml(c.duration)}</em></span></a>`).join('')}</div>`;
 const sections=article.sections.map(s=>{
  let content=s.id==='faq'?faq(s.lines):renderSourceBoundLines(s.lines,config,media,{omitTables:s.id===(config.chooseId||'before')});
  if(s.images?.length){const gallery=renderGallery(s.images,media),i=content.indexOf('</p>');content=i>=0?content.slice(0,i+4)+gallery+content.slice(i+4):gallery+content;}
  if(!isHotel&&s.id===(config.chooseId||'before')){const i=content.indexOf('</p>');content=i>=0?content.slice(0,i+4)+cards+content.slice(i+4):cards+content;}
  if(s.id==='plan'){
   const i=content.indexOf('</p>'),intro=i>=0?content.slice(0,i+4):'',examples=i>=0?content.slice(i+4):content;
   content=intro+planner()+`<details class="cb-static-examples"><summary>看一至兩天的行程範例</summary>${examples}</details>`;
  }
  return `<section id="${s.id}"${s.id===(config.videoId||'video')?' class="video-end"':''}><h2>${escapeHtml(s.title)}</h2>${content}</section>`;
 }).join('');
 const schema=jsonld({'@context':'https://schema.org','@type':'Article',headline:article.title,description,inLanguage:'zh-Hant',datePublished:config.updatedAt,dateModified:config.updatedAt,author:{'@type':'Organization',name:config.author,url:origin+'/trip/'},publisher:{'@type':'Organization',name:'鷹家遠行所',url:origin+'/trip/'},image:[origin+hero.file],mainEntityOfPage:canonical})+jsonld({'@context':'https://schema.org','@type':'BreadcrumbList',itemListElement:[{position:1,name:'鷹家遠行所',item:origin+'/trip/'},{position:2,name:config.tocTitle,item:canonical}].map(x=>({'@type':'ListItem',...x}))});
 const html=`<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(article.title)}｜鷹家遠行所</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}"><meta property="og:type" content="article"><meta property="og:title" content="${escapeHtml(article.title)}｜鷹家遠行所"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:url" content="${canonical}"><meta property="og:image" content="${origin+hero.file}"><meta property="og:image:alt" content="${escapeHtml(hero.alt)}"><meta property="og:locale" content="zh_TW"><link rel="icon" href="/icons/favicon.svg"><link rel="stylesheet" href="/trip/trip.css"><link rel="stylesheet" href="/trip/bangkok.css"><link rel="stylesheet" href="/trip/cebu-bohol.css"><link rel="stylesheet" href="/blog/reading-nav.css"><script defer src="/blog/reading-nav.js"></script>${plannerAssets}<script type="module" src="/trip/cebu-bohol-planner.mjs"></script><script defer src="/site-runtime.js"></script>${schema}</head><body class="bkk-guide cb-guide"><a class="skip" href="#main">跳到主要內容</a><header class="masthead wrap"><a class="brand" href="/trip/" aria-label="鷹家遠行所首頁"><img src="/flights/assets/faraway-wordmark.svg" width="220" height="65" alt="鷹家遠行所"></a><span class="brand-note">把走過的地方，整理成你的下一站。</span><nav aria-label="主要導覽"><a href="/trip/#destinations">目的地</a><a href="#before">景點與玩法</a><a href="#plan">行程規劃</a></nav></header><main id="main"><header class="article-header wrap cb-header"><nav class="breadcrumbs" aria-label="麵包屑"><a href="/trip/">鷹家遠行所</a> / <span aria-current="page">${escapeHtml(config.tocTitle)}</span></nav><p class="eyebrow">${escapeHtml(config.eyebrow)}</p><h1>${escapeHtml(article.title)}</h1><p class="article-lead">${inlineMarkdown(article.intro)}</p><p class="byline">撰文・影像：${escapeHtml(config.author)} <span>更新 ${config.updatedAt.replaceAll('-','.')}</span></p><figure class="cb-hero">${renderTravelImage(hero,{sizes:'(max-width:700px) calc(100vw - 40px), (max-width:1280px) calc(100vw - 96px), 1184px'})}<figcaption>${escapeHtml(hero.caption)}</figcaption></figure></header><div class="article-layout wrap">${toc}<article class="prose">${sections}</article></div></main>${plannerEntry}<footer class="footer"><div class="wrap footer-inner"><a class="brand" href="/trip/"><img src="/flights/assets/faraway-wordmark.svg" width="220" height="65" alt="鷹家遠行所" loading="lazy"></a><p>© 鷹式一家 Eaglish Family</p><nav aria-label="頁尾導覽"><a href="/">鷹家買物社 ↗</a><a href="/blog/">鷹家選物誌 ↗</a></nav></div></footer></body></html>`;
 let page=html;
 if(isHotel){
  // Same editorial shell and chapter navigation, but no foreign itinerary
  // controller, floating day-planner action or fabricated lodging schema.
  const related=`<nav class="cb-related" aria-label="相關旅行攻略">${config.related.map(l=>`<a href="${escapeHtml(l.href)}">${escapeHtml(l.label)}</a>`).join('')}</nav>`;
  page=page.replace(plannerAssets,'').replace(plannerEntry,'').replace('<script type="module" src="/trip/cebu-bohol-planner.mjs"></script>','')
   .replace('<nav aria-label="主要導覽"><a href="/trip/#destinations">目的地</a><a href="#before">景點與玩法</a><a href="#plan">行程規劃</a></nav>',`<nav aria-label="主要導覽"><a href="#${article.sections[0].id}">住宿介紹</a><a href="#faq">入住問題</a><a href="${escapeHtml(config.related[0].href)}">相關攻略</a></nav>`)
   .replace(`${sections}</article>`,`${sections}${related}</article>`);
 }
 page=page.replaceAll('href="#before"',`href="#${config.chooseId||'before'}"`).replace('</figure></header>','</figure>'+topics+'</header>').replace('<body class="bkk-guide cb-guide">',`<body class="bkk-guide cb-guide${isHotel?' cb-hotel':''}"${config.countryId?` data-country="${escapeHtml(config.countryId)}"`:''}>`).replace('兩個完整日的悠閒參考安排','一個完整日的悠閒參考安排').replaceAll('移動与','移動與');
 return prioritizeFirstTravelImage(page);
}
