import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resizePlan,replaceDay,compactPath} from '../trip/bangkok-planner-model.mjs';
import {bangkokRoutes as config} from '../scripts/trip-bangkok-routes.mjs';
import {bangkokCatalog} from '../scripts/trip-bangkok-places.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('planner gives 2–5 unique area routes and preserves changes when resized',()=>{
 for(const {days,routes} of config.combinations){
  assert.deepEqual(resizePlan([],days,config),routes);
  for(const count of [2,3,4,5]){
   const result=resizePlan(routes,count,config);
   assert.equal(result.length,count);assert.equal(new Set(result).size,count);
  }
 }
 const custom=replaceDay(resizePlan([],2,config),0,'riverside',config);
 assert.deepEqual(custom,['riverside','siam']);
 assert.deepEqual(resizePlan(custom,3,config),['riverside','siam','chatuchak']);
 assert.throws(()=>resizePlan([],6,config),RangeError);
});
test('replacing an existing route swaps days without duplicate stops or input mutation',()=>{
 for(const combo of config.combinations)for(let index=0;index<combo.days;index++)for(const route of config.routes){
  const input=[...combo.routes],next=replaceDay(input,index,route.id,config);
  assert.equal(next[index],route.id);assert.equal(next.length,input.length);
  assert.equal(new Set(next).size,next.length);assert.deepEqual(input,combo.routes);
  const other=input.indexOf(route.id);if(other>=0)assert.equal(next[other],input[index]);
 }
 assert.throws(()=>replaceDay(['chatuchak'],2,'siam',config),RangeError);
 assert.throws(()=>replaceDay(['chatuchak'],0,'missing',config),RangeError);
});
test('visual overview has eight source-bound responsive thumbnails and concise copy',()=>{
 const html=read('trip/guides/bangkok-with-kids/index.html');
 const overview=html.match(/<div class="bkk-overview">([\s\S]*?)<div class="actions">/)[1];
 assert.equal((overview.match(/<img /g)||[]).length,8);
 for(const p of bangkokCatalog.places){
  assert.ok(overview.includes(`href="#${p.anchor}"`));
  assert.ok(overview.includes(`/trip/assets/${p.image}-640.webp 640w`));
 }
 assert.equal((overview.match(/loading="lazy"/g)||[]).length,8);
 assert.equal((overview.match(/sizes="\(max-width:700px\) 44vw, 200px"/g)||[]).length,8);
});
test('planner is above long guides and has a readable collapsed no-JavaScript fallback',()=>{
 const html=read('trip/guides/bangkok-with-kids/index.html');
 assert.ok(html.indexOf('<section id="plan"')<html.indexOf('<section id="market"'));
 const details=[...html.matchAll(/<details class="bkk-day"[^>]*>/g)];
 assert.equal(details.length,5);
 for(const [tag] of details){assert.doesNotMatch(tag,/\bhidden\b|\bopen\b/);}
 assert.match(html,/class="bkk-planner-controls" hidden/);
 assert.doesNotMatch(html,/class="bkk-combinations"/);
 assert.match(html,/type="module" src="\/trip\/bangkok-planner.mjs/);
 const nav=html.match(/<nav[^>]*data-reading-nav[^>]*>([\s\S]*?)<\/nav>/)[1];
 assert.ok(nav.indexOf('#plan')<nav.indexOf('#market'));
 const embedded=JSON.parse(html.match(/id="bkk-planner-data">([\s\S]*?)<\/script>/)[1]);
 assert.deepEqual(embedded.combinations,config.combinations);
});
test('compact mode has a separate, source-aware timeline for every route',()=>{
 const html=read('trip/guides/bangkok-with-kids/index.html');
 for(const route of config.routes){
  assert.ok(route.compactDuration&&route.compactNote&&route.compactSteps.length>=4);
  for(const step of route.compactSteps){
   if(step.anchor)assert.ok(bangkokCatalog.places.some(p=>p.anchor===step.anchor));
   if(step.mapsQuery)assert.ok(html.includes(`query=${encodeURIComponent(step.mapsQuery)}`));
  }
  if(route.compactSourceUrl)assert.ok(html.includes(route.compactSourceUrl));
 }
 assert.equal((html.match(/class="bkk-compact-variant"/g)||[]).length,config.routes.length);
 assert.equal((html.match(/class="route-description" data-pace="compact"[^>]*hidden/g)||[]).length,config.routes.length+1);
 assert.match(html,/name="bkk-pace" value="relaxed" checked/);
 assert.match(html,/name="bkk-pace" value="compact"/);
 assert.ok(config.routes.find(r=>r.id==='chatuchak').compactSteps.some(s=>s.mapsQuery?.includes('Yaowarat')));
 assert.ok(config.routes.find(r=>r.id==='riverside').compactSteps.some(s=>s.mapsQuery?.includes('ICONSIAM')));
 const safari=config.routes.find(r=>r.id==='safari');
 assert.ok(safari.compactNote.includes('平日 16:00、週末 17:00'));
 assert.ok(safari.compactSteps.every(s=>!(s.time>='17:00'&&s.title.includes('Safari'))));
});
test('Jurassic evening appears after the museum only when not duplicated on a riverside day',()=>{
 const route=config.routes.find(r=>r.id==='chatuchak');
 assert.equal(compactPath(['chatuchak','siam'],'chatuchak'),'jurassic');
 assert.equal(compactPath(['chatuchak','siam','safari','riverside'],'chatuchak'),'standard');
 assert.equal(compactPath(['chatuchak','riverside'],'riverside'),'standard');
 assert.ok(route.compactJurassicSteps.some(s=>s.anchor==='museum'&&s.time==='12:30'));
 assert.ok(route.compactJurassicSteps.some(s=>s.anchor==='jurassic'&&s.time==='19:00'));
 assert.ok(route.compactJurassicSteps.some(s=>s.anchor==='asiatique'&&s.time==='17:30'));
 const riverside=config.routes.find(r=>r.id==='riverside');
 assert.ok(riverside.compactSteps.some(s=>s.anchor==='jurassic'&&s.time==='19:00'));
 const html=read('trip/guides/bangkok-with-kids/index.html');
 assert.match(html,/data-compact-path="jurassic"/);
 assert.match(html,/侏羅紀體驗官方場次與接駁時間/);
});
test('every attraction timeline stop displays checked opening guidance and a direct Google Maps link',()=>{
 const html=read('trip/guides/bangkok-with-kids/index.html');
 const places=new Map(bangkokCatalog.places.map(p=>[p.anchor,p]));
 for(const place of bangkokCatalog.places){
  assert.ok(place.plannerHours,`${place.anchor} missing planning hours`);
  assert.ok(place.sources.length,`${place.anchor} missing time source`);
  assert.ok(html.includes(`query=${encodeURIComponent(place.mapsQuery)}`));
  assert.ok(html.includes(`開放參考：${place.plannerHours}`));
 }
 for(const route of config.routes){
  for(const steps of [route.steps,route.compactSteps,route.compactJurassicSteps||[]]){
   for(const step of steps){
    if(step.anchor)assert.ok(places.has(step.anchor));
    if(step.mapsQuery){
     assert.ok(step.hours,`${step.title} missing opening guidance`);
     assert.ok(html.includes(`query=${encodeURIComponent(step.mapsQuery)}`));
    }
   }
  }
 }
 assert.match(html,/景點時間於 2026-09-27 核對/);
 assert.match(html,/出發前再看地圖的當日營業狀態/);
});
