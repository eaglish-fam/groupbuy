import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync,rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { SerpApiProvider } from '../flights-pipeline/src/providers/serpapi.mjs';
import { DuffelProvider } from '../flights-pipeline/src/providers/duffel.mjs';
import { providerSecretLocator } from '../flights-pipeline/src/secret-boundary.mjs';
import { normalizeQuote } from '../flights-pipeline/src/radar-model.mjs';
import { RadarStore } from '../flights-pipeline/src/radar-store.mjs';
import { approve,exportApproved,lineDraft } from '../flights-pipeline/src/radar-review.mjs';
import { buildTravelpayoutsUrl } from '../flights-pipeline/src/providers/travelpayouts.mjs';
const query={origin:'TPE',destination:'NRT',outbound:'2026-10-13',inbound:'2026-10-17',currency:'TWD',adults:1};
const at='2026-09-13T03:00:00.000Z';
test('monthly discovery uses provider month parameters without changing exact-date baseline',()=>{
  assert.equal(buildTravelpayoutsUrl(query).searchParams.get('departure_at'),'2026-10-13');
  const u=buildTravelpayoutsUrl({...query,dateMode:'month'});assert.equal(u.searchParams.get('departure_at'),'2026-10');assert.equal(u.searchParams.get('return_at'),'2026-10');
});
test('SerpApi preserves Taiwan currency/market and does not assume return-leg directness',async()=>{
  const body={search_metadata:{processed_at:at,google_flights_url:'https://www.google.com/travel/flights?x=1'},best_flights:[{price:6000,flights:[{departure_airport:{id:'TPE',time:'2026-10-13 13:00'},arrival_airport:{id:'NRT',time:'2026-10-13 17:00'},airline:'Example',flight_number:'EX123'}]}]};
  let seen;const p=new SerpApiProvider({env:{SERPAPI_API_KEY:'hidden'},fetchImpl:async u=>{seen=u;return new Response(JSON.stringify(body));}});
  const response=await p.searchIndicative(query),rows=p.normalizeIndicative(response,query,at);
  assert.equal(seen.searchParams.get('currency'),'TWD');assert.equal(seen.searchParams.get('gl'),'tw');assert.equal(rows[0].isDirect,null);assert.equal(JSON.stringify(rows).includes('hidden'),false);
});
test('provider failure never emits a token-bearing transport URL or body',async()=>{
  const p=new SerpApiProvider({env:{SERPAPI_API_KEY:'SECRET'},fetchImpl:async()=>{throw new Error('https://example.com/?api_key=SECRET');}});
  await assert.rejects(()=>p.searchIndicative(query),e=>!String(e).includes('SECRET'));
});

test('SerpApi deal discovery validates flexible dates and keeps its secret out of candidates',async()=>{
  const body={deals:[{departure_airport_code:'TPE',arrival_airport_code:'ISG',outbound_date:'2026-11-18',return_date:'2026-11-27',price:6037,average_price:16699,discount_percentage:64,stops:0,airline:'Tigerair Taiwan',flight_link:'https://www.google.com/travel/flights/s/example',serpapi_flight_link:'https://serpapi.com/search.json?engine=google_flights&departure_id=TPE&arrival_id=ISG&api_key=should-be-removed'}]};
  let seen;const p=new SerpApiProvider({env:{SERPAPI_API_KEY:'SECRET'},fetchImpl:async url=>{seen=url;return new Response(JSON.stringify(body));}});
  const input={origin:'TPE',outboundStart:'2026-10-01',outboundEnd:'2027-03-31',minNights:3,maxNights:10,currency:'TWD',adults:1};
  const response=await p.searchDeals(input),rows=p.normalizeDeals(response,input,at);
  assert.equal(seen.searchParams.get('engine'),'google_flights_deals');assert.equal(seen.searchParams.get('trip_length'),'3,10');
  assert.equal(rows[0].destination,'ISG');assert.equal(rows[0].price,6037);assert.equal(rows[0].isDirect,true);assert.equal(rows[0].discountPercentage,64);
  assert.equal(rows[0].verificationUrl.includes('api_key'),false);assert.equal(JSON.stringify(rows).includes('SECRET'),false);
});

test('SerpApi selected itinerary recheck only accepts its Google Flights endpoint',async()=>{
  let seen;const p=new SerpApiProvider({env:{SERPAPI_API_KEY:'SECRET'},fetchImpl:async url=>{seen=url;return new Response('{}');}});
  await p.searchSelection('https://serpapi.com/search.json?engine=google_flights&departure_id=TPE&api_key=old',{departureToken:'selection'});
  assert.equal(seen.searchParams.get('api_key'),'SECRET');assert.equal(seen.searchParams.get('departure_token'),'selection');
  await assert.rejects(()=>p.searchSelection('https://example.com/search.json?engine=google_flights'),/safe SerpApi/);
});

test('SerpApi secret has a named Keychain boundary without embedding its value',()=>{
  assert.deepEqual(providerSecretLocator('serpapi'),{environmentVariable:'SERPAPI_API_KEY',service:'terra-serpapi-api',account:'zosia'});
  assert.equal(providerSecretLocator('unknown'),null);
});
test('Duffel only verifies selected itineraries and rejects sandbox offers',async()=>{
  let calls=0;const p=new DuffelProvider({env:{DUFFEL_ACCESS_TOKEN:'hidden'},fetchImpl:async()=>{calls++;return new Response(JSON.stringify({data:{live_mode:false,offers:[]}}));}});
  await assert.rejects(()=>p.searchLive(query));assert.equal(calls,0);
  await assert.rejects(()=>p.searchLive(query,{userInitiated:true}),/test results/);assert.equal(calls,1);
});
test('review binds exact price, dates and conditions; changed/expired versions cannot export',t=>{
  const root=mkdtempSync(join(tmpdir(),'radar-review-')),s=new RadarStore(join(root,'data.sqlite'));t.after(()=>{s.close();rmSync(root,{recursive:true,force:true});});
  const quote=normalizeQuote({provider:'travelpayouts',providerResultId:'x',priceAmount:6000,origin:'TPE',destination:'NRT',departure:query.outbound,returnDeparture:query.inbound,adults:1,cabinClass:'economy',currency:'TWD',isDirect:true,bookingUrl:'https://www.aviasales.com/search/a',freshness:'cached_recent_user_search'},query,at);
  s.insert([quote],'run','query');
  const e={actor:'test-reviewer',status:'confirmed',url:quote.bookingUrl,checkedAt:at,...Object.fromEntries(['origin','destination','outboundDate','inboundDate','adults','currency','isDirect','baggage','price'].map(k=>[k,quote[k]]))};
  assert.throws(()=>approve(s,quote.id,{...e,price:1},at));
  assert.equal(exportApproved(s,{routes:[]},at).length,0);
  approve(s,quote.id,e,at);const rows=exportApproved(s,{routes:[]},at);assert.equal(rows.length,1);assert.equal(lineDraft(rows[0]).reviewRequired,true);
  assert.equal(exportApproved(s,{routes:[]},'2026-09-13T05:00:00.000Z').length,0);
});
