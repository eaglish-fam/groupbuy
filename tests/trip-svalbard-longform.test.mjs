import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,writeFileSync,mkdtempSync,mkdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {validateApprovedTravelPackage,validateCityIntro,publicDiagramUrl} from '../trip/approved-travel-contract.mjs';
import {renderApprovedCity} from '../scripts/trip-city-approved-adapter.mjs';
import {readApprovedTravelPackage,publicPackageHash} from '../scripts/trip-approved-public-package.mjs';
import {syntheticTravelPackage,writeSyntheticPackage} from './fixtures/travel-approved-package.mjs';
const data=JSON.parse(readFileSync(new URL('../trip/data/europe-approved-travel-v1.json',import.meta.url)));
const city=data.cities.find(c=>c.id==='svalbard'),diagram=city.arrival.diagram;
test('longform context is an explicit opt-in; default city leads still require exactly two',()=>{
 assert.equal(validateCityIntro(city.intro,city.leadFormat).length,3);
 for(const count of [0,1,3,4])assert.throws(()=>validateCityIntro(Array(count).fill('Context')),/two approved leads/);
 for(const count of [0,1,2,5])assert.throws(()=>validateCityIntro(Array(count).fill('Context'),'longform-context/v1'),/longform context/);
 assert.throws(()=>validateCityIntro(['A','B','C'],'unknown'),/longform context/);
 assert.equal(validateCityIntro(['A','B']).length,2);
 assert.ok(data.cities.filter(c=>c.id!=='svalbard').every(c=>c.intro.length===2&&c.leadFormat===undefined));
});
test('Svalbard has sourced history, authentic actions, seed mechanism and actual Radisson base',()=>{
 const h=renderApprovedCity(data,'svalbard');
 for(const text of ['1920年','1925年','挪威法律','一位機長','雪鞋已經太小','ICARDA','2015年','負18°C','寄存機構','手上拿著剛從海裡撈起的冰塊','Radisson Blu Polar Hotel, Spitsbergen','Mary Ann’s'])assert.ok(h.includes(text),text);
 assert.doesNotMatch(h,/聯合國託管|我們住在Mary Ann/);
 assert.ok(h.indexOf('id="faq"')<h.indexOf('id="plan"')&&h.indexOf('id="plan"')<h.indexOf('id="videos"'));
 assert.equal((h.match(/<figure data-hero-slot=/g)||[]).length,3);
});
test('one arrival illustration is distinct from unchanged three-photo attraction galleries',()=>{
 const h=renderApprovedCity(data,'svalbard'),view=validateApprovedTravelPackage(data);
 assert.equal(view.diagrams.size,1);assert.equal((h.match(/data-route-diagram=/g)||[]).length,1);
 assert.ok(city.places.every(p=>p.images.length===3&&new Set(p.images).size===3));
 assert.deepEqual(city.arrival.images,['svalbard-airport-bus']);
 assert.equal(data.assets.some(a=>a.assetId===diagram.id),false);
 assert.ok(h.indexOf('data-route-diagram=')>h.indexOf('id="arrival"'));
 for(const id of city.stay.images)assert.ok(h.includes(`data-asset-id="${id}"`));
});
test('arrival adopts dated examples, timezone, stopover wording and exact accessible description',()=>{
 const h=renderApprovedCity(data,'svalbard');
 for(const text of [diagram.alt,diagram.caption,'2026.10.05','2026/10/06','SK4496：16:05–19:00','10:00奧斯陸→11:50特羅姆瑟','12:30續飛→14:10長年鎮','Europe/Oslo','UTC+02','約1小時50分鐘','約1小時40分鐘'])assert.ok(h.includes(text),text);
 assert.match(h,/<time datetime="2026-10-05">/);
 assert.doesNotMatch(h,/班號來自目前班表示例，並非本家當年實搭證明|同機保證|必須換機|依實際班次安排/);
 assert.ok(h.includes('https://www.sas.no/flyreiser/oslo/longyearbyen')&&h.includes('https://www.avinor.no/en/airport/Svalbard/flight-times/'));
 assert.equal((h.match(/<img[^>]*fetchpriority="high"/g)||[]).length,1);
});
test('route diagram rejects private paths, traversal, remote SVGs, malformed provenance and route payload',()=>{
 for(const url of ['https://example.org/x.svg','/trip/assets/../x.svg','/trip/assets/%2e.svg','/Users/private/x.svg','/trip/assets/x.svg?token=a','/trip/assets/x.webp'])assert.throws(()=>publicDiagramUrl(url));
 const changes=[d=>d.url='javascript:alert(1)',d=>d.kind='photo',d=>d.bytes=65537,d=>d.sha256='unknown',d=>d.checkedOn='2026-02-30',d=>d.alt='',d=>d.sourceIds=['unknown'],d=>d.sourceIds=[city.videoSourceIds[0]],d=>d.routes.push(d.routes[0]),d=>d.routes[1].id=d.routes[0].id];
 for(const change of changes){const c=structuredClone(data);change(c.cities.find(c=>c.id==='svalbard').arrival.diagram);assert.throws(()=>validateApprovedTravelPackage(c));}
});
test('illustration is self-contained, accepted bytes, and never creates a missing-glyph raster dependency',()=>{
 const svg=readFileSync(new URL('../trip/assets/svalbard-sas-routes-g15-v1.svg',import.meta.url));
 assert.equal(publicPackageHash(svg),'70efea11942df21435609690de913f0dbce3e9c4b9872928736b4abadbee86bc');
 assert.equal(svg.length,diagram.bytes);assert.match(svg.toString(),/font-family="Songti TC, PMingLiU, serif"/);
 assert.equal((svg.toString().match(/marker-end=/g)||[]).length,3);
 assert.doesNotMatch(svg.toString(),/<script|foreignObject|<image|<style/);
});
test('portable build verifies diagram byte closure and refuses changed bytes or executable SVG',async()=>{
 const root=mkdtempSync(resolve(tmpdir(),'route-diagram-closure-')),fixture=await syntheticTravelPackage(root);
 fixture.cities[0].arrival.diagram={...structuredClone(diagram),sourceIds:[fixture.sources.find(s=>s.kind==='official').id]};
 const path=resolve(root,diagram.url.slice(1)),svg=readFileSync(new URL('../trip/assets/svalbard-sas-routes-g15-v1.svg',import.meta.url));
 mkdirSync(resolve(path,'..'),{recursive:true});writeFileSync(path,svg);
 let frozen=writeSyntheticPackage(root,fixture),view=await readApprovedTravelPackage(root,frozen);
 assert.equal(view.verifiedVariants,18);assert.equal(view.verifiedDiagrams,1);
 writeFileSync(path,Buffer.concat([svg,Buffer.from('changed')]));
 await assert.rejects(readApprovedTravelPackage(root,frozen),/diagram byte closure/);
 const unsafe=Buffer.from(svg.toString().replace('</svg>','<script>alert(1)</script></svg>'));
 Object.assign(fixture.cities[0].arrival.diagram,{bytes:unsafe.length,sha256:publicPackageHash(unsafe)});
 frozen=writeSyntheticPackage(root,fixture);writeFileSync(path,unsafe);
 await assert.rejects(readApprovedTravelPackage(root,frozen),/Unsafe or malformed/);
});
