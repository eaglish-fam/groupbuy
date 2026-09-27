import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {cities,allocateTrip,stateFromHash,shareHash} from '../trip/thailand-model.mjs';
import {hubPlaces} from '../scripts/trip-thailand-hub.mjs';
test('Thailand planner accounts for every day without duplicate cities',()=>{
 for(const selected of [[cities[0].id],['chiang-mai','chiang-rai'],cities.map(c=>c.id)])for(const first of selected)for(const pace of ['relaxed','compact'])for(let days=3;days<=14;days++){
  const p=allocateTrip({selected,first,pace,days});
  if(!p.valid){assert.ok(p.needed>days);continue;}
  assert.equal(p.stops[0].id,first);assert.equal(new Set(p.stops.map(s=>s.id)).size,selected.length);
  assert.equal(p.usable+p.transfers+2,days);
  const used=[1,days,...p.stops.flatMap(s=>[...Array.from({length:s.count},(_,i)=>s.start+i),...(s.transferDay?[s.transferDay]:[])])];
  assert.deepEqual(used.sort((a,b)=>a-b),Array.from({length:days},(_,i)=>i+1));
 }
});
test('Pace changes viable allocations; empty and malicious hash values normalize',()=>{
 assert.equal(allocateTrip({selected:['bangkok'],days:3,pace:'relaxed'}).valid,false);
 assert.equal(allocateTrip({selected:['bangkok'],days:3,pace:'compact'}).valid,true);
 assert.equal(allocateTrip({selected:[],days:7}).valid,false);
 const clean=stateFromHash('#cities=bad,bangkok,bangkok&days=999&first=bad&pace=<script>');
 assert.deepEqual(clean,{selected:['bangkok'],first:'bangkok',days:14,pace:'relaxed'});
 assert.equal(stateFromHash('').days,7);
 const a={selected:['chiang-mai','chiang-rai'],first:'chiang-rai',days:9,pace:'compact'};
 assert.deepEqual(stateFromHash(shareHash(a)),a);
 assert.deepEqual(allocateTrip({selected:cities.map(c=>c.id),first:'chiang-mai',days:10}).stops.map(s=>s.id),['chiang-mai','chiang-rai','bangkok']);
});
test('Thailand cards resolve to existing city guide anchors and photos',()=>{
 assert.equal(hubPlaces.length,13);
 for(const p of hubPlaces){const c=cities.find(c=>c.id===p.city);const html=readFileSync(new URL('..'+c.guide+'index.html',import.meta.url),'utf8');assert.ok(html.includes(`id="${p.anchor}"`),p.anchor);assert.ok(existsSync(new URL('../trip/assets/'+p.image+'.webp',import.meta.url)));}
});
test('Country hub has static crawlable links, one priority image and late planner',()=>{
 const html=readFileSync(new URL('../trip/thailand/index.html',import.meta.url),'utf8');
 assert.equal((html.match(/<h1[ >]/g)||[]).length,1);
 assert.ok(html.includes('CollectionPage'));
 for(const c of cities)assert.ok(html.includes(`href="${c.guide}"`));
 assert.equal((html.match(/<img[^>]+fetchpriority="high"/g)||[]).length,1);
 assert.ok(html.indexOf('id="plan"')>html.indexOf('id="faq"'));
 assert.ok(!html.includes('悠閒散步'));
});
