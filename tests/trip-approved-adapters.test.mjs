import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,readFileSync,writeFileSync,symlinkSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {syntheticTravelPackage,writeSyntheticPackage} from './fixtures/travel-approved-package.mjs';
import {validateApprovedTravelPackage,publicUrl} from '../trip/approved-travel-contract.mjs';
import {readApprovedTravelPackage,publicPackageHash} from '../scripts/trip-approved-public-package.mjs';
import {renderApprovedCity,approvedAttractionGallery} from '../scripts/trip-city-approved-adapter.mjs';
import {renderApprovedCountry} from '../scripts/trip-country-approved-adapter.mjs';
import {allocateApprovedCountryTrip,approvedCityDay,addLocalDays} from '../trip/country-approved-model.mjs';
import {prepareApprovedR24Discovery} from '../scripts/trip-approved-discovery.mjs';
import {renderTravelHomeR24} from '../scripts/render-travel-home-r24.mjs';
import {travelHomeCatalog} from '../trip/home-catalog.mjs';
const root=mkdtempSync(resolve(tmpdir(),'approved-travel-tests-'));
const data=await syntheticTravelPackage(root),frozen=writeSyntheticPackage(root,data);
test('portable public package verifies exact article and all eighteen real WebP fixture variants',async()=>{
 const v=await readApprovedTravelPackage(root,{...frozen,countryIds:data.coverage.countryIds,cityIds:data.coverage.cityIds});
 assert.equal(v.verifiedVariants,18);assert.equal(v.cities.size,4);assert.equal(v.countries.size,2);
 assert.throws(()=>validateApprovedTravelPackage(data,{cityIds:[...data.coverage.cityIds,'fifth-city']}),/coverage mismatch/);
});
test('reject missing provenance, altered identity, malformed media, calendars and unsafe public paths',()=>{
 const changes=[d=>d.approved=false,d=>d.assets[0].sourceIds=['unknown'],d=>d.assets[0].variants[0].url='/trip/assets/../../secret.webp',d=>d.assets[0].variants[0].url='/trip/assets/%2e%2e/secret.webp',d=>d.assets[0].variants[0].sha256='not-hash',d=>d.assets[0].variants[0].height=1,d=>d.assets[0].variants[0].bytes=120001,d=>d.assets[0].focalPoint=[1000,50],d=>d.cities[0].cards[0].assetId=d.assets[5].assetId,d=>d.cities[0].places[0].images=[d.assets[0].assetId,d.assets[0].assetId,d.assets[0].assetId],d=>delete d.cities[0].places[0].facts.availability,d=>d.cities[0].places[0].links[0].url='#unknown',d=>d.cities[0].planner.routes[0].days[0].stops=['unknown'],d=>d.cities[0].planner.calendar[0].closedDates=['2026-02-30'],d=>d.cities[0].planner.calendar[0].validThrough='2025-01-01',d=>d.countries[0].cityIds.push('unknown'),d=>d.cities[0].path=d.countries[0].path,d=>d.cities[0].rawPath='/Users/private/source',d=>delete d.cities[0].visitedBase,d=>d.coverage.cityIds.pop()];
 for(const change of changes){const v=structuredClone(data);change(v);assert.throws(()=>validateApprovedTravelPackage(v));}
 for(const url of ['javascript:alert(1)','//evil.example','file:///secret','https://name:pass@example.org','https://example.org/?access_token=secret','https://example.org/?api_key=secret','https://example.org/?oauth_code=secret','/trip/../secret/','/trip/%2e%2e/secret/'])assert.throws(()=>publicUrl(url));
 const missingDate=structuredClone(data);delete missingDate.sources.find(s=>s.kind==='official').checkedOn;assert.throws(()=>validateApprovedTravelPackage(missingDate),/source check date/);
});
test('byte closure rejects changed JSON, missing media, changed media and symlink escape',async()=>{
 await assert.rejects(readApprovedTravelPackage(root,{...frozen,expectedSha256:'0'.repeat(64)}),/article bytes/);
 const second=mkdtempSync(resolve(tmpdir(),'approved-closure-')),copy=structuredClone(data);const frozen2=writeSyntheticPackage(second,copy);
 await assert.rejects(readApprovedTravelPackage(second,frozen2),/ENOENT/);
 mkdirSync(resolve(second,'trip/assets'),{recursive:true});symlinkSync(resolve(root,'trip/assets/fixture'),resolve(second,'trip/assets/fixture'));
 await assert.rejects(readApprovedTravelPackage(second,frozen2),/escape/);
 const asset=data.assets[5],variant=asset.variants[0],path=resolve(root,variant.url.slice(1)),before=readFileSync(path);
 try{writeFileSync(path,Buffer.concat([before,Buffer.from('changed')]));await assert.rejects(readApprovedTravelPackage(root,frozen),/byte closure/);}finally{writeFileSync(path,before);}
});
test('active-picture lineage refuses guessed bounds and missing exact video frame provenance',()=>{
 for(const change of [d=>delete d.assets[0].lineage,d=>d.assets[0].lineage.activePicture.x=1,d=>d.assets[0].lineage.activePicture.height=100,d=>d.assets[0].lineage.kind='video-frame',d=>d.assets[0].lineage.sourceSha256='guessed']){
  const copy=structuredClone(data);change(copy);assert.throws(()=>validateApprovedTravelPackage(copy));
 }
 const copy=structuredClone(data);Object.assign(copy.assets[0].lineage,{kind:'video-frame',pts:123456,timebase:'1/90000'});assert.doesNotThrow(()=>validateApprovedTravelPackage(copy));
});
test('reject hash-consistent false WebP dimensions or format rather than trusting declared metadata',async()=>{
 const copy=structuredClone(data);copy.assets[0].variants[0].width=319;copy.assets[0].variants[0].height=479;
 const f=writeSyntheticPackage(root,copy);await assert.rejects(readApprovedTravelPackage(root,f),/dimensions\/format/);writeSyntheticPackage(root,data);
});
test('generic source-aware city uses one priority image, distinct heroes, six-question facts and FAQ-plan-video order',()=>{
 for(const city of data.cities){const html=renderApprovedCity(data,city.id);
  assert.match(html,/content="noindex,nofollow"/);assert.equal((html.match(/<img[^>]*fetchpriority="high"/g)||[]).length,1);
  for(const slot of ['main','support-1','support-2'])assert.ok(html.includes(`data-hero-slot="${slot}"`));
  assert.ok(html.indexOf('<section id="faq"')<html.indexOf('<section id="plan"'));assert.ok(html.indexOf('<section id="plan"')<html.indexOf('<section id="videos"'));
  assert.match(html,/class="bkk-facts"/);assert.match(html,/class="bkk-experience"/);assert.match(html,/class="city-gallery-pair"/);assert.match(html,/--city-pair-columns:[0-9.]+fr [0-9.]+fr/);
  assert.match(html,/data-city-guide-template="eaglish.city-guide\/v1"/);assert.match(html,/data-reading-nav/);assert.match(html,/href="#plan" aria-label="行程規劃"/);
  assert.ok(html.includes(city.path));assert.ok(html.includes(data.countries.find(c=>c.id===city.countryId).path));
  const graph=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  assert.equal(graph[0]['@type'],'Article');assert.equal(graph[0].image[0],'https://www.eaglish.store'+data.assets.find(a=>a.assetId===city.hero[0]).variants.at(-1).url);
  assert.doesNotMatch(html,/Flower Dome|新加坡當地日期|鴨子船|singapore-planner/);
 }
 assert.throws(()=>approvedAttractionGallery([data.assets[0],data.assets[0],data.assets[1]]));
 const escaped=structuredClone(data);escaped.cities[0].title='<script>alert(1)</script>：title';const html=renderApprovedCity(escaped,escaped.cities[0].id);assert.doesNotMatch(html,/<script>alert/);assert.match(html,/&lt;script&gt;/);
});
test('hero layout follows original dimensions; media frames do not invent a fixed landscape ratio',()=>{
 for(const [expected,ids] of [['portraits',[0,2,4]],['landscapes',[1,3,5]],['mixed',[0,1,2]]]){
  const copy=structuredClone(data);copy.cities[0].hero=ids.map(i=>copy.assets[i].assetId);const h=renderApprovedCity(copy,copy.cities[0].id);
  assert.ok(h.includes(`data-hero-layout="${expected}"`));assert.match(h,/--hero-ratio:1200\/(800|1800)/);
 }
 const css=readFileSync(new URL('../trip/approved-city-guide.css',import.meta.url),'utf8');assert.match(css,/\.city-approved-cards img\{[^}]*aspect-ratio:3\/2/);assert.match(css,/repeat\(2,minmax\(0,1fr\)\)/);assert.doesNotMatch(css,/contain|blur|linear-gradient/);
});
test('country renderer works with three or one destination without fake extra cities or Thailand text',()=>{
 for(const country of data.countries){const html=renderApprovedCountry(data,country.id);
  assert.equal((html.match(/data-country-panel="/g)||[]).length,country.cityIds.length===1?1:country.cityIds.length+1);assert.ok(html.indexOf('id="faq"')<html.indexOf('id="plan"'));
  assert.match(html,/旅行總覽/);assert.doesNotMatch(html,/曼谷|清邁|清萊|三城|Thailand/);assert.equal((html.match(/<img[^>]*fetchpriority="high"/g)||[]).length,1);
  const graph=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  assert.equal(graph[0]['@type'],'CollectionPage');assert.equal(graph[0].hasPart.length,country.cityIds.length);assert.match(html,/data-approved-country-style data-style-sha256="[a-f0-9]{64}"/);
  for(const id of country.cityIds)assert.ok(html.includes(data.cities.find(c=>c.id===id).path));
 }
});
test('geographic pins and labels target package-owned guide paths; city tabs remain separate',()=>{
 const copy=structuredClone(data);
 for(const country of copy.countries)country.geographicMap={caption:'Synthetic geography',sourceIds:country.sourceIds,views:[{id:'fixture-map',label:'Synthetic map',note:'Synthetic geography only',bounds:[3,50,25,80],points:country.cityIds.map((id,i)=>({cityId:id,label:copy.cities.find(c=>c.id===id).name,point:[5+i*4,52+i*7],sourceIds:country.sourceIds}))}]};
 const single=copy.countries.find(c=>c.cityIds.length===1),html=renderApprovedCountry(copy,single.id);assert.ok(!html.includes(`href="#city-${single.cityIds[0]}"`));assert.match(html,/Natural Earth · 目的地位置示意/);
 const multi=copy.countries.find(c=>c.cityIds.length>1),other=renderApprovedCountry(copy,multi.id);for(const id of multi.cityIds)assert.ok(other.includes(`href="#city-${id}" data-country-city="${id}"`));
 for(const [country,markup] of [[single,html],[multi,other]]){
  const map=markup.match(/<section class="approved-geographic-map[\s\S]*?<\/section>/)?.[0];assert.ok(map);
  assert.doesNotMatch(map,/data-country-city|href="#city-/);
  for(const id of country.cityIds){const path=copy.cities.find(c=>c.id===id).path;assert.ok(map.split(`href="${path}"`).length>=4,'dot, label and text entry share the real guide route');}
 }
 const unsafe=structuredClone(copy);unsafe.countries[0].geographicMap.views[0].points[0].href='https://other.example/';assert.throws(()=>renderApprovedCountry(unsafe,unsafe.countries[0].id),/Invalid map destination/);
 const css=readFileSync(new URL('../trip/country-approved.css',import.meta.url),'utf8');assert.match(css,/\.approved-country \.th-atlas\{align-items:start\}/);
 const lateCss=readFileSync(new URL('../trip/country-explorer.css',import.meta.url),'utf8');assert.match(lateCss,/\.approved-country-body \.th-atlas\{[^}]*align-items:start/,'Late explorer stylesheet must not override top alignment');
 assert.doesNotMatch(other,/viewBox="0 0 560 92"/,'Flight legs must not form three large stacked graphics');
});
test('country route choices are only supported combinations; source-bound reference table is separate',()=>{
 const copy=structuredClone(data),country=copy.countries[0];
 country.referencePlans=[{id:'fixture-reference',title:'Synthetic cross-country reference',calendarDays:2,sourceIds:country.sourceIds,days:[{day:1,kind:'arrival',destination:'Synthetic city',paragraphs:['Synthetic international arrival']},{day:2,kind:'transfer',destination:'Synthetic city → Synthetic city',paragraphs:['Synthetic onward transfer']}]}];
 const html=renderApprovedCountry(copy,country.id);
 assert.match(html,/type="checkbox" hidden checked/);assert.doesNotMatch(html,/<legend>想去的目的地/);
 for(const cityId of country.cityIds)assert.ok(html.includes('各城市行程')&&html.includes(copy.cities.find(c=>c.id===cityId).path+'#plan'));
 assert.match(html,/Synthetic cross-country reference・參考時間表/);assert.match(html,/Synthetic onward transfer/);
 const broken=structuredClone(copy);broken.countries[0].referencePlans[0].days[1].day=3;assert.throws(()=>validateApprovedTravelPackage(broken),/reference timetable day order/);
});
test('country allocator honors explicit multi-day transfers, arrival/departure budgets and exact day accounting',()=>{
 const p=data.countries[0].allocation,ids=data.countries[0].cityIds;
 for(const pace of ['leisure','compact'])for(let days=4;days<=30;days++){
  const plan=allocateApprovedCountryTrip(p,ids,{routeId:p.routes[0].id,days,pace,startDate:'2026-02-01'});
  if(!plan.valid){assert.equal(plan.reason,'insufficient-days');assert.ok(plan.needed>days);continue;}
  assert.equal(plan.timeline.filter(b=>b.kind==='transfer').map(b=>b.count).join(','),'3,2');
  assert.deepEqual(plan.timeline.flatMap(b=>Array.from({length:b.count},(_,i)=>b.start+i)),Array.from({length:days},(_,i)=>i+1));
  assert.equal(plan.timeline[0].count,2);assert.equal(plan.timeline.at(-1).count,1);
 }
 const single=structuredClone(p);single.routes[0].cityIds=[ids[0]];single.routes[0].transferDays=[];
 const s=allocateApprovedCountryTrip(single,ids,{routeId:single.routes[0].id,days:5,pace:'leisure',startDate:'2026-02-01'});assert.equal(s.valid,true);assert.equal(s.transferDays,0);
 const params={routeId:p.routes[0].id,days:20,pace:'leisure',startDate:'2026-02-01'};
 for(const change of [{routeId:'invented'},{days:2},{days:2.5},{pace:'unknown'},{startDate:''},{startDate:'2026-12-25'}])assert.equal(allocateApprovedCountryTrip(p,ids,{...params,...change}).valid,false);
 const malformed=structuredClone(p);malformed.routes[0].transferDays=[1];assert.throws(()=>allocateApprovedCountryTrip(malformed,ids,params));
});
test('city calendar applies only approved local-date rules and reports missing/stale evidence honestly',()=>{
 const p=data.cities[0].planner,args={routeId:p.routes[0].id,index:0};
 assert.equal(approvedCityDay(p,{...args,startDate:'2026-02-01'}).blocked.length,1);
 assert.equal(approvedCityDay(p,{...args,startDate:'2026-02-02'}).blocked.length,1);
 assert.equal(approvedCityDay(p,{...args,startDate:'2026-02-03'}).blocked.length,0);
 assert.equal(approvedCityDay(p,{...args,startDate:'2027-02-01'}).calendarStatus,'outside-reviewed-rules');
 assert.equal(approvedCityDay(p,args).calendarStatus,'date-not-selected');
 assert.equal(approvedCityDay({...p,calendar:[]},{...args,startDate:'2026-02-01'}).calendarStatus,'no-rules-provided');
 assert.equal(addLocalDays('2024-02-28',1),'2024-02-29');assert.throws(()=>addLocalDays('2026-02-29',0));
});
test('R24 seam explicitly returns reconciled projection, source-ratio home frames and six safe static links; live default unchanged',()=>{
 const original=renderTravelHomeR24(),config=JSON.parse(readFileSync(new URL('../trip/data/taiwan-atlas-r24.json',import.meta.url)));
 const added=prepareApprovedR24Discovery(original,data,{catalog:travelHomeCatalog,config});
 assert.equal(added.catalog.countries.length,travelHomeCatalog.countries.length+2);assert.equal(added.catalog.guides.length,travelHomeCatalog.guides.length+4);assert.deepEqual(added.catalog,added.config.catalog);
 assert.equal(added.config.data.places.length,53);assert.equal(added.runtimeIntegrationRequired,false);
 for(const page of [...data.countries,...data.cities])assert.ok(added.html.includes(page.path));
 assert.match(added.html,/data-photo-context="home:approved-fixture-photo/);assert.match(added.html,/--photo-ratio:1200\/1800/);assert.match(added.html,/<noscript><nav aria-label="新增旅行目的地">/);
 for(const country of data.countries){
  const photo=data.assets.find(a=>a.assetId===country.discovery.assetId);
  const card=added.html.match(new RegExp('<article[^>]*data-country-panel="'+country.id+'"[^>]*>[\\s\\S]*?</article>'))?.[0];assert.ok(card);
  if(photo.width*2!==photo.height*3)assert.doesNotMatch(card,/<img data-camera-hero/,'A portrait fixture must not be forced into the camera landscape crop');
 }
 const mismatch=structuredClone(config);mismatch.catalog.countries.pop();assert.throws(()=>prepareApprovedR24Discovery(original,data,{catalog:travelHomeCatalog,config:mismatch}),/Reconcile/);
 assert.throws(()=>prepareApprovedR24Discovery(original.replace('<div id="country-panels">',''),data,{catalog:travelHomeCatalog,config}),/R24 marker/);
 assert.equal(renderTravelHomeR24(),original);assert.doesNotMatch(original,/fixture-country|fixture-city|Synthetic/);
 assert.equal(publicPackageHash(Buffer.from(original)),publicPackageHash(Buffer.from(renderTravelHomeR24())));
});
