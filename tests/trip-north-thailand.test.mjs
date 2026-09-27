import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import {ceiCatalog,ceiRoutes} from '../scripts/build-trip-chiang-rai.mjs';
import {resizePlan,replaceDay} from '../trip/bangkok-planner-model.mjs';
import {stopOwners} from '../trip/chiang-rai-planner-model.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const rai=read('trip/guides/chiang-rai-with-kids/index.html'),mai=read('trip/guides/chiang-mai-with-kids/index.html');
test('all twelve authorized IG sources have a published destination, without merging cities',()=>{
 for(const id of ['Cty2vosvqnC','CtMUIiRolk0','CtO76HQqqiS','CtRl60VqJsW','CtULGSfIBUl','CtWhiJTo1US','CtZNwWZIyEy','CtbnQYoIEoS','CteLPMDIv6H','CtjX3L2odHj','CtorBSRIG3-','CtwJqqsoTDe'])assert.ok((rai+mai).includes(id),id);
 assert.match(rai,/Rdu6QhsPYPgTUfVV6/);
 assert.match(rai,/藍廟.*?我們推薦/s);assert.match(mai,/Doi Saket/);assert.match(mai,/THB 1,500/);assert.match(mai,/最多三位/);
 assert.doesNotMatch(rai,/編輯延伸|尚未確認實訪|2023 行程記錄|候選地圖|非本次實訪背書/);
 assert.doesNotMatch(rai+mai,/watch\?v=undefined|\/Users\/|localhost:|AI 生成|qwen3/);
});
test('new guide is navigable with or without script and all intra-article targets exist',()=>{
 assert.match(rai,/data-reading-nav/);assert.match(rai,/bkk-planner-fallback/);assert.match(rai,/aria-live="polite"/);
 assert.equal((rai.match(/<h1>/g)||[]).length,1);
 for(const page of [rai,mai]){const ids=[...page.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);for(const m of page.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(m[1]),m[1]);}
 for(const m of rai.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g))assert.ok(JSON.parse(m[1])['@type']);
 for(const p of ['trip/index.html','trip/thailand/index.html','sitemap.xml'])assert.match(read(p),/\/trip\/thailand\/chiang-rai\//);
 assert.equal(ceiCatalog.places.length,4);for(const p of ceiCatalog.places){assert.ok(p.sources.length);assert.ok(rai.includes(`id="${p.id}"`));assert.ok(p.hours&&p.weather&&p.transport);}
});
test('Chiang Rai plans have valid destinations, unique route choices, and no automatic village booking',()=>{
 const places=new Set(['white','black','blue','phra-kaew',...ceiCatalog.places.map(p=>p.id)]);
 for(const n of [1,2,3]){const plan=resizePlan([],n,ceiRoutes);assert.equal(plan.length,n);assert.ok(!plan.includes('village'));for(const r of ceiRoutes.routes){const next=replaceDay(plan,0,r.id,ceiRoutes);assert.equal(new Set(next).size,n);}}
 for(const route of ceiRoutes.routes)for(const items of [route.steps,route.compactSteps]){assert.ok(items.length>=4);for(const [,title,text,id]of items){assert.ok(title&&text);if(id)assert.ok(places.has(id),id);}}
});
test('three-day compact plan preserves the city day and deduplicates optional earlier stops',()=>{
 for(const plan of [['south','north','city'],['city','south','north'],['village','north','city']]){
  const owners=stopOwners(plan,'compact',ceiRoutes);assert.equal(owners.blue,'city');assert.equal(owners['night-market'],'city');assert.equal(owners.black,'north');
 }
 assert.equal(stopOwners(['south','north'],'compact',ceiRoutes).blue,'north');
 assert.equal(stopOwners(['south','north'],'compact',ceiRoutes)['night-market'],'south');
});
test('owned media have provenance, matching hashes, stripped metadata and small variants',async()=>{
 const media=JSON.parse(read('trip/assets/north-thailand-media.json'));assert.equal(media.length,14);
 for(const m of media){const b=readFileSync(new URL('../trip/assets/'+m.id+'.webp',import.meta.url));assert.equal(createHash('sha256').update(b).digest('hex'),m.sha256);const meta=await sharp(b).metadata();assert.ok(!meta.exif);assert.ok(b.length<=220000,m.id);assert.ok((rai+mai).includes(m.id));assert.ok(existsSync(new URL('../trip/assets/'+m.id+'-640.webp',import.meta.url)));if(m.kind==='owned-video-frame'){assert.match(m.source,/instagram.com/);assert.ok(m.second>=0);}}
 assert.match(rai,/<section id="akha"[^>]*>[\s\S]*?我們去過/);
 assert.doesNotMatch(rai,/cr-akha-farmville\.webp/);
});
