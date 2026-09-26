import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {bangkokCatalog,media} from '../scripts/trip-bangkok-places.mjs';
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
   for(const suffix of ['','-640'])assert.ok(existsSync(new URL(`../trip/assets/${id}${suffix}.webp`,import.meta.url)));
  }
 }
 const ids=[...article.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(ids.length,new Set(ids).size);
 assert.match(article,/Klook／KKday 連結為聯盟連結/);assert.equal((article.match(/rel="sponsored noopener"/g)||[]).length,2);
 assert.doesNotMatch(article,/aid=1819|cid=15925/);
 for(const s of article.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))assert.doesNotThrow(()=>JSON.parse(s[1]));
});
test('Bangkok scene assets retain source provenance, responsive variants and bounded file sizes',()=>{
 const manifest=JSON.parse(read('trip/assets/bkk-media.json'));
 assert.equal(manifest.length,Object.keys(media).length);
 for(const m of manifest){
  assert.match(m.source,/youtube.com\/watch\?v=f5h0gGdaX2c&t=\d+s$/);
  assert.equal(m.kind,'owned-video-frame');assert.ok(m.alt&&m.width&&m.height);
  assert.equal(m.variants.length,2);
  for(const v of m.variants){const bytes=readFileSync(new URL('..'+v.file,import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),v.sha256);assert.ok(bytes.length<350*1024);}
 }
});
test('travel stylesheet has mobile and reduced-motion layouts',()=>{
 const css=read('trip/trip.css');assert.match(css,/max-width:700px/);assert.match(css,/prefers-reduced-motion:reduce/);assert.match(css,/:focus-visible/);
});
