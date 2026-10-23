import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
const ceiCatalog=JSON.parse(readFileSync(new URL('../trip/data/chiang-rai-places.json',import.meta.url),'utf8'));
import sharp from 'sharp';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const rai=read('trip/guides/chiang-rai-with-kids/index.html'),mai=read('trip/guides/chiang-mai-with-kids/index.html');
test('all travel planners use the same concise pace labels',()=>{
 for(const page of [rai,mai,read('trip/guides/bangkok-with-kids/index.html')]){
  assert.match(page,/<option value="leisure">悠閒<\/option>/);
  assert.match(page,/<option value="compact">緊湊<\/option>/);
  assert.doesNotMatch(page,/悠閒散步/);
 }
});
test('all twelve authorized IG sources have a published destination, without merging cities',()=>{
 for(const id of ['Cty2vosvqnC','CtMUIiRolk0','CtO76HQqqiS','CtRl60VqJsW','CtULGSfIBUl','CtWhiJTo1US','CtZNwWZIyEy','CtbnQYoIEoS','CteLPMDIv6H','CtjX3L2odHj','CtorBSRIG3-','CtwJqqsoTDe'])assert.ok((rai+mai).includes(id),id);
 assert.match(rai,/Rdu6QhsPYPgTUfVV6/);
 assert.match(rai,/藍廟.*?我們推薦/s);assert.match(mai,/Doi Saket/);assert.match(mai,/THB 1,500/);assert.match(mai,/最多三位/);
 assert.doesNotMatch(rai,/編輯延伸|尚未確認實訪|2023 行程記錄|候選地圖|非本次實訪背書/);
 assert.doesNotMatch(rai+mai,/watch\?v=undefined|\/Users\/|localhost:|AI 生成|qwen3/);
});
test('new guide is navigable with or without script and all intra-article targets exist',()=>{
 assert.match(rai,/data-reading-nav/);assert.match(rai,/data-approved-city-planner/);assert.match(rai,/aria-live="polite"/);
 assert.equal((rai.match(/<h1>/g)||[]).length,1);
 for(const page of [rai,mai]){const ids=[...page.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);for(const m of page.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(m[1]),m[1]);}
 for(const m of rai.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)){const d=JSON.parse(m[1]);assert.ok(d['@type']||d['@graph']?.every(n=>n['@type']));}
 assert.match(read('trip/index.html'),/href="\/trip\/guides\/chiang-rai-with-kids\/"/);
 // The old city overview now redirects; the hub and sitemap point at the guide itself.
 for(const p of ['trip/thailand/index.html','sitemap.xml'])assert.match(read(p),/\/trip\/guides\/chiang-rai-with-kids\//);
 assert.match(read('trip/thailand/chiang-rai/index.html'),/url=\/trip\/guides\/chiang-rai-with-kids\//);
 assert.equal(ceiCatalog.places.length,4);for(const p of ceiCatalog.places){assert.ok(p.sources.length);assert.ok(rai.includes(`id="${p.id}" data-place-id="cei-${p.id}"`));assert.ok(p.hours&&p.weather&&p.transport);}
});
test('owned media have provenance, matching hashes, stripped metadata and small variants',async()=>{
 const media=JSON.parse(read('trip/assets/north-thailand-media.json'));assert.equal(media.length,16);
 for(const m of media){const b=readFileSync(new URL('../trip/assets/'+m.id+'.webp',import.meta.url));assert.equal(createHash('sha256').update(b).digest('hex'),m.sha256);const meta=await sharp(b).metadata();assert.ok(!meta.exif);assert.ok(b.length<=220000,m.id);assert.ok((rai+mai).includes(m.id));assert.ok(existsSync(new URL('../trip/assets/'+m.id+'-640.webp',import.meta.url)));if(m.kind==='owned-video-frame'){assert.match(m.source,/instagram.com/);assert.ok(m.second>=0);}}
 assert.match(rai,/<section id="white"[^>]*>[\s\S]*?cr-white-temple\.webp/);
 assert.match(rai,/<section id="akha"[^>]*>[\s\S]*?cr-akha-farmville\.webp/);
 // White Temple and Akha FarmVille sit in further reading (no six-question facts), so they are
 // not place cards; the white-temple family photo also opens the guide's hero.
 assert.match(rai.match(/<div class="city-guide-hero"[\s\S]*?<\/div>/)[0],/cr-white-temple/);
});
