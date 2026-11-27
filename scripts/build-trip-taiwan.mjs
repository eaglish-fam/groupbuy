// /trip/taiwan/: a fully static hub of the reviewed Taiwan atlas places.
// Every card, count and county shape is rendered here from portable sources, so the
// page is crawlable and complete without JavaScript; trip/taiwan-hub.js only filters.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {geoMercator,geoPath,geoContains} from 'd3-geo';

const origin='https://www.eaglish.store';
const pagePath='/trip/taiwan/';
const categories=[['attraction','景點'],['restaurant','餐廳'],['hotel','住宿']];
const regionSlugs={'tw-north':'north','tw-central':'central','tw-south':'south','tw-east':'east','tw-offshore':'offshore'};
// The county label point of 新北市 sits inside its Taipei hole; move that label to 烏來
// and nudge 基隆市 east (both still inside their county, checked with geoContains
// below) so the small northern numbers do not collide.
const labelOverrides={'tw-new-taipei-city':[121.55,24.86],'tw-keelung-city':[121.77,25.12]};
// 連江 and 金門 lie far off the main-island frame; they get small insets instead of
// shrinking the island. 澎湖 fits at its true position inside the same frame.
const insetCountyIds=['tw-lienchiang-county','tw-kinmen-county'];
const W=360,H=470;

const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hash=text=>createHash('sha256').update(text).digest('hex').slice(0,12);
const round=n=>Math.round(n*10)/10;

// d3 path context that rounds to 0.1px and drops points closer than ~0.6px, keeping
// the county outlines legible at map size while the inline SVG stays small.
function compactPath(projection){
 let d='',last=null,start=null;
 const ctx={
  moveTo(x,y){x=round(x);y=round(y);d+=`M${x} ${y}`;last=start=[x,y];},
  lineTo(x,y){x=round(x);y=round(y);if(last&&Math.hypot(x-last[0],y-last[1])<0.6)return;d+=`L${x} ${y}`;last=[x,y];},
  closePath(){d+='Z';last=start;},
  arc(){}
 };
 const path=geoPath(projection,ctx);
 return feature=>{d='';path(feature);return d.replace(/M([^MZ]+)Z(?=M|$)/g,(m,body)=>body.split('L').length<3?'':m);};
}

const fill=n=>n>=11?'#15366a':n>=7?'#4f6d99':n>=3?'#8fa5c4':n>=1?'#c9d3e2':'#e6dfd1';
const legend=[['1–2','#c9d3e2'],['3–6','#8fa5c4'],['7–10','#4f6d99'],['11 以上','#15366a']];

export function placeLink(place){
 // A reviewed article is the richest detail the site has. The /trip/ home opens other
 // places only in an in-page dialog (no addressable URL), so those cards use the
 // place's own reviewed Google Maps search link in a new tab.
 if(place.articleUrl){
  const url=new URL(place.articleUrl,origin);
  return {href:url.origin===origin?url.pathname+url.search+url.hash:url.href,kind:'article',external:url.origin!==origin};
 }
 const maps=new URL(place.maps.search);
 if(maps.origin!=='https://www.google.com')throw Error('Unexpected Maps origin: '+place.id);
 return {href:maps.href,kind:'maps',external:true};
}

export function taiwanHubModel(root){
 const read=rel=>readFileSync(resolve(root,rel),'utf8');
 const config=JSON.parse(read('trip/data/taiwan-atlas-r24.json'));
 const {places,geography}=config.data;
 const geo=JSON.parse(read('trip/taiwan-counties.json'));
 const counties=geography.counties.filter(c=>c.countryId==='tw');
 const regions=geography.regions.filter(r=>r.countryId==='tw');
 const countyById=new Map(counties.map(c=>[c.id,c]));
 if(places.length!==53)throw Error('Expected the reviewed 53 Taiwan places');
 const records=places.map(p=>{
  const county=countyById.get(p.countyIds[0]);
  if(!county)throw Error('Unknown county for '+p.id);
  if(!categories.some(([id])=>id===p.category))throw Error('Unknown category for '+p.id);
  if(!p.whatToExpect)throw Error('Missing summary for '+p.id);
  return {place:p,county,region:county.regionId,link:placeLink(p)};
 });
 // Counted once, by the first county, so every place appears in exactly one group.
 const groups=counties.map((county,order)=>({county,order,items:records.filter(r=>r.county.id===county.id)})).filter(g=>g.items.length)
  .sort((a,b)=>b.items.length-a.items.length||a.order-b.order);
 const regionRows=regions.map(region=>{
  const regionGroups=groups.filter(g=>g.county.regionId===region.id);
  const names=regionGroups.map(g=>g.county.name),short=names.map(n=>n.replace(/[市縣]$/,''));
  return {region,slug:regionSlugs[region.id],count:regionGroups.reduce((n,g)=>n+g.items.length,0),
   counties:short.map((s,i)=>short.indexOf(s)!==short.lastIndexOf(s)?names[i]:s)};
 });
 if(regionRows.some(r=>!r.slug))throw Error('Unmapped Taiwan region');
 const categoryCounts=Object.fromEntries(categories.map(([id])=>[id,places.filter(p=>p.category===id).length]));
 return {config,places,records,groups,regionRows,categoryCounts,geo,counties,countyById};
}

