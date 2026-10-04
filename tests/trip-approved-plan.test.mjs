import test from 'node:test';
import assert from 'node:assert/strict';
import {assessApprovedDay,assessApprovedCityRoute,feasibleApprovedDates,countryPlanWithRules,approvedPlanShareUrl,approvedPlanParameters,clockMinutes} from '../trip/approved-plan-model.mjs';
import {approvedHomePhoto} from '../trip/approved-home-photo.mjs';
import {approvedInlineText,approvedInlineTokens} from '../scripts/trip-approved-text.mjs';
import {renderApprovedCityPlanner} from '../scripts/trip-approved-city-planner.mjs';
const source=['fixture-official'],rule={placeId:'museum',validFrom:'2026-01-01',validThrough:'2026-12-31',note:'Synthetic museum rule',url:'https://example.org/calendar',sourceIds:source,windows:[{from:'2026-01-01',to:'2026-12-31',weekdays:[0,2,3,4,5,6],opens:'10:00',closes:'17:00'}]},day={title:'Synthetic day',description:'Synthetic description',stops:['museum'],blocks:[{start:'10:00',end:'12:00',description:'Synthetic visit',placeIds:['museum']}]};
const city=()=>({id:'fixture-city',name:'Synthetic city',places:[{id:'museum',title:'Synthetic museum'}],planner:{rules:[structuredClone(rule)],routes:[{id:'fixture-route',sightseeingDays:1,pace:'leisure',days:[structuredClone(day)]}]}});
test('no date, outside reviewed year and missing operator data are unknown, not availability',()=>{
 const c=city();assert.equal(assessApprovedDay(c,day).status,'needs-check');assert.equal(assessApprovedDay(c,day,{date:'2027-02-01'}).status,'needs-check');c.planner.rules=[];assert.equal(assessApprovedDay(c,day,{date:'2026-10-06'}).unknown[0].kind,'no-rule');
});
test('weekday closures and next three approved dates are enforced on local dates',()=>{
 const c=city();assert.equal(assessApprovedDay(c,day,{date:'2026-10-05'}).blocked[0].kind,'season-or-weekday');assert.equal(assessApprovedDay(c,day,{date:'2026-10-06'}).status,'within-reviewed-rules');assert.deepEqual(feasibleApprovedDates(c,c.planner.routes[0],{startDate:'2026-10-05'}),['2026-10-06','2026-10-07','2026-10-08']);
});
test('age, annual holiday, season, minimum duration and fixed departure conflict independently',()=>{
 const c=city(),r=c.planner.rules[0];r.minAge=8;r.minimumMinutes=180;r.closedMonthDays=['10-06'];
 assert.equal(assessApprovedDay(c,day,{date:'2026-10-07'}).unknown[0].kind,'age-required');assert.ok(assessApprovedDay(c,day,{date:'2026-10-06',youngestAge:7}).blocked.some(i=>i.kind==='annual-closure'));assert.ok(assessApprovedDay(c,day,{date:'2026-10-07',youngestAge:7}).blocked.some(i=>i.kind==='age'));r.windows[0].startTimes=['11:00'];assert.ok(assessApprovedDay(c,day,{date:'2026-10-07',youngestAge:8}).blocked.some(i=>i.kind==='time-window'));assert.ok(assessApprovedDay(c,day,{date:'2026-10-07',youngestAge:8}).blocked.some(i=>i.kind==='duration'));
 r.windows[0].months=[11];assert.equal(assessApprovedDay(c,day,{date:'2026-10-07',youngestAge:8}).blocked[0].kind,'season-or-weekday');
});
test('annual opening override and midnight endpoint do not invent an overnight date',()=>{
 const c=city();c.planner.rules[0].overrides=[{monthDay:'10-06',opens:'11:00',closes:'16:00'}];assert.equal(assessApprovedDay(c,day,{date:'2026-10-06'}).blocked[0].kind,'time-window');assert.equal(clockMinutes('24:00'),1440);assert.equal(clockMinutes('25:00'),null);assert.throws(()=>assessApprovedDay(c,day,{date:'2026-02-30'}));
});
test('boat eligibility remains unknown even after age and date are filled',()=>{
 const c=city();c.planner.rules[0].needsAgeConfirmation=true;assert.equal(assessApprovedDay(c,day,{date:'2026-10-06',youngestAge:9}).status,'needs-check');assert.deepEqual(feasibleApprovedDates(c,c.planner.routes[0],{startDate:'2026-10-05',youngestAge:9}),[]);
});
test('multi-day date offsets and country arrival/flexible/departure are separate',()=>{
 const c=city(),route=c.planner.routes[0];route.days.push(structuredClone(day));route.sightseeingDays=2;assert.equal(assessApprovedCityRoute(c,route,{startDate:'2026-10-04'})[1].assessment.status,'conflict');
 const country={cityIds:[c.id],allocation:{approved:true,arrivalDays:1,departureDays:1,dayRange:[4,7],extraDays:'round-robin',sourceIds:source,minimumStay:{[c.id]:{leisure:2,compact:2}},routes:[{id:'country-route',label:'Synthetic route',description:'Synthetic description',cityIds:[c.id],transferDays:[],validFrom:'2026-01-01',validThrough:'2026-12-31',sourceIds:source}]}};
 const p=countryPlanWithRules(country,[c],{routeId:'country-route',days:5,pace:'leisure',startDate:'2026-10-05'});assert.equal(p.days.length,5);assert.equal(p.days[0].kind,'arrival');assert.equal(p.days[1].date,'2026-10-06');assert.equal(p.days[3].flexible,true);assert.equal(p.days[4].kind,'departure');
});
test('share only supported public inputs and approved photos use exact explicit variants',()=>{
 const url=approvedPlanShareUrl('https://example.org/trip/?secret=x',{routeId:'fixture-route',days:2,pace:'leisure',startDate:'2026-10-06',day:1,secret:'no'});assert.deepEqual(approvedPlanParameters(url),{routeId:'fixture-route',days:'2',pace:'leisure',startDate:'2026-10-06',day:'1'});assert.ok(!url.includes('secret'));
 const a={assetId:'fixture-photo',width:1200,height:800,alt:'Synthetic photo',focalPoint:[50,50],variants:[{url:'/trip/assets/exact-640.webp',width:640},{url:'/trip/assets/exact-960.webp',width:960}]};const h=approvedHomePhoto(a);assert.match(h,/exact-640.webp 640w, \/trip\/assets\/exact-960.webp 960w/);assert.match(h,/home:approved-fixture-photo/);assert.doesNotMatch(h,/exact-960-640/);assert.throws(()=>approvedHomePhoto({...a,variants:[{url:'/private.webp',width:640},{url:'/x.webp',width:960}]}));
});
test('source-owned return transfer remains distinct from play and international departure',()=>{
 const a=city(),b={...city(),id:'fixture-second'},c={...city(),id:'fixture-third'};
 const country={cityIds:[a.id,b.id,c.id],allocation:{approved:true,arrivalDays:1,departureDays:1,dayRange:[8,8],extraDays:'round-robin',sourceIds:source,minimumStay:Object.fromEntries([a,b,c].map(c=>[c.id,{leisure:1,compact:1}])),routes:[{id:'return-route',label:'Synthetic return',description:'Synthetic return',cityIds:[a.id,b.id,c.id],transferDays:[1,1],terminalTransfer:{from:c.id,to:a.id,days:1,sourceIds:source},validFrom:'2026-01-01',validThrough:'2026-12-31',sourceIds:source}]}};
 const plan=countryPlanWithRules(country,[a,b,c],{routeId:'return-route',days:8,pace:'leisure',startDate:'2026-10-01'});assert.equal(plan.needed,8);assert.equal(plan.days[6].kind,'transfer');assert.equal(plan.days[6].from,c.id);assert.equal(plan.days[6].to,a.id);assert.equal(plan.days[7].kind,'departure');assert.equal(plan.days[7].cityId,a.id);
});
test('fixed city route does not pretend to shorten tours when country pace changes',()=>{
 const c=city();c.planner.title='Synthetic fixed itinerary';c.planner.paragraphs=['Synthetic explanation'];c.planner.routes[0].label='Synthetic fixed route';c.planner.routes[0].note='Synthetic note';c.planner.routes[0].days[0].stops=['museum'];
 const html=renderApprovedCityPlanner(c);assert.match(html,/type="hidden" name="pace" value="leisure"/);assert.doesNotMatch(html,/<select name="pace"/);assert.match(html,/活動時間不隨步調縮短/);
 const country={cityIds:[c.id],allocation:{approved:true,arrivalDays:1,departureDays:1,dayRange:[3,5],extraDays:'round-robin',sourceIds:source,minimumStay:{[c.id]:{leisure:1,compact:1}},routes:[{id:'country-route',label:'Synthetic route',description:'Synthetic description',cityIds:[c.id],transferDays:[],validFrom:'2026-01-01',validThrough:'2026-12-31',sourceIds:source}]}};
 const p=countryPlanWithRules(country,[c],{routeId:'country-route',days:3,pace:'compact',startDate:'2026-10-05'});assert.equal(p.days[1].route.id,'fixture-route');assert.deepEqual(p.days[1].day.blocks,day.blocks);
});
test('editorial inline links preserve official parentheses and escape executable markup',()=>{
 const value='資料 [官網](https://example.org/info_(family))，看 [城市](/trip/guides/fixture-city/)。<script>x</script>';
 assert.equal(approvedInlineTokens(value).filter(t=>t.url).length,2);const html=approvedInlineText(value);assert.match(html,/href="https:\/\/example.org\/info_\(family\)"/);assert.match(html,/&lt;script&gt;/);assert.doesNotMatch(html,/<script/);assert.throws(()=>approvedInlineText('[不安全](https://example.org/?access_token=secret)'));
});
