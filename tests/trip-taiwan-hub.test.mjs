import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {renderTaiwanHub,taiwanHubModel,placeLink} from '../scripts/build-trip-taiwan.mjs';
const root=resolve(import.meta.dirname,'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const html=read('trip/taiwan/index.html');
const config=JSON.parse(read('trip/data/taiwan-atlas-r24.json'));
const places=config.data.places;
const cards=[...html.matchAll(/<li class="hub-card"[\s\S]*?<\/li>/g)].map(m=>m[0]);

test('the Taiwan hub is published with one card per reviewed place',()=>{
 assert.equal(places.length,53);
 assert.equal(cards.length,places.length);
 const ids=cards.map(card=>card.match(/data-place-id="([^"]+)"/)[1]);
 assert.deepEqual([...ids].sort(),places.map(p=>p.id).sort());
 assert.match(html,new RegExp(`<h1>台灣，我們去過的 ${places.length} 個地方</h1>`));
 assert.match(html,/<link rel="canonical" href="https:\/\/www\.eaglish\.store\/trip\/taiwan\/">/);
 assert.match(html,/<meta name="robots" content="index,follow,max-image-preview:large">/);
 assert.match(html,/<title>台灣親子景點：鷹式一家去過的 53 個地方｜鷹家遠行所<\/title>/);
 assert.match(read('sitemap.xml'),/<loc>https:\/\/www\.eaglish\.store\/trip\/taiwan\/<\/loc>/);
 assert.match(read('trip/index.html'),/<a href="\/trip\/taiwan\/">台灣<\/a>/,'the travel home links the hub crawlably');
});

test('the committed page matches the generator except shared normalized chrome',()=>{
 const strip=value=>value.replace(/<!-- site-navigation(?:-assets)?:start -->[\s\S]*?<!-- site-navigation(?:-assets)?:end -->\n?/g,'').replace(/<meta (?:property|name)="(?:og:image:width|og:image:height|twitter:[a-z:]+)" content="[^"]*">\n?/g,'');
 assert.equal(strip(html),strip(renderTaiwanHub(root)));
});

test('region and category counts follow each place by its first county',()=>{
 const model=taiwanHubModel(root);
 assert.deepEqual(Object.fromEntries(model.regionRows.map(r=>[r.region.name,r.count])),{北部:36,中部:2,南部:14,東部:0,離島:1});
 assert.deepEqual(model.categoryCounts,{attraction:41,restaurant:7,hotel:5});
 for(const row of model.regionRows){
  const button=html.match(new RegExp(`<button type="button" data-region-filter="${row.slug}"[\\s\\S]*?</button>`))[0];
  assert.match(button,new RegExp(`<span class="hub-region-count">${row.count}</span>`));
 }
 assert.match(html,/data-region-filter="east" aria-pressed="false" class="is-empty"><span class="hub-region-name">東部<\/span><span class="hub-region-counties">還沒有紀錄<\/span>/);
 assert.match(html,/data-region-filter="all" aria-pressed="true">[\s\S]*?<span class="hub-region-count">53<\/span>/);
 for(const [id,label,n] of [['attraction','景點',41],['restaurant','餐廳',7],['hotel','住宿',5]])assert.match(html,new RegExp(`data-category-filter="${id}" aria-pressed="false">${label} ${n}</button>`));
 // County groups: every card sits under the section of its first county.
 const sections=[...html.matchAll(/<section class="hub-county" data-region="([a-z]+)" aria-labelledby="county-([a-z-]+)">([\s\S]*?)<\/section>/g)];
 assert.equal(sections.reduce((n,s)=>n+(s[3].match(/class="hub-card"/g)||[]).length,0),53);
 for(const [, ,countyId,body] of sections){
  for(const id of body.matchAll(/data-place-id="([^"]+)"/g))assert.equal(places.find(p=>p.id===id[1]).countyIds[0],countyId);
  const n=(body.match(/class="hub-card"/g)||[]).length;
  assert.match(body,new RegExp(`<span class="hub-county-count" data-total="${n}">${n} 個</span>`));
 }
});

test('every card links to a reviewed article or the place’s own Maps search',()=>{
 for(const card of cards){
  const id=card.match(/data-place-id="([^"]+)"/)[1],place=places.find(p=>p.id===id);
  const link=card.match(/<a class="hub-card-link" href="([^"]+)"([^>]*)>/);
  assert.ok(link,id);
  const href=link[1].replaceAll('&amp;','&');
  assert.match(card,/<h3 class="hub-card-title">/);assert.match(card,/<p class="hub-card-cat">(景點|餐廳|住宿)<\/p>/);
  assert.ok(card.includes('<p class="hub-card-text">'),id);
  if(place.articleUrl){
   const path=new URL(place.articleUrl).pathname;
   assert.equal(href,path,id);assert.ok(existsSync(resolve(root,path.slice(1),'index.html')),`${id}: article exists`);
   assert.match(card,/>看完整文章</);assert.doesNotMatch(link[2],/target=/);
  }else{
   assert.equal(href,place.maps.search,id);assert.equal(new URL(href).origin,'https://www.google.com');
   assert.match(link[2],/target="_blank" rel="noopener noreferrer"/);assert.match(card,/>看地點資訊</);
  }
  if(place.photo){
   assert.match(card,new RegExp(`<img src="${place.photo.src}" width="480" height="480" alt="[^"]+"`));
   assert.ok(existsSync(resolve(root,place.photo.src.slice(1))),place.photo.src);
  }else assert.match(card,/<div class="hub-card-media is-empty"><span>照片待補<\/span><\/div>/);
 }
 for(const id of ['place-tw-caesar-kenting','place-tw-leofoo-resort-guanshi','place-tw-sanfu-farm'])assert.equal(placeLink(places.find(p=>p.id===id)).kind,'article',id);
 // Below-the-fold photos are lazy; only the first row loads eagerly.
 assert.equal((html.match(/<img [^>]*loading="lazy"/g)||[]).length,places.filter(p=>p.photo).length-3);
});