function renderMap(model){
 const countByCounty=new Map(model.groups.map(g=>[g.county.id,g.items.length]));
 const projection=geoMercator().fitExtent([[12,14],[W-12,H-14]],{type:'MultiPoint',coordinates:[[119.28,21.85],[122.05,25.35],[119.28,25.35],[122.05,21.85]]});
 const draw=compactPath(projection);
 const shapes=[],labels=[];
 const label=(x,y,n)=>labels.push(`<text x="${round(x)}" y="${round(y)}" ${n>=7?' class="on-dark"':''}>${n}</text>`);
 for(const feature of model.geo.features){
  const id=feature.properties.id,county=model.countyById.get(id);
  if(!county)throw Error('Unknown county geometry '+id);
  if(insetCountyIds.includes(id))continue;
  const n=countByCounty.get(id)||0,d=draw(feature);
  if(!d)throw Error('County outside the map frame: '+id);
  shapes.push(`<path d="${d}" fill="${fill(n)}" data-region="${regionSlugs[county.regionId]}"${n?' class="has-places"':''}><title>${escape(county.name)} ${n} 個</title></path>`);
  if(n){
   const point=labelOverrides[id]||feature.properties.labelPoint;
   if(!geoContains(feature,point))throw Error('Label point outside county '+id);
   const [x,y]=projection(point);label(x,y+4.5,n);
  }
 }
 const insets=insetCountyIds.map((id,i)=>{
  const feature=model.geo.features.find(f=>f.properties.id===id),county=model.countyById.get(id),n=countByCounty.get(id)||0;
  const box={x:12,y:14+i*86,w:86,h:74};
  const local=geoMercator().fitExtent([[box.x+8,box.y+6],[box.x+box.w-8,box.y+box.h-24]],feature);
  const d=compactPath(local)(feature);
  const name=county.name.replace(/[市縣]$/,'');
  return `<g class="inset${n?' has-places':''}" data-region="${regionSlugs[county.regionId]}"><rect x="${box.x}" y="${box.y}" width="${box.w}" height="${box.h}" rx="8"/><path d="${d}" fill="${fill(n)}" style="stroke:${fill(n)};stroke-width:2.4"><title>${escape(county.name)} ${n} 個</title></path><text class="inset-name" x="${box.x+10}" y="${box.y+box.h-8}">${escape(name)}</text>${n?`<text class="inset-count" x="${box.x+box.w-10}" y="${box.y+box.h-8}">${n}</text>`:''}</g>`;
 });
 return `<svg class="hub-map-svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true" focusable="false"><g class="counties">${shapes.join('')}</g>${insets.join('')}<g class="labels">${labels.join('')}</g></svg>`;
}

function renderCard(record,index){
 const {place,link}=record,category=categories.find(([id])=>id===place.category)[1];
 const media=place.photo
  ?`<div class="hub-card-media"><img src="${escape(place.photo.src)}" width="${place.photo.width}" height="${place.photo.height}" alt="${escape(place.photo.alt)}" ${index<3?'fetchpriority="high"':'loading="lazy"'} decoding="async"></div>`
  :'<div class="hub-card-media is-empty"><span>照片待補</span></div>';
 const label=link.kind==='article'?'看完整文章':'看地點資訊';
 const hint=link.kind==='article'?'':'（Google 地圖，另開新分頁）';
 const attrs=link.external?' target="_blank" rel="noopener noreferrer"':'';
 return `<li class="hub-card" data-category="${place.category}" data-place-id="${escape(place.id)}">${media}<h3 class="hub-card-title">${escape(place.name)}</h3><p class="hub-card-cat">${category}</p><p class="hub-card-text">${escape(place.whatToExpect)}</p><a class="hub-card-link" href="${escape(link.href)}"${attrs} data-link-kind="${link.kind}">${label}<span class="sr-only">：${escape(place.name)}${hint}</span></a></li>`;
}

