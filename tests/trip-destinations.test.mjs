import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {places,itineraries,nzRoute} from '../scripts/build-trip-destinations.mjs';
import {regions} from '../trip/new-zealand-data.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const paths=['/trip/','/trip/new-zealand/','/trip/new-zealand/christchurch/','/trip/new-zealand/akaroa/',...regions.map(region=>region.route),'/trip/thailand/','/trip/thailand/bangkok/'];
test('destination hierarchy has static text, canonical URLs, valid local assets and no private payloads',()=>{
 for(const path of paths){const html=read(path.slice(1)+'index.html');
  assert.equal((html.match(/<h1>/g)||[]).length,1,path);
  assert.ok(html.includes(`rel="canonical" href="https://www.eaglish.store${path}"`));
  assert.doesNotMatch(html,/\/Users\/|source_sha256|local_usage|Gemini|qwen|candidate_needs|AI生成|AI 生成/);
  for(const m of html.matchAll(/(?:href|src)="(\/[^"?#]+)(?:[?#][^"]*)?"/g)){const p=m[1].endsWith('/')?m[1]+'index.html':m[1];assert.ok(existsSync(new URL('..'+p,import.meta.url)),path+' '+p);}
  for(const m of html.matchAll(/href="#([^"]+)"/g))assert.ok(html.includes(`id="${m[1]}"`),path+' '+m[1]);
  const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'duplicate ids '+path);
  for(const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))assert.doesNotThrow(()=>JSON.parse(m[1]));
 }
});
test('reviewed Christchurch catalog remains traceable while the canonical guide uses the new regional article',()=>{
 const html=read(nzRoute.slice(1)+'index.html');
 assert.equal(places.length,11);assert.equal(places.filter(p=>p.visited).length,7);
 for(const p of places)assert.ok(p.source.startsWith('https://'));
 assert.match(html,/Shamarra Alpacas/);assert.match(html,/Akaroa Dolphins/);
 assert.match(html,/Drummonds Jetty/);assert.match(html,/65 Beach Road/);
 assert.match(html,/data-nz-planner/);assert.match(html,/id="plan"/);
 assert.doesNotMatch(html,/近100%|95%|保證看到|最低價/);
});
test('legacy two/three/five-day material remains represented by meaningful anchors',()=>{
 const ids=new Set(places.map(p=>p.id));
 for(const r of itineraries){const n={two:2,three:3,five:5}[r.id];assert.equal(r.days.length,n);assert.equal(r.days.filter(d=>d[3]!=='—').length,n-1);const stops=r.days.flatMap(d=>d[4]);assert.equal(new Set(stops).size,stops.length);for(const s of stops)assert.ok(ids.has(s));}
 const html=read(nzRoute.slice(1)+'index.html');
 for(const id of ['plan-two','plan-three','plan-five','itinerary'])assert.ok(html.includes(`id="${id}"`));
 assert.match(html,/name="days"/);assert.match(html,/data-nz-plan-output/);
 assert.match(html,/兩到三日行程/);
});
test('trip remains an isolated destination, not a newly exposed shop entry',()=>{
 assert.doesNotMatch(read('index.html'),/href="\/trip\//);
 for(const path of paths)assert.ok(read('sitemap.xml').includes('<loc>https://www.eaglish.store'+path+'</loc>'));
});
test('on-page travel photos use lighter web variants and retain source JPEGs',()=>{
 let original=0,web=0;
 for(const name of ['nz-farm','nz-boat']){
  original+=readFileSync(new URL('../trip/assets/'+name+'.jpg',import.meta.url)).length;
  web+=readFileSync(new URL('../trip/assets/'+name+'.webp',import.meta.url)).length;
  const html=read(nzRoute.slice(1)+'index.html');
  assert.ok(html.includes(`src="/trip/assets/${name}-1440.webp"`));
  assert.ok(html.includes(`/trip/assets/${name}-640.webp 640w`));
  assert.ok(html.includes(`/trip/assets/${name}-960.webp 960w`));
 }
 assert.ok(web<original*.4);
});
