import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {assessApprovedCityRoute,approvedPlanShareUrl,approvedPlanParameters,countryPlanWithRules,clockMinutes} from '../trip/approved-plan-model.mjs';
import {malaysiaOpening} from '../trip/malaysia-plan-model.mjs';
import {validateMalaysiaExecutionProfile} from '../trip/malaysia-profile.mjs';
import {renderApprovedCityPlanner} from '../scripts/trip-approved-city-planner.mjs';
import {renderPlanShareLink,renderApprovedPlanDay} from '../trip/approved-city-planner.mjs';
import {renderRouteDiagramSvg} from '../scripts/trip-route-diagram.mjs';
import {validateApprovedTravelPackage} from '../trip/approved-travel-contract.mjs';
import {approvedRouteDiagram} from '../scripts/trip-city-approved-adapter.mjs';
import {syntheticTravelPackage} from './fixtures/travel-approved-package.mjs';
const data=JSON.parse(fs.readFileSync(new URL('../trip/data/malaysia-engineering-planner-v1.json',import.meta.url)));
const transport=JSON.parse(fs.readFileSync(new URL('../trip/data/malaysia-engineering-transport-v1.json',import.meta.url)));
const city=id=>data.cities.find(c=>c.id===id),route=(c,n,pace='leisure')=>c.planner.routes.find(r=>r.sightseeingDays===n&&r.pace===pace);
const plan=(id,n,pace='leisure',args={})=>assessApprovedCityRoute(city(id),route(city(id),n,pace),{startDate:'2026-10-13',...args});
const stopDays=(days,id)=>days.filter(d=>d.stops.includes(id));
function checkTimeline(days){
 const seen=new Set();for(const d of days){
  assert.ok(d.blocks.length>=3);assert.deepEqual(d.stops,[...new Set(d.blocks.flatMap(b=>b.placeIds))]);
  let previous=-1;for(const b of d.blocks){assert.ok(clockMinutes(b.start)>=previous);assert.ok(clockMinutes(b.end)>clockMinutes(b.start));previous=clockMinutes(b.end);}
  assert.ok(d.blocks.some(b=>/午餐|用餐/.test(b.description)),'meal included');
  assert.ok(d.blocks.some(b=>/休息|回|報到/.test(b.description)),'rest or return included');
  for(const id of d.stops){assert.ok(!seen.has(id),'no attraction on two days: '+id);seen.add(id);}
  assert.equal(d.assessment.blocked.length,0,'no known conflict is scheduled');
 }
}
for(const c of data.cities)for(const n of [2,3,4])for(const pace of ['leisure','compact'])test(`${c.id} ${n} days ${pace} executes through shared model`,()=>{
 const result=plan(c.id,n,pace);assert.equal(result.length,n);checkTimeline(result);assert.equal(result[0].date,'2026-10-13');assert.equal(result.at(-1).date,'2026-10-'+String(12+n));
});
test('all six day-count choices have substantive leisure/compact variants',()=>{
 for(const c of data.cities)for(const n of [2,3,4])assert.notDeepEqual(plan(c.id,n,'leisure').map(d=>d.blocks),plan(c.id,n,'compact').map(d=>d.blocks));
 assert.equal(stopDays(plan('kuala-lumpur',3,'leisure'),'my-kl-tower').length,0);
 assert.equal(stopDays(plan('kuala-lumpur',3,'compact'),'my-kl-tower').length,1);
 for(const pace of ['leisure','compact'])assert.equal(stopDays(plan('kuala-lumpur',4,pace),'my-kl-tower').length,1);
});
test('Petrosains first/third Mondays and independently specified special dates swap days',()=>{
 for(const startDate of ['2026-10-04','2026-10-18','2026-11-01','2026-11-15']){
  const result=plan('kuala-lumpur',3,'compact',{startDate});checkTimeline(result);
  assert.equal(new Date(stopDays(result,'my-kl-petrosains')[0].date).getUTCDay()===1,false);
  assert.equal(result[1].moduleId,'kl-kidzania-day');
 }
 const c=structuredClone(city('kuala-lumpur'));
 c.planner.executionProfile.venues.find(v=>v.id==='my-kl-petrosains').opening.knownClosedDates.push('2026-10-14');
 const result=assessApprovedCityRoute(c,route(c,3),{startDate:'2026-10-13'});checkTimeline(result);assert.notEqual(stopDays(result,'my-kl-petrosains')[0].date,'2026-10-14');
});
test('Hill morning partial maintenance reorders and whole-week closure shortens',()=>{
 const partial=plan('penang',3,'compact',{startDate:'2026-10-19'});checkTimeline(partial);assert.notEqual(stopDays(partial,'my-penang-hill')[0].date,'2026-10-21');
 const full=plan('penang',4,'leisure',{startDate:'2027-01-04'});checkTimeline(full);assert.equal(stopDays(full,'my-penang-hill').length,0);assert.ok(full.some(d=>d.shortened));
});
test('unknown Mansion never schedules and noConfirmedFarm replaces the ENTIRE afternoon tail',()=>{
 for(const pace of ['leisure','compact']){
  const result=plan('penang',4,pace,{farmConfirmed:true,mansionConfirmed:true});
  assert.equal(stopDays(result,'my-penang-peranakan-mansion').length,0);assert.equal(stopDays(result,'my-penang-durian-tree-house').length,0);
  const afternoon=result.find(d=>d.moduleId==='penang-entopia-day').blocks.filter(b=>b.start>='13:30');
  assert.deepEqual(afternoon.map(b=>[b.start,b.end]),[['13:30','15:00'],['15:00','17:00']]);
  assert.match(afternoon[0].description,/回喬治市/);assert.doesNotMatch(afternoon.map(b=>b.description).join(' '),/果園|山路/);
 }
 assert.doesNotMatch(renderApprovedCityPlanner(city('penang')),/<input[^>]+type="checkbox"/);
});
test('BookXcess Monday remains unknown, can be moved or omitted, never declared closed',()=>{
 const c=city('kuala-lumpur'),v=c.planner.executionProfile.venues.find(v=>v.id==='my-kl-rexkl-bookxcess');
 assert.equal(malaysiaOpening(v,'2026-10-19',{start:'11:00',end:'12:30'}).status,'unknown');
 const result=plan('kuala-lumpur',2,'leisure',{startDate:'2026-10-19'});checkTimeline(result);
 assert.equal(stopDays(result,'my-kl-rexkl-bookxcess').length,0);
 const message=result.flatMap(d=>d.assessment.reminders).find(x=>x.kind==='unknown-monday').message;
 assert.match(message,/確認開放時間/);assert.ok(result.flatMap(d=>d.assessment.reminders).some(x=>x.placeId===v.id&&x.kind==='unknown-monday'));assert.ok(!result.flatMap(d=>d.assessment.blocked).some(x=>x.placeId===v.id));
 const movable=plan('kuala-lumpur',3,'leisure',{startDate:'2026-10-18'});assert.ok(stopDays(movable,'my-kl-rexkl-bookxcess').every(d=>new Date(d.date).getUTCDay()!==1));
});
test('rain swaps the unused Komtar day but cannot repeat an already completed museum',()=>{
 const result=plan('penang',3,'compact',{rain:'3'});checkTimeline(result);assert.equal(result[2].moduleId,'penang-komtar');assert.notEqual(result[2].moduleId,'penang-hill-day');
 const completed=plan('penang',3,'compact',{rain:'3',completedDays:2});checkTimeline(completed);assert.equal(completed[0].moduleId,'penang-old-town');assert.equal(completed[1].moduleId,'penang-komtar');assert.equal(completed[2].stops.length,0);
 const leisurely=plan('penang',3,'leisure',{rain:'3',completedDays:2});checkTimeline(leisurely);assert.equal(leisurely[2].moduleId,'penang-unused-indoor');assert.deepEqual(leisurely[2].stops,['my-penang-top-jurassic']);
});
test('persistent heavy rain gives shorter/rest days, not four invented indoor themes',()=>{
 for(const id of ['penang','kuala-lumpur'])for(const pace of ['leisure','compact']){
  const result=plan(id,4,pace,{rain:'all'});checkTimeline(result);assert.ok(result.some(d=>d.shortened));assert.ok(result.some(d=>!d.stops.length));
  for(const d of result)assert.ok(!d.stops.some(id=>['my-penang-hill','my-penang-butterfly-garden','my-kl-tower','my-kl-kwai-chai-hong','my-penang-komtar-the-top'].includes(id)));
 }
 const kl=plan('kuala-lumpur',4,'compact',{rain:'all'});assert.equal(kl.filter(d=>d.stops.length).length,3);
 const two=plan('kuala-lumpur',2,'compact',{startDate:'2026-10-19',rain:'1'});checkTimeline(two);assert.equal(two[0].moduleId,'kl-kidzania-day');assert.equal(two[1].moduleId,'kl-science');assert.ok(two[0].adjustments.some(a=>a.kind==='changed-interest'));
});
test('aquarium/Jurassic choice is real and the compact second slot chooses the other hall',()=>{
 for(const choice of ['aquarium','jurassic'])for(const pace of ['leisure','compact']){
  const day=plan('penang',2,pace,{indoorChoice:choice}).find(d=>d.moduleId==='penang-komtar');
  assert.equal(day.blocks.find(b=>b.start==='13:15').placeIds[0],'my-penang-top-'+choice);
  if(pace==='compact')assert.notEqual(day.blocks.find(b=>b.start==='13:15').placeIds[0],day.blocks.find(b=>b.start==='14:30').placeIds[0]);
 }
});
test('window and last-entry checks do not confuse closing with last admission',()=>{
 const v=city('kuala-lumpur').planner.executionProfile.venues.find(v=>v.id==='my-kl-petrosains');
 assert.equal(malaysiaOpening(v,'2026-10-13',{start:'16:30',end:'17:00'}).status,'closed');
 assert.equal(malaysiaOpening(v,'2026-10-17',{start:'17:00',end:'18:00'}).status,'open');
 const t=city('penang').planner.executionProfile.venues.find(v=>v.id==='my-penang-komtar-the-top');assert.equal(t.opening.lastEntry,null);
});
test('every rain/date combination retains chronological reachable first/last legs and no duplicates',()=>{
 for(const startDate of ['2026-10-05','2026-10-12','2026-10-19','2026-10-21','2026-11-02','2027-01-04'])for(const c of data.cities)for(const r of c.planner.routes)for(const rain of ['none','all',...Array.from({length:r.sightseeingDays},(_,i)=>String(i+1))])checkTimeline(assessApprovedCityRoute(c,r,{startDate,rain}));
});
test('country planner uses reordered executable days, not the old static order',()=>{
 const c=city('kuala-lumpur'),sourceIds=['fixture-source'];
 const country={cityIds:[c.id],allocation:{approved:true,arrivalDays:1,departureDays:1,dayRange:[4,6],extraDays:'round-robin',sourceIds,minimumStay:{[c.id]:{leisure:2,compact:2}},routes:[{id:'fixture-malaysia-country',label:'Synthetic allocation',description:'Synthetic transfer budget',cityIds:[c.id],transferDays:[],validFrom:'2026-01-01',validThrough:'2027-12-31',sourceIds}]}};
 const result=countryPlanWithRules(country,[c],{routeId:'fixture-malaysia-country',days:4,pace:'compact',startDate:'2026-10-17'});
 assert.equal(result.days[0].kind,'arrival');assert.equal(result.days[3].kind,'departure');assert.ok(result.days[1].day.stops.includes('my-kl-petrosains'));assert.equal(result.days[1].date,'2026-10-18');
});
test('share URL restores only public date, route, pace, day, weather and hall choice',()=>{
 const state={routeId:'penang-4d-compact',days:4,pace:'compact',startDate:'2026-10-19',day:2,rain:'3',indoorChoice:'jurassic',farmConfirmed:true,oauth_code:'secret'};
 const url=approvedPlanShareUrl('https://example.org/test?access_token=secret',state),restored=approvedPlanParameters(url);
 assert.deepEqual(restored,{routeId:state.routeId,days:'4',pace:'compact',startDate:state.startDate,day:'2',rain:'3',indoorChoice:'jurassic'});assert.doesNotMatch(url,/farmConfirmed|oauth|secret|access_token/);
 assert.deepEqual(plan('penang',4,'compact',restored),plan('penang',4,'compact',state));
 for(const args of [{startDate:'2026-02-30'},{rain:'5'},{rain:'maybe'},{indoorChoice:'invented'},{completedDays:-1},{youngestAge:'nan'}])assert.throws(()=>plan('penang',4,'compact',args));
});
test('Malaysia share exposes the actual safe URL even when browser clipboard observation is unavailable',()=>{
 const html=renderPlanShareLink('https://example.org/?day=1&rain=3');assert.match(html,/<input readonly value="https:\/\/example.org\/\?day=1&amp;rain=3">/);
 assert.doesNotMatch(renderPlanShareLink('"/><script>x</script>'),/<script>/);
});
test('undated public day UI suppresses repeated venue echoes without erasing calendar unknowns',()=>{
 const c=city('kuala-lumpur'),day=assessApprovedCityRoute(c,route(c,2),{})[0];assert.ok(day.assessment.unknown.length>=6);
 const html=renderApprovedPlanDay(c,day,day.assessment);assert.doesNotMatch(html,/選好日期後再核對公告|查官方日期與條件/);
 const p=city('penang'),penDay=assessApprovedCityRoute(p,route(p,2),{})[0],penHtml=renderApprovedPlanDay(p,penDay,penDay.assessment);assert.match(penHtml,/娘惹宅邸需先向業者確認/);assert.match(penHtml,/查看相關資料/);
});
test('no-JS retains six readable routes and actual blocks, while unknown slots have no confirmation inputs',()=>{
 for(const c of data.cities){
  const html=renderApprovedCityPlanner(c),fallback=html.slice(html.indexOf('<div data-plan-fallback>'),html.indexOf('<script type="application/json"'));
  assert.equal((fallback.match(/data-approved-route=/g)||[]).length,6);assert.match(fallback,/approved-plan-timeline/);assert.match(fallback,/午餐/);assert.doesNotMatch(fallback,/<a[^>]+#my-penang-durian-tree-house|<a[^>]+#my-penang-peranakan-mansion/);
  assert.doesNotMatch(html,/name="farm|name="mansion|type="checkbox"/);assert.match(html,/name="rain"/);
  for(const p of c.places){assert.equal(p.facts.arrival.label,'交通');assert.equal(p.facts.duration.label,'遊玩時長');}
 }
 assert.equal(city('penang').places.find(p=>p.id==='my-penang-butterfly-garden').title,'Entopia by Penang Butterfly Farm');
 assert.doesNotMatch(JSON.stringify(data),/\/Users\/|file:\/\/|accessToken|credentials|dispatchId|packetSha256/);
});
test('execution profile validates its bounded source/date/place/time dependency closure',()=>{
 for(const c of data.cities)assert.doesNotThrow(()=>validateMalaysiaExecutionProfile(c.planner.executionProfile,{cityId:c.id,placeIds:c.places.map(p=>p.id),sourceCheck:ids=>assert.ok(ids.every(id=>data.sources.some(s=>s.id===id)))}));
 for(const mutate of [p=>p.timeZone='UTC',p=>p.checkedOn='2026-02-30',p=>p.modules[0].blocks[0].placeIds=['invented'],p=>p.modules[0].blocks[1].start='07:00',p=>p.venues.find(v=>v.opening).sourceIds=[],p=>p.venues.find(v=>v.opening).opening.weekly.default=['19:00','10:00']]){
  const c=structuredClone(city('penang'));mutate(c.planner.executionProfile);assert.throws(()=>validateMalaysiaExecutionProfile(c.planner.executionProfile,{cityId:c.id,placeIds:c.places.map(p=>p.id)}));
 }
});
test('rendered day copy and titles match actual stops and do not repeat production disclaimers',()=>{
 for(const c of data.cities)for(const r of c.planner.routes)for(const rain of ['none','all']){
  const result=assessApprovedCityRoute(c,r,{startDate:'2026-10-19',rain});
  for(const d of result){
   const publicCopy=[d.title,d.description,...d.blocks.map(b=>b.description),...d.assessment.reminders.map(r=>r.message)].join(' ');
   assert.doesNotMatch(publicCopy,/不是家庭歷史|不另編|不是已確認休館|不宣稱|不保證當日營運|悠閒版.*緊湊版/);
   assert.equal(d.assessment.reminders.filter(r=>r.kind==='freshness').length,0);
   if(!d.stops.includes('my-penang-peranakan-mansion'))assert.doesNotMatch(d.title,/宅邸/);
   if(d.moduleId==='penang-komtar'&&!d.stops.includes('my-penang-komtar-the-top'))assert.doesNotMatch(d.title,/觀景/);
   if(!d.stops.includes('my-kl-rexkl-bookxcess'))assert.doesNotMatch(d.title,/書店/);
  }
 }
});
test('eight-route transport retains seventeen source legs, timings and ferry early-train caveat',()=>{
 assert.equal(transport.diagram.routes.length,8);assert.equal(transport.diagram.transportLegs.length,17);assert.ok(transport.diagram.bytes<65536);
 assert.match(transport.diagram.routes.find(r=>r.id==='my-ets-ferry').edgeLabels.join(' '),/07:00.*05:15/);
 assert.match(transport.diagram.routes.find(r=>r.id==='my-kul-t1-sentral').sampleCaption,/28分鐘/);
 assert.match(transport.diagram.routes.find(r=>r.id==='my-kul-t2-sentral').sampleCaption,/33分鐘/);
 const bytes=fs.readFileSync(new URL('../trip/assets/malaysia-engineering-transport-g3.svg',import.meta.url));assert.equal(createHash('sha256').update(bytes).digest('hex'),transport.diagram.sha256);assert.equal(bytes.length,transport.diagram.bytes);
});
test('bounded route SVG escapes markup and never emits executable embeds',()=>{
 const value={title:'<script>bad</script>',alt:'A & B',routes:[{id:'safe-route',title:'A < B',nodes:['A & B','<script>bad</script>']}]};
 const result=renderRouteDiagramSvg(value);assert.match(result.svg,/&lt;script&gt;/);assert.doesNotMatch(result.svg,/<script|<foreignObject|href=|onload=/);assert.match(result.svg,/Songti/);
 assert.throws(()=>renderRouteDiagramSvg({...value,routes:[]}));assert.throws(()=>renderRouteDiagramSvg({...value,routes:Array.from({length:9},(_,i)=>({...value.routes[0],id:'route-'+i}))}));assert.throws(()=>renderRouteDiagramSvg({...value,routes:[value.routes[0],value.routes[0]]}));
});
test('approved package admits 1–8 unique diagrams and rejects 0/9/duplicates, preserving two-route renderer',async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'malaysia-route-contract-'));
 try{
  const fixture=await syntheticTravelPackage(root);fixture.sources.push(...transport.sources);
  for(const count of [1,2,8]){
   fixture.cities[0].arrival.diagram={...transport.diagram,id:'fixture-diagram',routes:transport.diagram.routes.slice(0,count)};
   assert.doesNotThrow(()=>validateApprovedTravelPackage(fixture));
  }
  fixture.cities[0].arrival.diagram.routes=[];assert.throws(()=>validateApprovedTravelPackage(fixture),/one to eight/);
  fixture.cities[0].arrival.diagram.routes=Array.from({length:9},(_,i)=>({...transport.diagram.routes[0],id:'fixture-route-'+i}));assert.throws(()=>validateApprovedTravelPackage(fixture),/one to eight/);
  fixture.cities[0].arrival.diagram.routes=[transport.diagram.routes[0],transport.diagram.routes[0]];assert.throws(()=>validateApprovedTravelPackage(fixture),/duplicate diagram route/);
  const html=approvedRouteDiagram({...transport.diagram,routes:transport.diagram.routes.slice(0,2)});assert.equal((html.match(/<dt>/g)||[]).length,2);assert.match(html,/班表核對/);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
