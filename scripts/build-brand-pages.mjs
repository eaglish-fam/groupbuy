// Writes brand/<slug>/index.html for every entry in config/brand-pages.json.
// Static HTML: the brand name, the intro and the group-buy facts are in the file, not
// loaded from the Sheet by script. The page shows only what the config knows; an unknown
// date, product list or price is written as unknown, never filled in. The buy button
// exists only when status is "open" and an approved /go/ slug is set; otherwise the
// page says 開團時間待公告 and has no buy link.
// A page is indexable only when `indexable` is true; that needs a journal article that exists under blog/
// (Bingo's rule: thin brand pages stay noindex until the brand has an article and a product card).
import {readFileSync,writeFileSync,mkdirSync,existsSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const origin='https://www.eaglish.store';
const marker='<!-- generated:brand-pages -->';
const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const STATUS=['open','closed','unknown'];
const slugRe=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validatePages(config,goLinks){
 if(config.schema!=='eaglish.brand-pages/v1'||!Array.isArray(config.pages)||!config.pages.length)throw Error('brand-pages: schema or pages missing');
 const seen=new Set();
 const goSlugs=new Set((goLinks?.links||[]).map(l=>l.slug));
 for(const p of config.pages){
  if(!slugRe.test(p.slug||'')||p.slug.length>40)throw Error('brand-pages: bad slug '+p.slug);
  if(seen.has(p.slug))throw Error('brand-pages: duplicate slug '+p.slug);seen.add(p.slug);
  for(const k of ['brand','title','description','h1','intro'])if(!String(p[k]||'').trim())throw Error(`brand-pages: ${k} missing for ${p.slug}`);
  if(!p.title.includes(p.brand)||!p.h1.includes(p.brand))throw Error('brand-pages: title and H1 must contain the brand name: '+p.slug);
  if(p.title.length>70)throw Error('brand-pages: title too long: '+p.slug);
  if(p.description.length<55||p.description.length>180)throw Error('brand-pages: description must be 55-180 characters (same range as the article audit): '+p.slug);
  if(!STATUS.includes(p.status))throw Error(`brand-pages: bad status ${p.status} for ${p.slug}`);
  if(typeof p.indexable!=='boolean')throw Error('brand-pages: indexable must be true or false: '+p.slug);
  if(p.article!==undefined&&!/^\/blog\/[a-z0-9-]+\/$/.test(p.article))throw Error('brand-pages: article must be /blog/<slug>/: '+p.slug);
  if(p.indexable&&(!p.article||!existsSync(resolve(root,p.article.slice(1),'index.html'))))throw Error('brand-pages: an indexable page needs an existing journal article: '+p.slug);
  if(!Array.isArray(p.sections)||p.sections.length<1)throw Error('brand-pages: sections missing: '+p.slug);
  for(const s of p.sections)if(!String(s.heading||'').trim()||!String(s.text||'').trim())throw Error('brand-pages: empty section in '+p.slug);
  if(p.status==='open'){
   if(!p.buy||!goSlugs.has(p.buy.goSlug)||!String(p.buy.label||'').trim())throw Error('brand-pages: an open page needs buy.goSlug that exists in go-links and a label: '+p.slug);
  }else if(p.buy!==null&&p.buy!==undefined)throw Error('brand-pages: only an open page may have a buy button: '+p.slug);
  if(!/^\/(?:[a-z0-9-]+\/)*$/.test(p.more?.href||'')||p.more.href.startsWith('//'))throw Error('brand-pages: more.href must be an internal path: '+p.slug);
  if(!String(p.more.label||'').trim())throw Error('brand-pages: more.label missing: '+p.slug);
 }
 return config.pages;
}

export function renderBrandPage(p){
 const url=`${origin}/brand/${p.slug}/`;
 const buy=p.buy
  ?`<p><a class="brand-buy" href="/go/${esc(p.buy.goSlug)}/?c=brand-${esc(p.slug)}">${esc(p.buy.label)}</a></p>`
  :`<p class="brand-buy-status">開團時間待公告</p>`;
 const sections=p.sections.map(s=>`<section><h2>${esc(s.heading)}</h2><p>${esc(s.text)}</p></section>`).join('');
 const ld={'@context':'https://schema.org','@type':'WebPage',url,name:p.title,description:p.description,inLanguage:'zh-TW',about:{'@type':'Brand',name:p.brand},publisher:{'@id':origin+'/#organization'}};
 return `<!doctype html>
${marker}
<html lang="zh-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(p.title)}</title>
<meta name="description" content="${esc(p.description)}">
<meta name="robots" content="${p.indexable?'index,follow,max-image-preview:large':'noindex,follow'}">
<link rel="canonical" href="${url}">
<meta property="og:site_name" content="鷹家買物社"><meta property="og:type" content="website"><meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(p.title)}"><meta property="og:description" content="${esc(p.description)}">
<meta property="og:image" content="${origin}/logo-eaglish-text.png"><meta property="og:locale" content="zh_TW">
<link rel="stylesheet" href="/content-hubs.css?v=20260915"><script src="/site-runtime.js" defer></script>
<script type="application/ld+json">${JSON.stringify(ld)}</script>
</head><body class="guide-page"><header><a href="/">鷹家買物社</a><nav aria-label="網站導覽"><a href="/blog/">選物誌</a><a href="/guides/">選購指南</a><a href="/calendar/">團購行事曆</a></nav></header><main><h1>${esc(p.h1)}</h1><p class="lead">${esc(p.intro)}</p>${buy}${sections}<p><a href="${esc(p.more.href)}">${esc(p.more.label)} →</a></p></main><footer><a href="/#catalog">回到商品目錄 →</a></footer></body></html>
`;
}

export function build(){
 const goLinks=JSON.parse(readFileSync(resolve(root,'config/go-links.json'),'utf8'));
 const pages=validatePages(JSON.parse(readFileSync(resolve(root,'config/brand-pages.json'),'utf8')),goLinks);
 for(const p of pages){
  const file=resolve(root,'brand',p.slug,'index.html');
  if(existsSync(file)&&!readFileSync(file,'utf8').includes(marker))throw Error(`brand-pages: ${p.slug} is a hand-made page; pick another slug`);
  mkdirSync(dirname(file),{recursive:true});writeFileSync(file,renderBrandPage(p));
 }
 return pages.length;
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log('Brand pages built:',build());