test('the county map is a labelled region with a text equivalent and region list',()=>{
 assert.match(html,/<figure class="hub-map" role="region" aria-label="台灣各縣市去過的地點數地圖" aria-describedby="hub-map-text">/);
 assert.match(html,/<svg class="hub-map-svg" viewBox="0 0 360 470"[^>]*aria-hidden="true"/);
 const text=html.match(/<p class="sr-only" id="hub-map-text">([^<]+)<\/p>/)?.[1];
 assert.ok(text);for(const part of ['臺北市 13 個','高雄市 11 個','新北市 10 個','連江縣 1 個','北部 36 個','東部 0 個'])assert.ok(text.includes(part),part);
 assert.match(html,/<ul class="hub-regions" aria-label="依地區篩選">/);
 for(const slug of ['all','north','central','south','east','offshore'])assert.match(html,new RegExp(`data-region-filter="${slug}" aria-pressed="(true|false)"`));
 assert.equal((html.match(/<path d="[^"]+" fill="#[0-9a-f]{6}" data-region="[a-z]+"/g)||[]).length,20,'main-island counties including 澎湖');
 assert.equal((html.match(/<g class="inset/g)||[]).length,2,'連江 and 金門 insets');
});

test('no runtime network fetch for page content; JS only filters the static page',()=>{
 // site-runtime.js is the shared analytics runtime every public page loads (production host only).
 const js=read('trip/taiwan-hub.js');
 assert.doesNotMatch(js,/fetch\(|XMLHttpRequest|import\(|localStorage|sessionStorage|https?:\/\//);
 assert.match(js,/aria-pressed/);
 const scripts=[...html.matchAll(/<script\b[^>]*\bsrc="([^"]+)"/g)].map(m=>m[1]);
 for(const src of scripts)assert.match(src,/^\/(trip\/taiwan-hub\.js|site-font-loader\.js|site-runtime\.js)\?v=[a-f0-9]+$/);
 assert.doesNotMatch(html,/<link\b[^>]*href="https?:\/\/(?!www\.eaglish\.store)/);
 const css=read('trip/taiwan-hub.css');
 assert.doesNotMatch(css,/@import|url\(https?:|@font-face/);
 assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/:focus-visible/);
 const ld=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
 const [page,crumbs]=ld['@graph'];
 assert.equal(page['@type'],'CollectionPage');assert.equal(page.mainEntity.itemListElement.length,53);
 assert.deepEqual(crumbs.itemListElement.map(i=>i.item),['https://www.eaglish.store/trip/','https://www.eaglish.store/trip/taiwan/']);
});
