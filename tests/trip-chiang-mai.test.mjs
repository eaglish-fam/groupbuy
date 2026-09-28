import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
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
test('one source catalog drives 9 reusable places, real media, maps and current source notes',()=>{
 const media=JSON.parse(read('trip/assets/chiang-mai-media.json'));
 assert.equal(catalog.places.length,9);assert.equal(media.length,25);
 assert.equal(new Set(catalog.places.map(p=>p.id)).size,9);
 for(const p of catalog.places){
  assert.match(html,new RegExp(`id="${p.anchor}" data-place-id="${p.id}"`));
  assert.ok(html.includes(encodeURIComponent(p.mapsQuery)));
  assert.ok(p.sources.length);if(p.video)assert.ok(catalog.videos.some(v=>v.id===p.video));else assert.equal(p.anchor,'thai-costume');
  for(const id of p.gallery)assert.ok(media.some(m=>m.id===id));
 }
 for(const m of media){
  if(m.kind==='owned-video-frame'){assert.ok(catalog.videos.some(v=>v.id===m.video));assert.ok(m.second>=0);}else assert.equal(m.kind,'user-supplied-photo');assert.ok(m.sha256);
  for(const suffix of ['',...[640,960].filter(w=>w<m.width).map(w=>'-'+w)])assert.ok(existsSync(resolve(root,`trip/assets/${m.id}${suffix}.webp`)));
 }
 assert.equal(catalog.places.find(p=>p.anchor==='plane').hoursStatus,'confirm-before-going');
 assert.match(html,/rel="sponsored noopener"/);assert.match(html,/可能獲得佣金/);
 assert.match(html,/週日不提供中文導覽/);
 assert.doesNotMatch(html,/\/Users\/|API_KEY|AI 生成|2～4 日/);
});
test('Chiang Mai guide is discoverable and has accessible static content and structured metadata',()=>{
 assert.match(read('trip/thailand/index.html'),/href="\/trip\/thailand\/chiang-mai\/"/);
 assert.match(read('trip/index.html'),/href="\/trip\/guides\/chiang-mai-with-kids\/"/);
 assert.match(read('trip/thailand/chiang-mai/index.html'),/href="\/trip\/guides\/chiang-mai-with-kids\/"/);
 assert.equal((html.match(/<h1>/g)||[]).length,1);
 assert.match(html,/data-reading-nav/);assert.match(html,/role="status" aria-live="polite"/);
 assert.match(html,/for="cnx-date"/);assert.match(html,/bkk-planner-fallback/);
 for(const match of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g))assert.ok(JSON.parse(match[1])['@type']);
 const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 for(const match of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(match[1]),match[1]);
});

test('all ten supplied photos are visible in the guide, full-ratio originals are compressed and no EXIF leaks',async()=>{
 const photos=JSON.parse(read('trip/assets/chiang-mai-media.json')).filter(m=>m.kind==='user-supplied-photo');
 assert.deepEqual(photos.map(m=>m.attachmentNumber).sort((a,b)=>a-b),[1,2,3,4,5,6,7,8,9,10]);
 for(const p of photos){
  assert.ok(html.includes(`src="/trip/assets/${p.id}.webp"`),p.id);
  const buffer=readFileSync(resolve(root,`trip/assets/${p.id}.webp`));
  assert.equal(createHash('sha256').update(buffer).digest('hex'),p.sha256);
  const meta=await sharp(buffer).metadata();assert.ok(!meta.exif);assert.ok(buffer.length<200000);
  assert.ok(Math.abs(meta.width/meta.height-p.originalWidth/p.originalHeight)<0.005);
 }
 const costume=catalog.places.find(p=>p.anchor==='thai-costume');
 assert.ok(!costume.video);assert.match(costume.mapsLabel,/拍照地標/);
 assert.match(costume.mapsContext,/不是.*店址/);
 assert.equal(costume.hoursStatus,'provider-confirmation-required');
 assert.ok(routes.routes.some(r=>r.id==='oldcity'&&r.steps.some(s=>s.anchor==='thai-costume')));
 assert.doesNotMatch(html,/watch\?v=undefined|undefineds/);
});

test('Elefin is a separate evidence-bound cafe and route, never an alias for Ran-Tong',()=>{
 const elefin=catalog.places.find(p=>p.anchor==='elefin');
 const rantong=catalog.places.find(p=>p.anchor==='rantong');
 assert.notEqual(elefin.id,rantong.id);assert.notEqual(elefin.mapsQuery,rantong.mapsQuery);
 assert.equal(elefin.video,'DroH1Lm7DMo');assert.equal(elefin.videoSeconds,288);
 assert.equal(rantong.video,'tP4X3XKEaX0');
 assert.match(elefin.hours,/10:00–17:00/);assert.match(elefin.area,/Hang Dong/);
 const media=JSON.parse(read('trip/assets/chiang-mai-media.json'));
 for(const id of elefin.gallery){
  const frame=media.find(m=>m.id===id);
  assert.equal(frame.video,elefin.video);assert.ok(frame.second>=288&&frame.second<=550);
  assert.ok(html.includes(`/trip/assets/${id}.webp`));
  assert.equal(createHash('sha256').update(readFileSync(resolve(root,`trip/assets/${id}.webp`))).digest('hex'),frame.sha256);
 }
 const route=routes.routes.find(r=>r.id==='hangdong');
 for(const list of [route.steps,route.compactSteps]){
  assert.equal(list.find(s=>s.anchor==='elefin').time,'10:30');
  assert.ok(!list.some(s=>['paper','plane','rantong'].includes(s.anchor)));
 }
 assert.match(html,/value="hangdong"/);assert.match(html,/9 個景點與體驗/);
 assert.ok(!routes.combinations.some(c=>c.routes.includes('hangdong')));
});
