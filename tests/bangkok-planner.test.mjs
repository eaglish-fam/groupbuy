import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resizePlan,replaceDay} from '../trip/bangkok-planner-model.mjs';
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
