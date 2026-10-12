import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {validateApprovedTravelPackage} from '../trip/approved-travel-contract.mjs';
const root=new URL('../',import.meta.url),data=JSON.parse(readFileSync(new URL('trip/data/europe-malaysia-approved-travel-v1.json',root),'utf8'));
const hash=b=>createHash('sha256').update(b).digest('hex'),penang=data.cities.find(c=>c.id==='penang');
const replaced={
 'my-penang-george-town':['my-penang-george-town-1-g3-v3','my-penang-george-town-2-g4-r1','my-penang-george-town-3-g4-r2'],
 'my-penang-peranakan-mansion':['my-penang-peranakan-mansion-1-g4-r1','my-penang-peranakan-mansion-2-g3-v3','my-penang-peranakan-mansion-3-g3-v3'],
 'my-penang-top-jurassic':['my-penang-top-jurassic-1-g4-r1','my-penang-top-jurassic-2-g3-v3','my-penang-top-jurassic-3-g4-r1'],
 'my-penang-top-mirror-maze':['my-penang-top-mirror-maze-1-g4-r1','my-penang-top-mirror-maze-2-g3-v4','my-penang-top-mirror-maze-3-g3-v3'],
 'my-penang-top-aquarium':['my-penang-top-aquarium-3-g3-v3','my-penang-top-aquarium-2-g3-v3','my-penang-top-aquarium-detail-g4-r1'],
 'my-kl-tower':['my-kl-tower-1-g3-v3','my-kl-tower-2-g4-r1','my-kl-tower-3-g3-v3'],
 'my-kl-kwai-chai-hong':['my-kl-kwai-chai-hong-1-g3-v3','my-kl-kwai-chai-hong-2-g3-v3','my-kl-kwai-chai-hong-3-g4-r1'],
 'my-kl-rexkl-bookxcess':['my-kl-rexkl-bookxcess-1-g4-r3','my-kl-rexkl-bookxcess-2-g3-v3','my-kl-rexkl-bookxcess-3-g3-v3']
};
test('Malaysia social-media corrections use exact per-place order, not recursive ID substitutions',()=>{
 validateApprovedTravelPackage(data);const places=data.cities.filter(c=>c.countryId==='malaysia').flatMap(c=>c.places);assert.equal(places.length,23);
 for(const [id,images]of Object.entries(replaced))assert.deepEqual(places.find(p=>p.id===id).images,images);
 for(const p of places){assert.equal(p.images.length,3);assert.equal(new Set(p.images).size,3);}
 assert.ok(data.assets.some(a=>a.assetId==='my-penang-top-aquarium-3-g3-v3'),'Promoted entrance remains registered');assert.ok(!data.assets.some(a=>a.assetId==='my-penang-top-aquarium-1-g3-v3'),'Rejected former main is retired');
});
test('mansion card uses the new body identity and separately approved 3:2 crop and focal point',()=>{
 const card=penang.cards.find(c=>c.target==='my-penang-peranakan-mansion');assert.equal(card.assetId,'my-penang-peranakan-mansion-1-g4-r1');assert.deepEqual(card.focalPoint,[50,50]);
 const a=data.assets.find(x=>x.assetId===card.assetId);assert.ok(a.cardPhoto);assert.equal(a.cardPhoto.width/a.cardPhoto.height,1.5);assert.deepEqual(a.cardPhoto.activePicture,{x:150,y:0,width:1620,height:1080});
});
test('dinosaur body and hero use distinct source-derived crops; main and country image are unchanged',()=>{
 assert.deepEqual(penang.hero,['my-penang-hero-main-g3-v3','my-penang-hero-support-1-g3-v3','my-penang-hero-support-2-g4-r1']);assert.equal(data.countries.find(c=>c.id==='malaysia').image,'my-penang-hero-main-g3-v3');
 const body=data.assets.find(a=>a.assetId==='my-penang-top-jurassic-3-g4-r1'),hero=data.assets.find(a=>a.assetId==='my-penang-hero-support-2-g4-r1');assert.equal(body.lineage.pts,270003);assert.equal(hero.lineage.pts,270003);assert.notDeepEqual(body.lineage.activePicture,hero.lineage.activePicture);assert.equal(hero.width/hero.height,1.5);assert.doesNotMatch(body.caption+body.alt+hero.caption+hero.alt,/孩子|骨架/);
});
test('new public variants retain declared hashes and budgets; source originals and private ledgers are unnecessary for public validation',()=>{
 const assets=data.assets.filter(a=>/-g4-r[123]$/.test(a.assetId));assert.equal(assets.length,11);const variants=assets.flatMap(a=>[...a.variants,...(a.cardPhoto?.variants||[])]);assert.equal(variants.length,36);
 for(const v of variants){const bytes=readFileSync(new URL(v.url.slice(1),root));assert.equal(hash(bytes),v.sha256);assert.equal(bytes.length,v.bytes);assert.ok(v.bytes<=(v.width<=640?120000:v.width<=960?220000:400000));}
 assert.doesNotMatch(JSON.stringify(data),/\/Users\/|\/tmp\/|file:\/\/|packetSha256|dispatchId/);
});
test('photo correction does not rewrite facts, stories, planner, source rights, other guides or discovery content',()=>{
 const value=structuredClone(data);delete value.assets;for(const c of value.cities){delete c.hero;for(const p of c.places)delete p.images;for(const card of c.cards){delete card.assetId;delete card.focalPoint;}}
 assert.equal(hash(JSON.stringify(value)),'073da6bdc240dba9c9c96ca6e42de0c45d1ccc2113bfbbff051f03fc37e42db0');
});
