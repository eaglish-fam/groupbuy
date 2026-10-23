import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateApprovedTravelPackage} from '../trip/approved-travel-contract.mjs';
import {readApprovedTravelPackage} from '../scripts/trip-approved-public-package.mjs';
import {renderApprovedCity} from '../scripts/trip-city-approved-adapter.mjs';
import {renderApprovedCountry} from '../scripts/trip-country-approved-adapter.mjs';
import {renderTravelHomeR24} from '../scripts/render-travel-home-r24.mjs';
import {decodeHtml} from '../scripts/site-seo-inventory.mjs';
import {wrapRouteText} from '../scripts/trip-route-diagram.mjs';
const root=new URL('../',import.meta.url),read=p=>readFileSync(new URL(p,root),'utf8'),data=JSON.parse(read('trip/data/europe-malaysia-approved-travel-v1.json')),europe=JSON.parse(read('trip/data/europe-approved-travel-v1.json'));
const cityIds=['penang','kuala-lumpur'],cities=data.cities.filter(c=>cityIds.includes(c.id));
test('final portable closure preserves Malaysia and only the approved Europe photo substitutions',async()=>{
 const registration=JSON.parse(read('trip/data/approved-travel-registration-v1.json')).packages.find(p=>p.dataPath==='trip/data/europe-malaysia-approved-travel-v1.json');
 const view=await readApprovedTravelPackage(root.pathname,registration);assert.equal(view.countries.size,3);assert.equal(view.cities.size,6);assert.equal(view.diagrams.size,7);
 const expected=structuredClone(europe),replacements=new Map([
  ['tromso-fjellheisen-2','eu-tromso-fjellheisen-child-social-refresh-g1-r1'],['svalbard-glacier-cruise-3','eu-svalbard-ice-detail-social-refresh-g1-r1'],
  ['amsterdam-artis-1','eu-amsterdam-artis-clean-main-social-refresh-g1-r1'],['amsterdam-artis-2','eu-amsterdam-artis-family-natural-crop-social-refresh-g1-r1'],['amsterdam-artis-1-hero-g14','eu-amsterdam-artis-clean-main-social-refresh-g1-r1'],['hans-grietje-1','hans-grietje-clean-tower-g2-r1']
 ]);
 for(const c of expected.countries){c.image=replacements.get(c.image)||c.image;if(c.discovery)c.discovery.assetId=replacements.get(c.discovery.assetId)||c.discovery.assetId;}
 for(const c of expected.cities){c.hero=c.hero.map(id=>replacements.get(id)||id);for(const p of c.places)p.images=p.images.map(id=>replacements.get(id)||id);for(const card of c.cards)if(replacements.has(card.assetId)){card.assetId=replacements.get(card.assetId);card.focalPoint=card.assetId==='hans-grietje-clean-tower-g2-r1'?[50,45]:[50,50];}}
 assert.deepEqual(data.countries.filter(c=>c.id!=='malaysia'),expected.countries);assert.deepEqual(data.cities.filter(c=>!cityIds.includes(c.id)),expected.cities);
 assert.deepEqual(data.assets.filter(a=>europe.assets.some(b=>a.assetId===b.assetId)),europe.assets.filter(a=>!replacements.has(a.assetId)).map(a=>a.assetId==='amsterdam-artis-3'?{...a,alt:'園內動物聚在岩石與繩索旁。'}:a));
 assert.equal(cities.flatMap(c=>c.places).length,23);assert.equal(cities.flatMap(c=>c.chapters).length,11);assert.equal(cities.flatMap(c=>c.cards).length,11);
 const assets=data.assets.filter(a=>a.assetId.startsWith('my-'));assert.equal(assets.length,99);assert.equal(assets.filter(a=>a.cardPhoto).length,10);assert.equal(assets.filter(a=>a.lineage.kind==='photo').length,10);
});
test('chapter guides preserve full source paragraphs, three-photo galleries, six facts and distinct food trips',()=>{
 for(const c of cities){const html=renderApprovedCity(data,c.id,{publication:true});
  assert.equal(c.intro.length,3);for(const p of c.intro)assert.ok(html.includes(p));
  assert.equal((html.match(/class="city-editorial-chapter"/g)||[]).length,c.chapters.length);
  for(const ch of c.chapters)assert.ok(html.includes(`<h2>${ch.title}</h2>`));
  for(const p of c.places){assert.ok(html.includes(`id="${p.id}" class="city-editorial-place"`));for(const text of [...p.paragraphs,...p.story.paragraphs,...Object.values(p.facts).map(f=>f.value)])assert.ok(decodeHtml(html).includes(text),p.id+' '+text);}
  assert.equal((html.match(/class="city-attraction-gallery"/g)||[]).length,c.places.length);assert.equal((html.match(/<h4>實用資料<\/h4>/g)||[]).length,c.places.length);
  for(const s of c.food.subsections){assert.ok(html.includes(`<h3>${s.title}</h3>`));for(const p of s.paragraphs)assert.ok(html.includes(p));assert.ok(s.images.length>=1&&s.images.length<=3);}
  assert.ok(html.indexOf('<section id="faq"')<html.indexOf('<section id="plan"'));assert.ok(html.indexOf('<section id="plan"')<html.indexOf('<section id="videos"'));
  assert.match(html,/approved-editorial-navigation\.mjs/);assert.match(html,/data-reading-nav-instant/);assert.match(html,/href="#plan" aria-label="行程規劃"/);
  const body=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');assert.doesNotMatch(body,/工程檢查|工程接線|dry-run|final-g4|內部診斷/);
 }
});
test('optional chapters reject missing, duplicate or conflicting place and chapter anchors',()=>{
 for(const change of [c=>c.chapters[0].placeIds.push(c.chapters[0].placeIds[0]),c=>c.chapters[0].placeIds=['unknown'],c=>c.chapters.pop(),c=>c.chapters[0].id=c.places[0].id,c=>c.chapters[0].id='food',c=>c.food.subsections[0].subsections=[c.food.subsections[1]]]){const d=structuredClone(data);change(d.cities.find(c=>c.id==='penang'));assert.throws(()=>validateApprovedTravelPackage(d));}
});
test('country and city diagrams answer separate questions with bounded intrinsic widths; seventeen legs remain archived',()=>{
 const country=data.countries.find(c=>c.id==='malaysia'),html=renderApprovedCountry(data,country.id,{publication:true});
 assert.equal(country.intro.length,3);for(const p of country.intro)assert.ok(html.includes(p));
 assert.deepEqual(country.transport.diagrams.map(d=>d.id),['my-country-ets-ferry','my-country-domestic-flight']);
 for(const c of cities){const h=renderApprovedCity(data,c.id);assert.equal(c.arrival.diagrams.length,2);for(const d of c.arrival.diagrams){assert.equal(d.width,320);assert.ok(d.height<800);assert.ok(h.includes(d.url));assert.ok(!html.includes(d.url));}}
 assert.equal(JSON.parse(read('trip/data/malaysia-engineering-transport-v1.json')).diagram.transportLegs.length,17);
 assert.doesNotMatch(html,/malaysia-engineering-transport-g3\.svg|工程接線/);assert.match(html,/走進檳城/);assert.match(html,/走進吉隆坡/);
 assert.match(read('trip/approved-editorial-chapters.css'),/width: min\(100%,320px\)/);
});
test('world discovery shares the existing entry family, real Malaysia geography and matching city targets',()=>{
 const home=renderTravelHomeR24();assert.match(home,/data-country-panel="malaysia"/);assert.match(home,/走進馬來西亞/);
 for(const c of cities){assert.ok(home.includes(c.path));for(const card of c.cards){const p=c.places.find(p=>p.id===card.target);assert.ok(p.images.includes(card.assetId));const a=data.assets.find(a=>a.assetId===card.assetId);assert.ok(card.imagePair||a.cardPhoto);if(card.imagePair){assert.equal(card.imagePair.length,2);assert.ok(card.imagePair.every(id=>p.images.includes(id)));}else assert.equal(a.cardPhoto.width/a.cardPhoto.height,1.5);}}
 const country=data.countries.find(c=>c.id==='malaysia');assert.equal(country.discovery.isoNumeric,'458');assert.equal(country.geographicMap.views.length,2);
 assert.deepEqual(country.geographicMap.views.flatMap(v=>v.points).map(p=>p.cityId),['penang','kuala-lumpur','penang','kuala-lumpur']);
});
test('all public Malaysia Han text is covered by the existing complete font without new loaders or SW namespaces',()=>{
 const ranges=JSON.parse(read('assets/fonts/complete-site-font-v1.json')).ranges;
 const texts=[renderApprovedCountry(data,'malaysia'),...cities.map(c=>renderApprovedCity(data,c.id))].map(h=>decodeHtml(h.replace(/<style\b[^>]*>[\s\S]*?<\/style>/g,'').replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'').replace(/<[^>]*>/g,'')));
 for(const text of texts)for(const char of text)if(/\p{Script=Han}/u.test(char))assert.ok(ranges.some(([a,z])=>char.codePointAt(0)>=a&&char.codePointAt(0)<=z),'Missing Han '+char);
 assert.match(read('site-font-loader.js'),/heading-serif-complete-500-v1/);assert.match(read('site-font-loader.js'),/dataset\.fontEntry/);assert.doesNotMatch(read('trip/approved-editorial-chapters.css'),/@font-face|fonts\.google/);
});
test('reader-facing corrections keep whole English station words, one diagram heading and named video links',()=>{
 assert.deepEqual(wrapRouteText('步行 → Penang Sentral 渡輪碼頭',15),['步行 →','Penang Sentral','渡輪碼頭']);
 assert.ok(wrapRouteText('ETS → Butterworth 北海',15).some(s=>s.includes('Butterworth')));
 for(const c of cities){const h=renderApprovedCity(data,c.id),videos=h.slice(h.indexOf('<section id="videos"'));assert.doesNotMatch(videos,/>my-youtube-/);for(const id of c.videoSourceIds)assert.ok(data.sources.find(s=>s.id===id).label);}
 for(const d of data.countries.find(c=>c.id==='malaysia').transport.diagrams.concat(cities.flatMap(c=>c.arrival.diagrams))){const svg=read(d.url.slice(1));assert.equal((svg.match(/font-size="20"/g)||[]).length,0,'Single route should not repeat figure title');}
 const css=read('trip/approved-editorial-chapters.css');assert.match(css,/\.approved-chapter-guide \.toc \{ top: calc/);assert.match(css,/#plan > h2:focus:not\(:focus-visible\) \{ outline: none/);
});
test('normal build emits a travel index bound to final normalized HTML rather than intermediate renderer bytes',()=>{
 const index=JSON.parse(read('trip/data/approved-travel-content-index-v1.json')),reg=JSON.parse(read('trip/data/approved-travel-registration-v1.json'));
 assert.deepEqual(index.packages,reg.packages.map(p=>({dataPath:p.dataPath,packageSha256:p.expectedSha256,publication:p.publication})));
 // Europe/Malaysia keeps its nine pages; Japan has its country page and two city guides (the route is indexed separately);
 // Thailand has its country page and three city guides; Singapore and Cebu/Bohol are one guide each (no separate country page);
 // New Zealand has its country page and eight regional guides.
 assert.deepEqual(reg.packages.map(p=>index.pages.filter(page=>page.packageSha256===p.expectedSha256).length),[9,3,4,1,1,9]);
 for(const p of index.pages)assert.equal(p.sha256,createHash('sha256').update(readFileSync(new URL(p.path.slice(1)+'index.html',root))).digest('hex'),p.path);
});
