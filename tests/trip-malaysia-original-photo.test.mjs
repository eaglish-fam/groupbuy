import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateApprovedTravelPackage} from '../trip/approved-travel-contract.mjs';
import {approvedPicture,renderApprovedCity} from '../scripts/trip-city-approved-adapter.mjs';
import {countryPicture,renderApprovedCountryBody} from '../scripts/trip-approved-country-body.mjs';
import {cityGuideHeroLayout} from '../scripts/trip-city-guide-template.mjs';
import {renderApprovedPhotoPair} from '../trip/approved-photo-pair.mjs';
import {renderTravelHomeR24} from '../scripts/render-travel-home-r24.mjs';
const root=new URL('../',import.meta.url),data=JSON.parse(readFileSync(new URL('trip/data/europe-malaysia-approved-travel-v1.json',root),'utf8')),kl=data.cities.find(c=>c.id==='kuala-lumpur');
const ids=['my-kl-old-city-family-social-g5-r1','my-kl-rexkl-children-social-g5-r1','my-kl-rexkl-father-social-g5-r1','my-kl-rexkl-mother-social-g5-r1','my-kl-kwai-chai-hong-family-social-g5-r1','my-kl-old-city-exterior-social-g5-r1'];
const asset=id=>data.assets.find(a=>a.assetId===id),sha=b=>createHash('sha256').update(b).digest('hex');
test('KL stills are actual photo lineages linked to the approved first-party carousel and used gallery slots',()=>{
 validateApprovedTravelPackage(data);const used=new Set(kl.places.flatMap(p=>p.images));
 for(const id of ids){const a=asset(id);assert.equal(a.lineage.kind,'photo');assert.ok(a.width<a.height);assert.ok(used.has(id),'An unused registry entry is not adopted photography');assert.ok(!Object.hasOwn(a.lineage,'pts'));for(const sid of a.sourceIds){const s=data.sources.find(s=>s.id===sid);assert.equal(s.kind,'photo');assert.equal(s.url,'https://www.instagram.com/eaglish.fam/p/DcTad4HkwMw/');assert.match(s.locator,/carousel slide \d+ of 20/);}}
 const html=renderApprovedCity(data,'kuala-lumpur');for(const id of ids)assert.ok(html.includes(asset(id).variants[1].url),'Actual renderer does not reference '+id);
});
test('approved KL portrait hero and Penang mixed hero preserve their separately reviewed compositions',()=>{
 assert.deepEqual(kl.hero,[ids[0],ids[2],ids[4]]);assert.equal(cityGuideHeroLayout(kl.hero.map(asset)).mode,'portraits');const html=renderApprovedCity(data,'kuala-lumpur');assert.match(html,/data-hero-layout="portraits"/);for(const id of kl.hero)assert.ok(html.includes('--hero-ratio:'+asset(id).width+'/'+asset(id).height));
 const penang=data.cities.find(c=>c.id==='penang'),main='my-penang-george-town-bicycle-social-g5-r1-card';assert.deepEqual(penang.hero,[main,'my-penang-coast-parents-social-g5-r1','my-penang-george-town-street-social-g5-r1']);assert.equal(cityGuideHeroLayout(penang.hero.map(asset)).mode,'mixed');assert.equal(data.countries.find(c=>c.id==='malaysia').image,main);assert.equal(data.countries.find(c=>c.id==='malaysia').discovery.assetId,main);
 const country=renderApprovedCountryBody(data,'malaysia');assert.ok(country.includes('data-asset-id="'+ids[0]+'"'));assert.ok(country.includes('data-asset-id="'+main+'"'));assert.ok(country.includes('data-photo-pair="'+kl.entryImagePair.join(' ')+'"'));
});
test('approved independent photo pairs keep KL short cards and city entrances in the same 3:2 family',()=>{
 const city=renderApprovedCity(data,'kuala-lumpur'),country=renderApprovedCountryBody(data,'malaysia'),home=renderTravelHomeR24();
 for(const target of ['my-kl-sultan-abdul-samad','my-kl-rexkl-bookxcess']){const c=kl.cards.find(c=>c.target===target);assert.equal(c.imagePair.length,2);assert.equal(c.imagePair[0],c.assetId);assert.ok(c.imagePair.every(id=>kl.places.find(p=>p.id===target).images.includes(id)));const pair=renderApprovedPhotoPair(c.imagePair.map(asset));assert.match(pair,/aspect-ratio:3\/2/);assert.match(pair,/height:100%;aspect-ratio:auto;object-fit:cover/);assert.doesNotMatch(pair,/object-fit:contain/);for(const html of [city,country])assert.ok(html.includes('data-photo-pair="'+c.imagePair.join(' ')+'"'));}
 assert.ok(home.includes('data-photo-pair="'+kl.entryImagePair.join(' ')+'"'));const config=JSON.parse(home.match(/<script\b(?=[^>]*\bid="atlas-config")[^>]*>([\s\S]*?)<\/script>/)[1]);assert.deepEqual(config.catalog.guides.find(g=>g.id==='kuala-lumpur').approvedPhotoPair.map(a=>a.assetId),kl.entryImagePair);
 const normal=asset('my-kl-tower-1-g3-v3');assert.ok(!approvedPicture(normal,{card:true}).includes('data-photo-fit="source"'));assert.ok(!countryPicture(normal,{card:true}).includes('data-photo-fit="source"'));
});
test('nine distinct originals and one reviewed derivative keep exact thirty public variants and exclude unapproved transport/cafe photos',()=>{
 const stills=data.assets.filter(a=>a.assetId.includes('social-g5-r1'));assert.equal(stills.length,10);assert.equal(new Set(stills.map(a=>a.lineage.sourceSha256)).size,9);
 let count=0;for(const a of stills)for(const v of a.variants){const b=readFileSync(new URL(v.url.slice(1),root));assert.equal(sha(b),v.sha256);assert.equal(b.length,v.bytes);count++;}assert.equal(count,30);
 assert.ok(!data.assets.some(a=>a.assetId==='my-kl-pasar-seni-family-social-g5-r1'||a.assetId==='my-kl-rapidkl-children-social-g5-r1'));assert.ok(!data.sources.some(s=>s.id==='my-ig-djt0fkttw4u-slide-2'));for(const p of data.cities.filter(c=>c.countryId==='malaysia').flatMap(c=>c.places)){assert.equal(p.images.length,3);assert.equal(new Set(p.images).size,3);}assert.ok(!JSON.stringify(data).includes('/Users/'));
 const native=asset('my-penang-george-town-bicycle-social-g5-r1'),card=asset('my-penang-george-town-bicycle-social-g5-r1-card');assert.equal(native.lineage.sourceSha256,card.lineage.sourceSha256);assert.equal(card.width/card.height,1.5);assert.deepEqual(card.lineage.activePicture,{x:0,y:540,width:1440,height:960});assert.ok(renderTravelHomeR24().includes(card.variants[1].url));
});
test('photo pairs fail closed on duplicate sources, wrong venue or unapproved portrait identity',()=>{
 assert.throws(()=>renderApprovedPhotoPair([asset(ids[0]),asset(ids[0])]));assert.throws(()=>renderApprovedPhotoPair([asset(ids[0]),asset('my-kl-tower-1-g3-v3')]));
 for(const change of [c=>c.cards.find(c=>c.imagePair).imagePair=[ids[0],ids[2]],c=>c.entryImagePair=[ids[2],ids[1]]]){const d=structuredClone(data);change(d.cities.find(c=>c.id==='kuala-lumpur'));assert.throws(()=>validateApprovedTravelPackage(d));}
});
