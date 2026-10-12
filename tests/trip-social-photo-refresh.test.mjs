import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolveSingaporeNavigation,renderSingaporeNavigationOverview} from '../scripts/trip-singapore-navigation-cards.mjs';
import {renderApprovedCity} from '../scripts/trip-city-approved-adapter.mjs';
import {renderApprovedCountry} from '../scripts/trip-country-approved-adapter.mjs';
import {renderTravelHomeR24} from '../scripts/render-travel-home-r24.mjs';
const root=new URL('../',import.meta.url),read=p=>readFileSync(new URL(p,root)),json=p=>JSON.parse(read(p)),hash=b=>createHash('sha256').update(b).digest('hex');
const eu=json('trip/data/europe-malaysia-approved-travel-v1.json'),sg=json('trip/data/singapore-public-article-v1.json'),publication=json('trip/data/singapore-publication-v1.json');
const approved=[
 ['sg-jewel-grandmother-social-refresh-g1-r1','02b7c72686c3b9646db1c29a4bcb5537e74bc5b167035365935cb7c79af19e78','阿婆在雨漩渦前留影，玻璃屋頂和植栽環繞著瀑布。','阿婆穿著紫色上衣站在星耀樟宜欄杆旁，身後是雨漩渦與玻璃屋頂。'],
 ['eu-tromso-fjellheisen-child-social-refresh-g1-r1','18dc2eeb38ce9eddff93898e252974aac66382fce215fb25cfc5d4b333e859e6','孩子在山坡上，身後就是特羅姆瑟市區與海灣。','孩子穿著米色外套站在山坡上，身後可見特羅姆瑟市區、海灣與橋樑。'],
 ['eu-svalbard-ice-detail-social-refresh-g1-r1','c8f13bb911e0a8b1d257e309a495382069175e9ff24ee92065a81c603f504c06','戴著手套，近看透明冰塊的紋理。','戴著手套的手托著透明冰塊，後方可見窗框與海面。'],
 ['eu-amsterdam-artis-clean-main-social-refresh-g1-r1','4ac7181faab2073d761da74558da9d761aea1e6f8ffe607255e65a42ad728ad2','兩個孩子在 ARTIS 的岩石上停下來玩。','兩個孩子在大型岩石上，一人站著，一人雙手撐著岩面。'],
 ['eu-amsterdam-artis-family-natural-crop-social-refresh-g1-r1','b0447c65bdfb3d11ea989aa6346556434018c96ab281cc96e48541f66d3a5bee','爸爸和孩子在木頭遊具旁合照。','爸爸和兩個孩子在木頭遊具與樹樁旁合照。']
];
const photo=id=>id.startsWith('sg-')?sg.article.sections.flatMap(s=>s.images).find(a=>a.assetId===id):eu.assets.find(a=>a.assetId===id);
test('five accepted outputs retain exact final captions, source hashes and all fifteen production variants',()=>{
 let count=0;for(const[id,sha,caption,alt]of approved){const a=photo(id);assert(a);assert.equal(a.lineage.kind,'photo');assert.equal(a.lineage.sourceSha256,sha);assert.equal(a.caption,caption);assert.equal(a.alt,alt);assert.equal(a.variants.length,3);for(const v of a.variants){const bytes=read(v.url.slice(1));assert.equal(hash(bytes),v.sha256);assert.equal(bytes.length,v.bytes);count++;}}
 assert.equal(count,15);assert.equal(eu.assets.filter(a=>a.assetId.includes('social-refresh-g1')).length,4);assert.equal(publication.assets.filter(a=>a.assetId.includes('social-refresh-g1')).length,1);
 assert(!JSON.stringify(eu).includes('eu-oslo-child-camera-social-refresh-g1-r1'));
});
test('natural family crop remains a repaired existing source, not a native 1440-wide source or extra gallery source',()=>{
 const a=photo(approved[4][0]);assert.equal(a.lineage.sourceWidth,1440);assert.equal(a.lineage.sourceHeight,963);assert.deepEqual(a.lineage.activePicture,{x:0,y:0,width:850,height:963});assert.equal(a.width,1440);assert.equal(a.height,1631);
 const artis=eu.cities.find(c=>c.id==='amsterdam').places.find(p=>p.id==='am-artis');assert.deepEqual(artis.images,[approved[3][0],approved[4][0],'amsterdam-artis-3']);assert.equal(new Set(artis.images.map(id=>eu.assets.find(a=>a.assetId===id).lineage.sourceSha256)).size,3);
});
test('unsafe ARTIS main and hero aliases are absent from every current data consumer and rendered entry',()=>{
 const unsafe=['amsterdam-artis-1','amsterdam-artis-1-hero-g14'];const references=eu.cities.flatMap(c=>[...c.hero,...c.cards.map(c=>c.assetId),...c.places.flatMap(p=>p.images)]).concat(eu.countries.flatMap(c=>[c.image,c.discovery?.assetId]));
 const content=renderTravelHomeR24()+'\n'+eu.cities.map(c=>renderApprovedCity(eu,c.id,{publication:true})).join('\n')+'\n'+eu.countries.map(c=>renderApprovedCountry(eu,c.id,{publication:true})).join('\n');
 // Historical fact/source-rights IDs remain preserved; they are not image
 // consumers and must not be confused with a rendered unsafe source URL.
 for(const id of unsafe){assert(!references.includes(id),id);assert(!eu.assets.some(a=>a.assetId===id),id);assert(!content.includes('/trip/assets/'+id+'-'),id);}
 const am=eu.cities.find(c=>c.id==='amsterdam');assert.equal(am.hero[0],approved[3][0]);assert.equal(am.cards.find(c=>c.target==='am-artis').assetId,approved[3][0]);
});
test('Jewel body is grandmother, hero triptych stays, home and short card share the same independent 3:2 pair',()=>{
 const jewel=sg.article.sections.find(s=>s.id==='jewel');assert.equal(jewel.images[0].assetId,approved[0][0]);assert.deepEqual(sg.article.heroImages.map(a=>a.assetId),['sg-ig-DX_y4WhE3EF-01','sg-ig-DX_y4WhE3EF-02','sg-ig-DX_y4WhE3EF-06']);
 const card=resolveSingaporeNavigation(sg.article,sg.navigationView).cards.find(c=>c.target==='jewel');assert.equal(new Set(card.imagePair.map(a=>a.lineage.sourceSha256)).size,2);const identity=card.imagePair.map(a=>a.assetId).join(' ');
 for(const h of [renderSingaporeNavigationOverview(sg.article,sg.navigationView),renderTravelHomeR24()]){assert(h.includes('data-photo-pair="'+identity+'"'));assert(h.includes('aspect-ratio:3/2'));assert(h.includes('object-fit:cover'));}
});
test('Jewel rejects duplicate sources, cross-venue heroes, missing pairs and swapped primary identity',()=>{
 for(const change of [v=>v.imagePair=[v.assetId,v.assetId],v=>v.imagePair=[v.assetId,'sg-ig-DX_y4WhE3EF-02'],v=>v.imagePair=['unknown',v.assetId],v=>v.imagePair=[v.imagePair[1],v.assetId]]){const d=structuredClone(sg);change(d.navigationView.cards.find(c=>c.target==='jewel'));assert.throws(()=>resolveSingaporeNavigation(d.article,d.navigationView));}
 const d=structuredClone(sg);d.article.sections.find(s=>s.id==='jewel').images[0].lineage.sourceSha256=d.article.heroImages[0].lineage.sourceSha256;assert.throws(()=>resolveSingaporeNavigation(d.article,d.navigationView));
});
test('the full released Malaysia country, both cities and all 99 media records remain byte-equivalent in data',()=>{
 const protectedData={country:eu.countries.find(c=>c.id==='malaysia'),cities:eu.cities.filter(c=>c.countryId==='malaysia'),assets:eu.assets.filter(a=>a.assetId.startsWith('my-'))};assert.equal(hash(JSON.stringify(protectedData)),'4b2cafdb05f0682ba9d078fe6042743ab23879b47a3747c3287d71c7e01a89cd');
});
