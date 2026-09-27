import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {bangkokCatalog,media,scene} from '../scripts/trip-bangkok-places.mjs';
import {cities} from '../trip/thailand-model.mjs';
import {bangkokRoutes} from '../scripts/trip-bangkok-routes.mjs';
import {replaceDay,resizePlan} from '../trip/bangkok-planner-model.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
test('all nine original family photographs have source metadata and appear in the guide',()=>{
 const photos=JSON.parse(read('trip/data/bangkok-photos.json')),html=read('trip/guides/bangkok-with-kids/index.html');
 assert.equal(photos.length,9);
 assert.deepEqual(photos.map(p=>p.photoNumber),[1,2,3,4,5,6,7,8,9]);
 for(const p of photos){assert.ok(html.includes('/trip/assets/'+p.id+'.webp'));assert.equal(media[p.id].kind,'user-supplied-photo');assert.ok(p.originalSha256&&p.section);assert.match(scene(p.id),/loading="lazy" fetchpriority="low"/);}
 assert.equal(cities[0].image,'bkk-bangkok-family');
 const hero=html.match(/<div class="bkk-hero">([\s\S]*?)<\/div>/)[1];
 assert.match(hero,/bkk-bangkok-family/);assert.doesNotMatch(hero,/bkk-aquarium-reef/);
 assert.match(scene('bkk-canal-family'),/bkk-canal-family.webp 960w/);
 assert.match(scene('bkk-canal-family'),/style="--photo-ratio:960\/1280"/);
 assert.doesNotMatch(scene('bkk-canal-family'),/bkk-canal-family-960.webp/);
});
test('canal excursion connects the supplied Maps place, video chapter, photos and selectable route',()=>{
 const p=bangkokCatalog.places.find(p=>p.anchor==='canal');
 assert.equal(bangkokCatalog.places.length,9);
 assert.equal(p.mapsUrl,'https://maps.app.goo.gl/aegTtEfDUrmkHQeHA?g_st=ic');
 assert.equal(p.video,'https://www.youtube.com/watch?v=F5cQv1yS69g');assert.equal(p.videoSeconds,1041);
 assert.match(p.hours,/09:30–18:30/);
 assert.deepEqual(p.gallery,['bkk-canal-buddha','bkk-canal-mother-kids']);
 assert.ok(p.activities.some(a=>a.text.includes('下船入寺')));
 const route=bangkokRoutes.routes.find(r=>r.id==='canal');assert.deepEqual(route.placeIds,[p.id]);
 assert.equal(replaceDay(resizePlan([],2,bangkokRoutes),0,'canal',bangkokRoutes)[0],'canal');
 for(const file of ['trip/guides/bangkok-with-kids/index.html','trip/thailand/bangkok/index.html','trip/thailand/index.html'])assert.ok(read(file).includes('空邦龍水上市集'));
});
