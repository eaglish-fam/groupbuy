import test from 'node:test';
import assert from 'node:assert/strict';
import {planCebuBohol,normalizePlan,stateFromSearch,planSearch} from '../trip/cebu-bohol-planner-model.mjs';

test('all 16 combinations keep Cebu and transfers outside complete Bohol days, with no duplicated place',()=>{
 for(const days of [1,2])for(const pace of ['relaxed','packed'])for(const buggy of [false,true])for(const lunch of [false,true]){
  const p=planCebuBohol({days,pace,buggy,lunch});assert.equal(p.days.length,days);
  const ids=p.days.flatMap(d=>d.stops.map(s=>s.id));assert.equal(new Set(ids).size,ids.length);
  assert.equal(ids.includes('buggy'),buggy);assert.equal(ids.includes('lunch'),lunch&&!(days===1&&pace==='relaxed'&&buggy));
  if(days===1&&pace==='relaxed')assert.equal(ids.length,2,'lunch boat counts as an experience');
  if(lunch&&!ids.includes('lunch'))assert.ok(p.warnings.some(x=>x.includes('未排入')));
  assert.ok(!ids.includes('cebu'));assert.match(p.transfers.before,/不算完整/);assert.match(p.transfers.after,/宿霧/);
 }
});
test('one relaxed day with a lunch boat explicitly replaces the hills instead of scheduling three activities',()=>{
 const p=planCebuBohol({days:1,pace:'relaxed',buggy:false,lunch:true});
 assert.deepEqual(p.days[0].stops.map(s=>s.id),['tarsier','lunch']);
 assert.match(p.warnings.join(' '),/未安排：巧克力山/);
 assert.deepEqual(planCebuBohol().days[0].stops.map(s=>s.id),['hills','tarsier']);
});
test('days and pace change actual routes; toggles change activities',()=>{
 const one=planCebuBohol({days:1,pace:'relaxed',buggy:true,lunch:true});
 const two=planCebuBohol({days:2,pace:'relaxed',buggy:true,lunch:true});
 const packed=planCebuBohol({days:1,pace:'packed',buggy:true,lunch:true});
 assert.notDeepEqual(one.days,two.days);assert.notDeepEqual(one.days,packed.days);
 assert.ok(!planCebuBohol({buggy:false,lunch:false}).days.flatMap(d=>d.stops).some(s=>['buggy','lunch'].includes(s.id)));
});
test('share state round-trips independently of reading hash, clamps invalid values and preserves other query keys',()=>{
 const state={days:2,pace:'packed',buggy:true,lunch:false};const q=planSearch('?ref=family',state);
 assert.deepEqual(stateFromSearch(q),state);assert.match(q,/ref=family/);
 assert.deepEqual(normalizePlan({days:'99',pace:'<script>',buggy:'false',lunch:'0'}),{days:1,pace:'relaxed',buggy:false,lunch:false});
});
