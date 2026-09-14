import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {places,itineraries,nzRoute} from '../scripts/build-trip-destinations.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const paths=['/trip/','/trip/new-zealand/','/trip/new-zealand/christchurch/','/trip/new-zealand/akaroa/',nzRoute,'/trip/thailand/','/trip/thailand/bangkok/'];
test('destination hierarchy has static text, canonical URLs, valid local assets and no private payloads',()=>{
 for(const path of paths){const html=read(path.slice(1)+'index.html');
  assert.equal((html.match(/<h1>/g)||[]).length,1,path);
  assert.ok(html.includes(`rel="canonical" href="https://www.eaglish.store${path}"`));
  assert.doesNotMatch(html,/\/Users\/|source_sha256|local_usage|Gemini|qwen|candidate_needs|AI生成|AI 生成/);
  for(const m of html.matchAll(/(?:href|src)="(\/[^"?#]+)(?:[?#][^"]*)?"/g)){const p=m[1].endsWith('/')?m[1]+'index.html':m[1];assert.ok(existsSync(new URL('..'+p,import.meta.url)),path+' '+p);}
  for(const m of html.matchAll(/href="#([^"]+)"/g))assert.ok(html.includes(`id="${m[1]}"`),path+' '+m[1]);
  const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length,'duplicate ids '+path);
  for(const m of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g))assert.doesNotThrow(()=>JSON.parse(m[1]));
 }
});
test('nine place cards distinguish visited sources and contain direct maps plus disclosure',()=>{
 const html=read(nzRoute.slice(1)+'index.html');
 assert.equal(places.length,9);assert.equal(places.filter(p=>p.visited).length,3);
 for(const p of places){assert.ok(html.includes(`id="${p.id}"`));assert.ok(html.includes(encodeURIComponent(p.query)));assert.ok(p.source.startsWith('https://'));}
 assert.equal((html.match(/<summary>展開景點介紹與行前提醒/g)||[]).length,9);
 assert.match(html,/Drummonds Jetty/);assert.match(html,/海外旅客另有票種/);
 assert.match(html,/不是下水與海豚共游/);assert.doesNotMatch(html,/近100%|95%|保證看到|最低價/);
 assert.match(html,/klook\.com\/activity\/7758-/);
});
test('itinerary variants have correct nights, unique stops and resolvable cards',()=>{
 const ids=new Set(places.map(p=>p.id));
 for(const r of itineraries){const n={two:2,three:3,five:5}[r.id];assert.equal(r.days.length,n);assert.equal(r.days.filter(d=>d[3]!=='—').length,n-1);const stops=r.days.flatMap(d=>d[4]);assert.equal(new Set(stops).size,stops.length);for(const s of stops)assert.ok(ids.has(s));}
 const html=read(nzRoute.slice(1)+'index.html');
 for(const id of ['two','three','five'])assert.ok(html.includes(`data-plan-panel="${id}"`));
 assert.doesNotMatch(html,/<section[^>]+data-plan-panel[^>]+hidden/,'no-JS route content is available');
 const js=read('trip/itinerary.js');assert.match(js,/hashchange/);assert.match(js,/aria-current/);
});
test('trip remains an isolated destination, not a newly exposed shop entry',()=>{
 assert.doesNotMatch(read('index.html'),/href="\/trip\//);
 for(const path of paths)assert.ok(read('sitemap.xml').includes('<loc>https://www.eaglish.store'+path+'</loc>'));
});
