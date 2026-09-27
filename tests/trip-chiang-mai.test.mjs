import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {catalog,routes} from '../scripts/trip-chiang-mai.mjs';
import {dayOfTrip,available} from '../trip/chiang-mai-planner-model.mjs';
import {resizePlan,replaceDay} from '../trip/bangkok-planner-model.mjs';
const root=resolve(import.meta.dirname,'..');
const read=p=>readFileSync(resolve(root,p),'utf8');
const html=read('trip/guides/chiang-mai-with-kids/index.html');

test('Chiang Mai dates use destination calendar weekdays, including month and leap-year boundaries',()=>{
 assert.deepEqual(dayOfTrip('2026-09-28',0),{iso:'2026-09-28',weekday:1});
 assert.deepEqual(dayOfTrip('2026-09-30',4),{iso:'2026-10-04',weekday:0});
 assert.equal(dayOfTrip('2028-02-28',1).iso,'2028-02-29');
 for(const input of ['', '2026-02-30','2026-13-01','bad'])assert.equal(dayOfTrip(input,0),null);
 assert.equal(dayOfTrip('2026-10-04',-1),null);
 assert.equal(available([0,6],dayOfTrip('2026-09-28',0)),false);
 assert.equal(available([0,6],dayOfTrip('2026-10-03',0)),true);
 assert.equal(available([0],dayOfTrip('2026-10-03',0)),false);
 assert.equal(available([0],dayOfTrip('2026-10-04',0)),true);
});
test('Chiang Mai plans are unique, do not auto-book elephant activities, and have weekday alternatives',()=>{
 for(const days of [2,3]){
  const plan=resizePlan([],days,routes);assert.equal(plan.length,days);assert.equal(new Set(plan).size,days);
  assert.ok(!plan.includes('elephant'));
  const swapped=replaceDay(plan,0,plan[1],routes);assert.equal(new Set(swapped).size,days);
 }
 for(const route of routes.routes){
  assert.ok(route.steps.length>=4);assert.ok(route.compactSteps.length>=4);
  for(const s of [...route.steps,...route.compactSteps]){
   if(s.days)assert.ok(s.otherwise);
   if(s.anchor)assert.ok(catalog.places.some(p=>p.anchor===s.anchor));
  }
 }
 assert.match(read('trip/chiang-mai-planner.mjs'),/週日紙園中文導覽不提供/);
});
test('one source catalog drives 7 reusable places, real media, maps and current source notes',()=>{
 const media=JSON.parse(read('trip/assets/chiang-mai-media.json'));
 assert.equal(catalog.places.length,7);assert.equal(media.length,11);
 assert.equal(new Set(catalog.places.map(p=>p.id)).size,7);
 for(const p of catalog.places){
  assert.match(html,new RegExp(`id="${p.anchor}" data-place-id="${p.id}"`));
  assert.ok(html.includes(encodeURIComponent(p.mapsQuery)));
  assert.ok(p.sources.length);assert.ok(catalog.videos.some(v=>v.id===p.video));
  for(const id of p.gallery)assert.ok(media.some(m=>m.id===id));
 }
 for(const m of media){
  assert.ok(catalog.videos.some(v=>v.id===m.video));assert.ok(m.second>=0);assert.ok(m.sha256);
  for(const suffix of ['','-640','-960'])assert.ok(existsSync(resolve(root,`trip/assets/${m.id}${suffix}.webp`)));
 }
 assert.equal(catalog.places.find(p=>p.anchor==='plane').hoursStatus,'confirm-before-going');
 assert.match(html,/rel="sponsored noopener"/);assert.match(html,/可能獲得佣金/);
 assert.match(html,/週日不提供中文導覽/);
 assert.doesNotMatch(html,/\/Users\/|API_KEY|AI 生成|2～4 日/);
});
test('Chiang Mai guide is discoverable and has accessible static content and structured metadata',()=>{
 assert.match(read('trip/thailand/index.html'),/href="\/trip\/thailand\/chiang-mai\/"/);
 assert.match(read('trip/index.html'),/href="\/trip\/thailand\/chiang-mai\/"/);
 assert.match(read('trip/thailand/chiang-mai/index.html'),/href="\/trip\/guides\/chiang-mai-with-kids\/"/);
 assert.equal((html.match(/<h1>/g)||[]).length,1);
 assert.match(html,/data-reading-nav/);assert.match(html,/role="status" aria-live="polite"/);
 assert.match(html,/for="cnx-date"/);assert.match(html,/bkk-planner-fallback/);
 for(const match of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g))assert.ok(JSON.parse(match[1])['@type']);
 const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 for(const match of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(match[1]),match[1]);
});
