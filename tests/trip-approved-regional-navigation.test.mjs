import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {validateApprovedTravelPackage} from '../trip/approved-travel-contract.mjs';
import {renderApprovedCountry} from '../scripts/trip-country-approved-adapter.mjs';
import {syntheticTravelPackage} from './fixtures/travel-approved-package.mjs';
const actual=JSON.parse(readFileSync(new URL('../trip/data/europe-approved-travel-v1.json',import.meta.url)));
const synthetic=await syntheticTravelPackage(mkdtempSync(resolve(tmpdir(),'regional-navigation-fixture-')));
test('Netherlands pins and text entrances distinguish main guide from existing Giethoorn section',()=>{
 const country=actual.countries.find(c=>c.id==='netherlands'),points=country.geographicMap.views.flatMap(v=>v.points);
 const giethoorn=points.find(p=>p.label==='羊角村'),amsterdam=points.find(p=>p.label==='阿姆斯特丹');
 assert.equal(giethoorn.href,'/trip/guides/amsterdam-with-kids/#am-giethoorn');
 assert.equal(giethoorn.cityId,'amsterdam');assert.equal(amsterdam.href,undefined);
 const html=renderApprovedCountry(actual,'netherlands');
 assert.ok(html.includes('href="'+giethoorn.href+'" aria-label="探索羊角村"'));
 assert.ok(html.includes('href="'+giethoorn.href+'">羊角村</a>'));
 assert.ok(html.includes('href="/trip/guides/amsterdam-with-kids/" aria-label="探索阿姆斯特丹"'));
 assert.ok(actual.cities.find(c=>c.id==='amsterdam').places.some(p=>p.id==='am-giethoorn'));
 assert.equal(actual.countries.length,2);assert.equal(actual.cities.length,4);
});
test('regional experience badges use explicit locality without changing catalog city grouping',()=>{
 const city=actual.cities.find(c=>c.id==='amsterdam'),html=renderApprovedCountry(actual,'netherlands');
 for(const [id,locality] of [['am-giethoorn','羊角村'],['am-pancake','Zeewolde']]){
  const p=city.places.find(p=>p.id===id);assert.equal(p.locality,locality);
  const card=html.slice(html.indexOf('class="th-place" href="'+city.path+'#'+id+'"')).split('</a>')[0];
  assert.ok(card.includes('data-country-place-city="amsterdam"'));
  assert.ok(card.includes('<span>'+locality+'</span>'));assert.ok(!card.includes('<span>阿姆斯特丹</span>'));
 }
 const main=html.slice(html.indexOf('class="th-place" href="'+city.path+'#am-artis"')).split('</a>')[0];
 assert.ok(main.includes('<span>阿姆斯特丹</span>'));
});
test('locality metadata is optional, shared across countries and HTML-escaped',()=>{
 const copy=structuredClone(synthetic),city=copy.cities[0],place=city.places.find(p=>p.id===city.cards[0].target);
 place.locality='Near & far <island>';assert.doesNotThrow(()=>validateApprovedTravelPackage(copy));
 const html=renderApprovedCountry(copy,city.countryId);assert.ok(html.includes('<span>Near &amp; far &lt;island&gt;</span>'));
 place.locality='';assert.throws(()=>validateApprovedTravelPackage(copy),/non-empty text/);
 place.locality=42;assert.throws(()=>validateApprovedTravelPackage(copy),/non-empty text/);
 delete place.locality;assert.doesNotThrow(()=>validateApprovedTravelPackage(copy));
});
test('optional map article anchors must resolve in their grouped guide, not a missing section or other city',()=>{
 const copy=structuredClone(actual),p=copy.countries.find(c=>c.id==='netherlands').geographicMap.views[0].points[1];
 for(const href of ['/trip/guides/amsterdam-with-kids/#missing-place','/trip/guides/oslo-with-kids/#am-giethoorn']){
  p.href=href;assert.throws(()=>validateApprovedTravelPackage(copy),/map article target/);
 }
 p.href='/trip/guides/amsterdam-with-kids/#am-giethoorn';assert.doesNotThrow(()=>validateApprovedTravelPackage(copy));
});
