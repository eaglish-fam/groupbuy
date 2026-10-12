import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateApprovedTravelPackage} from '../trip/approved-travel-contract.mjs';
import {renderApprovedCity} from '../scripts/trip-city-approved-adapter.mjs';
import {renderApprovedCountry} from '../scripts/trip-country-approved-adapter.mjs';
import {renderTravelHomeR24} from '../scripts/render-travel-home-r24.mjs';
const root=new URL('../',import.meta.url),read=p=>readFileSync(new URL(p,root)),hash=b=>createHash('sha256').update(b).digest('hex'),data=JSON.parse(read('trip/data/europe-malaysia-approved-travel-v1.json')),asset=data.assets.find(a=>a.assetId==='hans-grietje-clean-tower-g2-r1');
test('Jewel fullbleed override is exactly scoped and all pre-existing CSS including card/hero rules stays intact',()=>{
 const css=read('trip/singapore.css').toString(),rule='.sg-guide #jewel .sg-attraction-gallery .sg-gallery-lead figure[data-portrait]{max-width:none;justify-self:stretch}\n';assert.equal(css.split(rule).length,2);assert.equal(hash(css.replace(rule,'')),'6f73f1d7affcf8c4eead7a6831a798699fdf97ae0fe5012e42bb49f60626446c');assert.match(css,/img\{width:100%;height:auto;aspect-ratio:var\(--photo-ratio\)/);
});
test('ARTIS adjacent animal alt describes only visible content; original caption and all original media bytes stay',()=>{
 const a=data.assets.find(a=>a.assetId==='amsterdam-artis-3');assert.equal(a.alt,'園內動物聚在岩石與繩索旁。');assert.equal(a.caption,'遇到有興趣的動物，就多看一會兒。');for(const v of a.variants)assert.equal(hash(read(v.url.slice(1))),v.sha256);const html=renderApprovedCity(data,'amsterdam');assert(html.includes('alt="'+a.alt+'"'));assert(!html.includes('alt="ARTIS 園內的大猩猩"'));
});
test('one clean tower frame supplies exact 16:9 body and 3:2 card, not two photographs or invented native detail',()=>{
 validateApprovedTravelPackage(data);assert.equal(asset.lineage.kind,'video-frame');assert.equal(asset.lineage.pts,884550);assert.equal(asset.width/asset.height,16/9);assert.equal(asset.cardPhoto.width/asset.cardPhoto.height,3/2);assert.deepEqual(asset.lineage.activePicture,{x:400,y:0,width:960,height:540});assert.deepEqual(asset.cardPhoto.activePicture,{x:550,y:0,width:810,height:540});assert.equal(asset.cardPhoto.variantResampling.nativeDetailAdded,false);assert.equal(asset.caption,'Hans & Grietje 的塔樓、斜屋頂與黃色窗框。');assert.equal(asset.alt,'Hans & Grietje 童話風格建築的塔樓、斜屋頂與黃色窗框，背景是藍天。');
 const expected=['727e26ac3aaf6ce605d3f4d2fc42e10fb1b76659ab266762bd215ad272f06603','197606aa6dca1a9c8105884b07cf316ce1089a0f7d02ee605535e16a1f86ab82','0ecc3cb2007e2fe191142efd241298b813548a45e0b1acb9d176f2ca59394011','cc50e074dc42ef7d525d375fd95ece34d45f1b98c423a522bbe43ad5d890e582','8b4a31cce718e869848c6f7413c6e729f295a9f47c11c48d77c2dde66ae6faf8','35570a863f25c894f734e04a0944aef8cdc73d669652686e6a1028256a036de5'];const variants=[...asset.variants,...asset.cardPhoto.variants];assert.deepEqual(variants.map(v=>v.sha256),expected);for(const v of variants){const b=read(v.url.slice(1));assert.equal(hash(b),v.sha256);assert.equal(b.length,v.bytes);}
});
test('all live Hans refs, hero/body/card/country overview share the clean source; original distinct supports remain',()=>{
 const am=data.cities.find(c=>c.id==='amsterdam'),p=am.places.find(p=>p.id==='am-pancake');assert.deepEqual(p.images,[asset.assetId,'hans-grietje-2','hans-grietje-3']);assert.equal(new Set(p.images.map(id=>{const a=data.assets.find(a=>a.assetId===id);return a.lineage.sourceSha256+':'+a.lineage.pts;})).size,3);assert(am.hero.includes(asset.assetId));assert.equal(am.cards.find(c=>c.target===p.id).assetId,asset.assetId);assert(!data.assets.some(a=>a.assetId==='hans-grietje-1'));
 const city=renderApprovedCity(data,am.id),country=renderApprovedCountry(data,'netherlands'),home=renderTravelHomeR24();for(const h of [city,country,home])assert(!h.includes('/trip/assets/eu-hans-grietje-1-'));for(const h of [city,country]){assert(h.includes(asset.variants[1].url));assert(h.includes(asset.cardPhoto.variants[1].url));assert(h.includes(asset.caption.replace('&','&amp;')));}
});
test('card upsampling rejects missing or false native-source declarations and keeps other cards default no-upscale',()=>{
 for(const change of [c=>delete c.variantResampling,c=>c.variantResampling.effectiveSourceWidth=1440,c=>c.variantResampling.method='ai-enhancement',c=>c.variantResampling.maxOutputWidth=2000,c=>c.variantResampling.nativeDetailAdded=true]){const d=structuredClone(data);change(d.assets.find(a=>a.assetId===asset.assetId).cardPhoto);assert.throws(()=>validateApprovedTravelPackage(d));}
 const d=structuredClone(data),other=d.assets.find(a=>a.cardPhoto&&a.assetId!==asset.assetId);other.cardPhoto.variants.at(-1).width=other.cardPhoto.width+1;assert.throws(()=>validateApprovedTravelPackage(d));
});
