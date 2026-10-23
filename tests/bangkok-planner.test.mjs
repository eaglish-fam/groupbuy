import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {bangkokCatalog} from '../scripts/trip-bangkok-places.mjs';
const config=JSON.parse(readFileSync(new URL('../trip/data/bangkok-routes.json',import.meta.url),'utf8'));
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
// The guide now renders from the approved Thailand package (Japan template).
const pkg=JSON.parse(read('trip/data/thailand-approved-travel-v1.json'));
const city=pkg.cities.find(c=>c.id==='bangkok');

test('visual overview has nine source-bound responsive thumbnails and concise copy',()=>{
 const html=read('trip/guides/bangkok-with-kids/index.html');
 const overview=html.match(/<section id="places">[\s\S]*?<\/section>/)[0];
 assert.equal((overview.match(/<img /g)||[]).length,9);
 for(const p of bangkokCatalog.places){
  assert.ok(overview.includes(`href="#${p.anchor}"`));
  assert.match(overview,new RegExp(`/trip/assets/[a-z0-9-]+-640\\.webp 640w`));
 }
 assert.equal((overview.match(/loading="lazy"/g)||[]).length,9);
});
test('planner follows the guide, after the FAQ, with every route present in the static page',()=>{
 const html=read('trip/guides/bangkok-with-kids/index.html');
 assert.ok(html.indexOf('<section id="faq"')<html.indexOf('<section id="plan"'));
 assert.ok(html.indexOf('<section id="market"')<html.indexOf('<section id="plan"'));
 const plan=html.match(/<section id="plan"[\s\S]*?<\/section>/)[0];
 for(const r of city.planner.routes)assert.ok(plan.includes(`value="${r.id}"`),r.id);
 for(const {days} of config.combinations)for(const pace of ['leisure','compact'])assert.ok(city.planner.routes.some(r=>r.id===`bangkok-${days}d-${pace}`));
 for(const route of config.routes)assert.ok(city.planner.routes.some(r=>r.id===`bangkok-1d-${route.id}-leisure`),route.id);
 const nav=html.match(/<nav[^>]*data-reading-nav[^>]*>([\s\S]*?)<\/nav>/)[1];
 assert.ok(nav.indexOf('#market')<nav.indexOf('#plan'));
});
test('compact mode has a separate, source-aware timeline for every route',()=>{
 const html=read('trip/guides/bangkok-with-kids/index.html');
 for(const route of config.routes){
  assert.ok(route.compactDuration&&route.compactNote&&route.compactSteps.length>=4);
  const compact=city.planner.routes.find(r=>r.id===`bangkok-1d-${route.id}-compact`).days[0],leisure=city.planner.routes.find(r=>r.id===`bangkok-1d-${route.id}-leisure`).days[0];
  assert.notDeepEqual(compact.blocks,leisure.blocks,route.id);
  for(const step of route.compactSteps){
   if(step.anchor)assert.ok(bangkokCatalog.places.some(p=>p.anchor===step.anchor));
   if(step.mapsQuery)assert.ok(html.includes(`query=${encodeURIComponent(step.mapsQuery)}`));
  }
  if(route.compactSourceUrl)assert.ok(html.includes(route.compactSourceUrl));
 }
 assert.ok(config.routes.find(r=>r.id==='chatuchak').compactSteps.some(s=>s.mapsQuery?.includes('Yaowarat')));
 assert.ok(config.routes.find(r=>r.id==='riverside').compactSteps.some(s=>s.mapsQuery?.includes('ICONSIAM')));
 const safari=config.routes.find(r=>r.id==='safari');
 assert.ok(safari.compactNote.includes('平日 16:00、週末 17:00'));
 assert.ok(safari.compactSteps.every(s=>!(s.time>='17:00'&&s.title.includes('Safari'))));
});
test('Jurassic evening appears after the museum only when not duplicated on a riverside day',()=>{
 const market=id=>city.planner.routes.find(r=>r.id===id).days[0];
 const hasJurassic=day=>day.blocks.some(b=>b.placeIds.includes('jurassic'));
 // Two days (market + Siam): the compact market day takes the Jurassic evening.
 assert.ok(hasJurassic(market('bangkok-2d-compact')));
 assert.ok(market('bangkok-2d-compact').blocks.findIndex(b=>b.placeIds.includes('museum'))<market('bangkok-2d-compact').blocks.findIndex(b=>b.placeIds.includes('jurassic')));
 // Four days include the riverside day, so the market day does not repeat it.
 assert.ok(!hasJurassic(market('bangkok-4d-compact')));
 assert.ok(city.planner.routes.find(r=>r.id==='bangkok-4d-compact').days.some(hasJurassic));
 assert.match(read('trip/guides/bangkok-with-kids/index.html'),/侏羅紀體驗官方場次與接駁時間/);
});
test('every attraction timeline stop displays checked opening guidance and a direct Google Maps link',()=>{
 const html=read('trip/guides/bangkok-with-kids/index.html');
 for(const place of bangkokCatalog.places){
  assert.ok(place.plannerHours,`${place.anchor} missing planning hours`);
  assert.ok(place.sources.length,`${place.anchor} missing time source`);
  assert.ok(html.includes((place.mapsUrl||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.mapsQuery).replaceAll("'",'%27')}`).replaceAll('&','&amp;')),place.anchor);
  assert.ok(JSON.stringify(city.planner).includes(`開放參考：${place.plannerHours}`)||!config.routes.some(r=>r.steps.some(s=>s.anchor===place.anchor)),place.anchor);
 }
 for(const route of config.routes)for(const steps of [route.compactSteps,route.compactJurassicSteps||[]])for(const step of steps)if(step.mapsQuery){
  assert.ok(step.hours,`${step.title} missing opening guidance`);
  assert.ok(html.includes(`query=${encodeURIComponent(step.mapsQuery)}`));
 }
 assert.match(html,/景點時間於 2026-09-27 核對/);
 assert.match(html,/出發前再看地圖的當日營業狀態/);
});
