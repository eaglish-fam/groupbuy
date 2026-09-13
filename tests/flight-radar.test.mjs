import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { RadarStore } from '../flights-pipeline/src/radar-store.mjs';
import { normalizeQuote,historyFor,candidates } from '../flights-pipeline/src/radar-model.mjs';
import { seedPanel } from '../flights-pipeline/src/radar-plan.mjs';
import { collect } from '../flights-pipeline/src/radar-collect.mjs';
import { verifyQuote } from '../flights-pipeline/src/radar-verify.mjs';
import { normalizeQuery } from '../flights-pipeline/src/query.mjs';
import { normalizeLiveResponse,normalizeTravelpayoutsResponse } from '../flights-pipeline/src/normalize.mjs';

const config={dailyRequestLimit:5,runRequestLimit:2,retryLimit:1,maxRuntimeSeconds:10,minIntervalHours:20,leadDays:[30],routes:[{origin:'TPE',destination:'NRT',nights:4},{origin:'TPE',destination:'KIX',nights:4},{origin:'KHH',destination:'NRT',nights:4}]};
const q=normalizeQuery({origin:'TPE',destination:'NRT',outbound:'2027-01-10',inbound:'2027-01-14'});
const at='2026-09-13T02:00:00.000Z';
const raw={provider:'travelpayouts',providerResultId:'fare-1',origin:'TPE',destination:'NRT',departure:'2027-01-10T13:00:00',returnDeparture:'2027-01-14T10:00:00',adults:1,cabinClass:'economy',currency:'TWD',priceAmount:8000,priceUnit:null,isDirect:true,bookingUrl:'https://www.aviasales.com/search/test',freshness:'cached_recent_user_search',providerObservedAt:at};
function temporary(t){const root=mkdtempSync(join(tmpdir(),'radar-test-'));const s=new RadarStore(join(root,'db.sqlite'));t.after(()=>{s.close();rmSync(root,{recursive:true,force:true});});return {s,root};}