function wordmark(root,n,width){
 const template=readFileSync(resolve(root,'trip/content/home-r24.html.template'),'utf8');
 const svg=template.match(/<svg class="home-wordmark"[\s\S]*?<\/svg>/)?.[0];
 if(!svg||!svg.includes('aria-labelledby="home-wordmark-title-1"'))throw Error('Expected the reviewed 鷹家遠行所 wordmark');
 return svg.replace('class="home-wordmark"','class="hub-wordmark"').replace(/width="\d+" height="\d+"/,`width="${width}" height="${Math.round(width*968/4969)}"`).replaceAll('home-wordmark-title-1','hub-wordmark-title-'+n);
}

export function renderTaiwanHub(root){
 const model=taiwanHubModel(root);
 const {places,groups,regionRows,categoryCounts}=model;
 const total=places.length;
 const read=rel=>readFileSync(resolve(root,rel),'utf8');
 const cssVersion=hash(read('trip/taiwan-hub.css')),jsVersion=hash(read('trip/taiwan-hub.js'));
 // Shared analytics runtime, versioned exactly as scripts/normalize-site-seo.mjs does.
 const runtimeVersion=hash(read('site-runtime.js'));
 const title=`台灣親子景點：鷹式一家去過的 ${total} 個地方｜鷹家遠行所`;
 const description=`鷹式一家帶孩子去過的 ${total} 個台灣地點：${categoryCounts.attraction} 個景點、${categoryCounts.restaurant} 間餐廳、${categoryCounts.hotel} 間住宿，依地區與縣市分類，每個地點都有一句重點和地圖連結。`;
 const canonical=origin+pagePath;
 const share=places.find(p=>p.id==='place-tw-taipei101'&&p.photo)||places.find(p=>p.photo);
 const countyText=groups.map(g=>`${g.county.name} ${g.items.length} 個`).join('、');
 const regionText=regionRows.map(r=>`${r.region.name} ${r.count} 個`).join('、');
 let cardIndex=0;
 const sections=groups.map(g=>`<section class="hub-county" data-region="${regionSlugs[g.county.regionId]}" aria-labelledby="county-${g.county.id}"><div class="hub-county-head"><h2 id="county-${g.county.id}">${escape(g.county.name)}</h2><span class="hub-county-count" data-total="${g.items.length}">${g.items.length} 個</span></div><ul class="hub-grid">${g.items.map(r=>renderCard(r,cardIndex++)).join('')}</ul></section>`).join('');
 const regionButtons=[`<li><button type="button" data-region-filter="all" aria-pressed="true"><span class="hub-region-name">全台</span><span class="hub-region-counties"></span><span class="hub-region-count">${total}</span></button></li>`,
  ...regionRows.map(r=>`<li><button type="button" data-region-filter="${r.slug}" aria-pressed="false"${r.count?'':' class="is-empty"'}><span class="hub-region-name">${escape(r.region.name)}</span><span class="hub-region-counties">${r.count?escape(r.counties.join('、')):'還沒有紀錄'}</span><span class="hub-region-count">${r.count}</span></button></li>`)].join('');
 const chips=[`<button type="button" data-category-filter="all" aria-pressed="true">全部</button>`,...categories.map(([id,label])=>`<button type="button" data-category-filter="${id}" aria-pressed="false">${label} ${categoryCounts[id]}</button>`)].join('');
 // List items follow the visible county order; only reviewed articles carry a URL.
 const listItems=groups.flatMap(g=>g.items).map((r,i)=>({'@type':'ListItem',position:i+1,name:r.place.name,...(r.link.kind==='article'?{url:new URL(r.link.href,origin).href}:{})}));
 const jsonld={'@context':'https://schema.org','@graph':[
  {'@type':'CollectionPage','@id':canonical+'#page',name:title,description,url:canonical,inLanguage:'zh-Hant',isPartOf:{'@type':'WebSite',name:'鷹家遠行所',url:origin+'/trip/'},
   breadcrumb:{'@id':canonical+'#breadcrumb'},mainEntity:{'@type':'ItemList',numberOfItems:total,itemListElement:listItems}},
  {'@type':'BreadcrumbList','@id':canonical+'#breadcrumb',itemListElement:[{'@type':'ListItem',position:1,name:'鷹家遠行所',item:origin+'/trip/'},{'@type':'ListItem',position:2,name:'台灣',item:canonical}]}
 ]};
 return `<!doctype html>
<html lang="zh-Hant-TW">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)}</title><meta name="description" content="${escape(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${canonical}"><meta property="og:type" content="website"><meta property="og:title" content="${escape(title)}"><meta property="og:description" content="${escape(description)}"><meta property="og:url" content="${canonical}"><meta property="og:site_name" content="鷹家遠行所"><meta property="og:locale" content="zh_TW"><meta property="og:image" content="${origin}${escape(share.photo.src)}"><meta property="og:image:alt" content="${escape(share.photo.alt)}"><link rel="icon" href="/icons/favicon.svg"><link rel="stylesheet" href="/trip/taiwan-hub.css?v=${cssVersion}"><script type="application/ld+json">${JSON.stringify(jsonld).replaceAll('<','\\u003c')}</script><script defer src="/trip/taiwan-hub.js?v=${jsVersion}"></script><script defer src="/site-runtime.js?v=${runtimeVersion}"></script></head>
<body class="taiwan-hub"><a class="skip" href="#main">跳到主要內容</a><header class="hub-top"><div class="hub-wrap hub-top-inner"><a class="hub-brand" href="/trip/" aria-label="鷹家遠行所首頁">${wordmark(root,1,168)}</a><nav class="hub-nav" aria-label="遠行所"><a href="/trip/#destinations">目的地</a><a href="${pagePath}" aria-current="page">台灣</a><a href="/trip/#guides">旅行紀錄</a><a href="/trip/#planning">排行程</a></nav></div></header>
<main id="main" class="hub-wrap" data-taiwan-hub>
<nav class="hub-crumb" aria-label="頁面位置"><ol><li><a href="/trip/">遠行所</a></li><li aria-current="page">台灣</li></ol></nav>
<div class="hub-intro"><h1>台灣，我們去過的 ${total} 個地方</h1><p>點地圖或地區，只看那一區；每個地點都是我們自己帶孩子去過的。</p></div>
<div class="hub-layout">
<aside class="hub-side" aria-label="依地區瀏覽">
<figure class="hub-map" role="region" aria-label="台灣各縣市去過的地點數地圖" aria-describedby="hub-map-text">${renderMap(model)}<figcaption class="hub-legend"><span>去過的地點數</span>${legend.map(([t,c])=>`<span class="hub-legend-item"><i style="background:${c}"></i>${t}</span>`).join('')}</figcaption><p class="sr-only" id="hub-map-text">依縣市：${escape(countyText)}。依地區：${escape(regionText)}。</p></figure>
<ul class="hub-regions" aria-label="依地區篩選">${regionButtons}</ul>
</aside>
<div class="hub-list">
<div class="hub-bar"><div class="hub-chips" role="group" aria-label="依類型篩選">${chips}</div><p class="hub-result" id="hub-result" aria-live="polite">${total} 個地點</p></div>
<p class="hub-empty" id="hub-empty" hidden></p>
${sections}
</div>
</div>
</main>
<footer class="hub-footer"><div class="hub-wrap hub-footer-inner"><a class="hub-brand" href="/trip/" aria-label="鷹家遠行所首頁">${wordmark(root,2,150)}</a><p>© 鷹式一家 Eaglish Family</p><nav aria-label="頁尾導覽"><a href="/">鷹家買物社</a><a href="/blog/">鷹家選物誌</a></nav></div></footer>
</body>
</html>
`;
}

export function buildTaiwanHub(root){
 const html=renderTaiwanHub(root);
 mkdirSync(resolve(root,'trip/taiwan'),{recursive:true});
 writeFileSync(resolve(root,'trip/taiwan/index.html'),html);
 return html;
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const root=resolve(import.meta.dirname,'..');
 buildTaiwanHub(root);
 console.log('Built /trip/taiwan/ hub from the reviewed Taiwan atlas.');
}
