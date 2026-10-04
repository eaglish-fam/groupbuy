import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderCountryEntry,renderTravelEntryActions} from '../scripts/trip-travel-entry.mjs';
import {renderTravelHomeR24} from '../scripts/render-travel-home-r24.mjs';
import {renderApprovedCountry} from '../scripts/trip-country-approved-adapter.mjs';
import {renderApprovedCity} from '../scripts/trip-city-approved-adapter.mjs';
const data=JSON.parse(readFileSync(new URL('../trip/data/europe-approved-travel-v1.json',import.meta.url)));
test('same escaped entry helper retains two real actions and exact guide count',()=>{
 const country={id:'fixture',name:'Name & place',href:'/trip/fixture/',summary:'<example>',guideIds:['one','two']};
 const h=renderCountryEntry(country,{photoHtml:'<img src="/trip/assets/fixture.webp">',regionLabel:'Region',hidden:true});
 assert.match(h,/Region · 2 份指南/);assert.match(h,/Name &amp; place/);assert.match(h,/&lt;example&gt;/);
 assert.match(h,/class="home-panel-primary travel-entry-primary" href="\/trip\/fixture\/"/);
 assert.match(h,/class="home-panel-secondary travel-entry-secondary" href="#guides" data-explore-country="fixture"/);
 assert.throws(()=>renderTravelEntryActions({href:'javascript:bad',label:'bad'},{href:'#guides',label:'safe'}));
 assert.throws(()=>renderTravelEntryActions({href:'/trip/fixture/',label:'bad',data:{onclick:'bad'}},{href:'#guides',label:'safe'}));
});
test('actual R24 NZ and approved Europe countries use one country entry and CTA family',()=>{
 const h=renderTravelHomeR24();
 const css=readFileSync(new URL('../trip/travel-entry.css',import.meta.url),'utf8');
 assert.match(css,/\.travel-home \.travel-country-entry \.home-panel-photo\{aspect-ratio:3\/2\}/);
 assert.match(css,/\.travel-home \.travel-country-entry \.home-panel-photo>img\{width:100%;height:100%;object-fit:cover;/);
 assert.doesNotMatch(css,/:has\(>img\[data-camera-hero\]\)/,'Shared cover geometry cannot depend on Europe-only metadata');
 for(const id of ['new-zealand','norway','netherlands']){
  const card=h.match(new RegExp('<article[^>]*data-country-panel="'+id+'"[^>]*>[\\s\\S]*?</article>'))?.[0];
  assert.ok(card,id);assert.match(card,/travel-country-entry/);assert.match(card,/home-panel-actions travel-entry-actions/);
  assert.match(card,/travel-entry-primary/);assert.match(card,/travel-entry-secondary/);
 }
 assert.match(h,/data-site-style="\/trip\/travel-entry.css"/);
});
test('country city CTA shares world entry style; Netherlands does not invent extra city tabs',()=>{
 const norway=renderApprovedCountry(data,'norway'),nl=renderApprovedCountry(data,'netherlands');
 assert.equal((norway.match(/class="th-panel-actions travel-entry-actions"/g)||[]).length,3);
 assert.equal((nl.match(/class="th-panel-actions travel-entry-actions"/g)||[]).length,1);
 assert.match(nl,/看阿姆斯特丹攻略/);assert.doesNotMatch(nl,/class="th-tabs"/);
 assert.match(norway,/class="home-panel-primary travel-entry-primary" href="\/trip\/guides\/oslo-with-kids\/"/);
 assert.match(norway,/data-country-explore-city="oslo"/);
});
test('six approved entry slots share clean camera-first 3:2 images and matching metadata',()=>{
 const home=renderTravelHomeR24();
 for(const country of data.countries){
  assert.equal(country.image,country.discovery.assetId);
  const lead=data.assets.find(a=>a.assetId===country.image),markup=renderApprovedCountry(data,country.id);
  assert.equal(lead.width*2,lead.height*3);assert.equal(lead.lineage.kind,'photo');
  const card=home.match(new RegExp('<article[^>]*data-country-panel="'+country.id+'"[^>]*>[\\s\\S]*?</article>'))?.[0];assert.ok(card);
  assert.match(card,/<img data-camera-hero/);assert.ok(card.includes(lead.variants.at(-1).url));
  assert.ok(markup.includes('property="og:image" content="https://www.eaglish.store'+lead.variants.at(-1).url+'"'));
  assert.ok(country.cityIds.some(id=>data.cities.find(c=>c.id===id).hero[0]===lead.assetId));
 }
 for(const city of data.cities){
  const lead=data.assets.find(a=>a.assetId===city.hero[0]);
  assert.equal(lead.width*2,lead.height*3);assert.equal(lead.lineage.kind,'photo');
  assert.match(lead.assetId,/-hero-g14$/);
  const original=data.assets.find(a=>a.assetId===lead.assetId.replace(/-hero-g14$/,''));
  assert.equal(lead.lineage.sourceSha256,original.lineage.sourceSha256);
  const markup=renderApprovedCity(data,city.id);
  assert.ok(markup.includes('property="og:image" content="https://www.eaglish.store'+lead.variants.at(-1).url+'"'));
  assert.ok(markup.includes('data-hero-slot="main"'));assert.ok(markup.includes(lead.caption));
 }
});