test('observation import is idempotent, preserves later fetches, and backup restores',t=>{
  const {s,root}=temporary(t),r=normalizeQuote(raw,q,at);
  assert.equal(s.insert([r],'r','q'),1);assert.equal(s.insert([r],'r','q'),0);
  const later=normalizeQuote(raw,q,'2026-09-14T02:00:00.000Z');assert.equal(s.insert([later],'r2','q'),1);
  assert.equal(historyFor(later,s.quotes(),'2026-09-14T02:00:00.000Z').windows[7].samples,1);
  const path=s.backup(join(root,'backup.sqlite'));const backup=new DatabaseSync(path,{readOnly:true});assert.equal(backup.prepare('select count(*) n from radar_quotes').get().n,2);backup.close();
});
test('same cache repeatedly fetched cannot manufacture 30-day coverage',()=>{
  const rows=Array.from({length:40},(_,i)=>normalizeQuote(raw,q,new Date(Date.parse(at)+i*86400000).toISOString()));
  const h=historyFor(rows.at(-1),rows,rows.at(-1).fetchedAt);assert.equal(h.windows[30].mature,false);assert.ok(h.windows[30].observedDays<=1);
});
test('history needs actual elapsed time and 80% distinct source days, with exact condition isolation',()=>{
  const rows=Array.from({length:100},(_,i)=>{const date=new Date(Date.parse(at)+i*86400000).toISOString();return normalizeQuote({...raw,providerObservedAt:date,providerResultId:'fare-'+i,priceAmount:10000-i},q,date);});
  const last=rows.at(-1),h=historyFor(last,rows,last.fetchedAt);
  assert.equal(h.windows[30].mature,true);assert.equal(h.windows[90].mature,true);
  const different=normalizeQuote({...raw,isDirect:false,priceAmount:1,providerObservedAt:last.fetchedAt},q,last.fetchedAt);
  assert.equal(historyFor(last,[...rows,different],last.fetchedAt).windows[30].min,9901);
  assert.equal(historyFor(last,rows.slice(-2),last.fetchedAt).windows[30].mature,false);
});
test('negative, unknown units, unknown transfers and legacy history fail conservatively',()=>{
  assert.equal(normalizeQuote({...raw,priceAmount:0},q,at),null);
  assert.equal(normalizeQuote({...raw,priceUnit:'unknown'},q,at),null);
  assert.equal(normalizeQuote({...raw,priceAmount:8000000,priceUnit:'PRICE_UNIT_MILLI'},q,at).price,8000);
  assert.equal(normalizeQuote(raw,q,at,{legacy:true}).sourceQualified,false);
  assert.equal(normalizeTravelpayoutsResponse({success:true,data:[{price:8000}]},q,at)[0].isDirect,null);
  const response={status:'RESULT_STATUS_COMPLETE',content:{results:{itineraries:{i:{legIds:['a','b'],pricingOptions:[{price:{amount:100,unit:'PRICE_UNIT_WHOLE'}}]}},legs:{a:{segmentIds:['1','2']},b:{segmentIds:['3']}}}}};
  assert.equal(normalizeLiveResponse(response,q,at)[0].isDirect,false);
});
test('fixed panel survives date changes; oldest unattempted routes rotate fairly',async t=>{
  const {s}=temporary(t);seedPanel(s,config,'travelpayouts',at);
  const first=s.due('travelpayouts',at,3).map(x=>x.query_json);
  seedPanel(s,config,'travelpayouts','2026-09-14T02:00:00.000Z');assert.deepEqual(s.due('travelpayouts',at,3).map(x=>x.query_json),first);
  const calls=[],provider={id:'travelpayouts',searchIndicative:async query=>{calls.push(query.origin+'-'+query.destination);return {};},normalizeIndicative:()=>[]};
  const run=await collect({store:s,provider,config,now:()=>at,sleep:async()=>{}});assert.equal(run.requests,2);
  await collect({store:s,provider,config,now:()=>at,sleep:async()=>{}});assert.equal(new Set(calls).size,3);
  assert.equal(s.health(at).attempts[0].status,'empty');
});
test('retries count against budget, lock excludes concurrent collectors, pause stops all calls',async t=>{
  const {s}=temporary(t);let calls=0;
  const provider={id:'travelpayouts',searchIndicative:async()=>{calls++;throw {code:'timeout',retryable:true};},normalizeIndicative:()=>[]};
  const result=await collect({store:s,provider,config,now:()=>at,sleep:async()=>{}});assert.equal(calls,2);assert.equal(result.status,'failed');
  s.acquire('other',at);assert.equal((await collect({store:s,provider,config,now:()=>at})).status,'already_running');s.release('other');
  s.set('paused',true);assert.equal((await collect({store:s,provider,config,now:()=>at})).status,'paused');assert.equal(calls,2);
});
test('eligible candidate requires a real rule, unexpired quote and safe supplier link',()=>{
  const row=normalizeQuote(raw,q,at);assert.equal(candidates([row],at,{}).length,0);
  assert.equal(candidates([row],at,{'TPE-NRT':9000}).length,1);
  assert.equal(candidates([row],'2026-09-14T02:00:00.000Z',{'TPE-NRT':9000}).length,0);
  assert.equal(candidates([normalizeQuote({...raw,bookingUrl:'javascript:alert(1)'},q,at)],at,{'TPE-NRT':9000}).length,0);
});

test('live verification counts every create/poll request and releases its lock',async t=>{
  const {s}=temporary(t),quote=normalizeQuote(raw,q,at);let calls=0;
  const createProvider=fetchImpl=>({searchLive:async()=>{await fetchImpl('https://example.com/create');await fetchImpl('https://example.com/poll');return {};},normalizeLive:()=>[]});
  const result=await verifyQuote({store:s,quote,providerName:'duffel',createProvider,config,now:()=>at,fetchImpl:async()=>{calls++;return {ok:true};}});
  assert.equal(result.requests,2);assert.equal(calls,2);assert.equal(s.attemptsSince(at),2);
  assert.equal(s.health(at).runs[0].requests,2);assert.equal(s.acquire('after',at),true);s.release('after');
});

test('live verification stops at shared budget and records transport failure without secrets',async t=>{
  const {s}=temporary(t),quote=normalizeQuote(raw,q,at);let calls=0;
  const createProvider=fetchImpl=>({searchLive:async()=>{await fetchImpl('https://example.com/create');await fetchImpl('https://example.com/poll');return {};},normalizeLive:()=>[]});
  await assert.rejects(verifyQuote({store:s,quote,providerName:'duffel',createProvider,config:{...config,dailyRequestLimit:1},now:()=>at,fetchImpl:async()=>{calls++;return {ok:true};}}),/Live verification failed/);
  assert.equal(calls,1);assert.equal(s.health(at).runs[0].status,'failed');
  await assert.rejects(verifyQuote({store:s,quote,providerName:'duffel',createProvider,config,now:()=>at,fetchImpl:async()=>{throw new Error('secret-token');}}),/Live verification failed/);
  assert.equal(JSON.stringify(s.health(at)).includes('secret-token'),false);
  assert.equal(s.acquire('after',at),true);s.release('after');
});
