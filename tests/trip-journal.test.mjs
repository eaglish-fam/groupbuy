import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {bangkokCatalog,media} from '../scripts/trip-bangkok-places.mjs';
import {bangkokRoutes} from '../scripts/trip-bangkok-routes.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const pages=['trip/index.html','trip/guides/bangkok-with-kids/index.html'];
test('travel journal has real static content, distinct canonical pages and no internal data',()=>{
 for(const file of pages){const html=read(file);assert.equal((html.match(/<h1>/g)||[]).length,1);assert.match(html,/鷹家遠行所/);assert.match(html,/id="main"/);assert.doesNotMatch(html,/\/Users\/|Gemini|qwen|source_sha256|AI生成|reviewed-materials/);assert.doesNotMatch(html,/id="deal-grid"/);
 const path='/'+file.replace(/index.html$/,'');assert.ok(html.includes(`rel="canonical" href="https://www.eaglish.store${path}"`));
 for(const m of html.matchAll(/(?:href|src)="(\/[^"?#]+)(?:[?#][^"]*)?"/g)){const p=m[1].endsWith('/')?m[1]+'index.html':m[1];assert.ok(existsSync(new URL('..'+p,import.meta.url)),file+' '+p);}
 for(const m of html.matchAll(/href="#([^"]+)"/g))assert.ok(html.includes(`id="${m[1]}"`),m[1]);
 }
});
test('source-bound travel details avoid unsupported ticket and venue claims',()=>{
 const html=read(pages[1]);assert.match(html,/Children’s Discovery Museum/);assert.match(html,/一位家長陪孩子/);assert.match(html,/Google Maps/);assert.match(html,/f5h0gGdaX2c&amp;t=1097s/);assert.match(html,/玻璃底船/);assert.doesNotMatch(html,/24小時營業|0至5歲.*免費|6262|先選一件想做的事|買東西，也是練習|market-walk\.jpg|aquarium-moment\.jpg/);
});
test('Bangkok place identities, facts and media are reusable in the guide and city hub',()=>{
 const article=read(pages[1]),hub=read('trip/thailand/bangkok/index.html');
 assert.equal(new Set(bangkokCatalog.places.map(p=>p.id)).size,bangkokCatalog.places.length);
 for(const p of bangkokCatalog.places){
  assert.ok(p.sources.length&&p.mapsQuery&&p.hours&&p.transport&&p.weather);
  assert.ok(p.intro.length>90&&p.activities.length>=2);
  for(const html of [article,hub])assert.ok(html.includes(`data-place-id="${p.id}"`));
  for(const id of [p.image,...p.gallery]){
   assert.ok(media[id]?.alt&&media[id]?.second>0);
   for(const suffix of ['','-640','-960'])assert.ok(existsSync(new URL(`../trip/assets/${id}${suffix}.webp`,import.meta.url)));
  }
 }
 const ids=[...article.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
 assert.match(article,/Klook／KKday 連結為聯盟連結/);assert.equal((article.match(/rel="sponsored noopener"/g)||[]).length,bangkokCatalog.places.flatMap(p=>p.booking).filter(b=>b.affiliate).length);
 assert.doesNotMatch(article,/aid=1819|cid=15925/);
 for(const s of article.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))assert.doesNotThrow(()=>JSON.parse(s[1]));
});
test('Bangkok scene assets retain source provenance, responsive variants and bounded file sizes',()=>{
 const manifest=JSON.parse(read('trip/assets/bkk-media.json'));
 assert.equal(manifest.length,Object.keys(media).length);
 for(const m of manifest){
  const url=new URL(m.source);assert.ok(bangkokCatalog.videos.some(v=>v.id===url.searchParams.get('v')));assert.match(url.searchParams.get('t'),/^\d+s$/);
  assert.equal(m.kind,'owned-video-frame');assert.ok(m.alt&&m.width&&m.height);
  assert.equal(m.variants.length,3);
  for(const v of m.variants){const bytes=readFileSync(new URL('..'+v.file,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),v.sha256);assert.ok(bytes.length<350*1024);}
 }
});
test('Bangkok route combinations resolve to unique real place cards and preserve both video sources',()=>{
 const article=read(pages[1]);
 const ids=new Set(bangkokCatalog.places.map(p=>p.id));
 const routes=new Map(bangkokRoutes.routes.map(r=>[r.id,r]));
 for(const route of routes.values()){
  assert.ok(article.includes(`id="route-${route.id}"`));
  for(const id of route.placeIds)assert.ok(ids.has(id));
  for(const step of route.steps)if(step.anchor)assert.ok(bangkokCatalog.places.some(p=>p.anchor===step.anchor));
 }
 for(const combo of bangkokRoutes.combinations){
  assert.equal(combo.days,combo.routes.length);
  const places=combo.routes.flatMap(id=>routes.get(id).placeIds);
  assert.equal(places.length,new Set(places).size);
 }
 for(const p of bangkokCatalog.places)assert.ok(article.includes(`${(p.video||bangkokCatalog.video).replaceAll('&','&amp;')}&amp;t=${p.videoSeconds}s`));
 assert.match(article,/不是影片的 Day 1/);assert.match(article,/推車進入體驗區/);
});
test('travel stylesheet has mobile and reduced-motion layouts',()=>{
 const css=read('trip/trip.css');assert.match(css,/max-width:700px/);assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/:focus-visible/);
});
test('Bangkok opts into the shared mobile drawer without replacing its static TOC',()=>{
 const html=read(pages[1]);
 assert.equal((html.match(/data-reading-nav/g)||[]).length,1);
 assert.match(html,/class="toc guide-nav" data-reading-nav/);
 assert.match(html,/defer src="\/blog\/reading-nav\.js\?v=/);
 assert.match(html,/href="\/blog\/reading-nav\.css\?v=/);
 const nav=html.match(/<nav[^>]*data-reading-nav[^>]*>([\s\S]*?)<\/nav>/)[1];
 for(const p of bangkokCatalog.places){
  assert.ok(nav.includes('href="#'+p.anchor+'"'));
  const section=html.match(new RegExp('<section id="'+p.anchor+'"[\\s\\S]*?<h2>'))[0];
  assert.ok(section.includes(p.englishName.split(' · ')[0].toUpperCase()));
  assert.ok(!section.includes('/ '+p.area.toUpperCase()+'</'));
 }
});
