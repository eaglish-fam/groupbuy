import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,mkdtempSync,mkdirSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {resolve} from 'node:path';
import {renderTravelHomeR24} from '../scripts/render-travel-home-r24.mjs';
import {collectIndexablePages} from '../scripts/site-seo-inventory.mjs';
const root=resolve(import.meta.dirname,'..');
const model=JSON.parse(readFileSync(root+'/trip/data/singapore-public-article-v1.json'));
test('travel homepage has a usable static approved Singapore guide and schema without new country hub',()=>{
 const html=renderTravelHomeR24();assert.equal((html.match(/<li class="dest-card" data-country="singapore"/g)||[]).length,1);assert(html.includes('<a class="dest-link" href="/trip/singapore/">'));assert(html.includes('<a href="/trip/singapore/"><span class="place-name">新加坡</span>'));
 const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert(schema.hasPart.some(p=>p.url==='https://www.eaglish.store/trip/singapore/'));
 assert(html.includes('data-home-guides'));assert(html.includes('class="world-map" role="region"'));
});
test('new home entry uses the approved Jewel family photo, whole variant set, inside the 3:2 card',()=>{
 // The independent 3:2 pair stays on the Singapore overview short card (trip-social-photo-refresh);
 // the home's single country card uses the pair's first approved photo.
 const html=renderTravelHomeR24(),entry=html.match(/<li class="dest-card" data-country="singapore"[\s\S]*?<\/li>/)[0];
 const card=model.navigationView.cards.find(c=>c.target==='jewel');
 assert.deepEqual(card.imagePair,['sg-ig-DX_y4WhE3EF-01','sg-jewel-grandmother-social-refresh-g1-r1']);
 const photo=model.article.heroImages.find(i=>i.assetId===card.imagePair[0]);
 assert(entry.includes(`width="${photo.width}" height="${photo.height}"`));for(const v of photo.variants)assert(entry.includes(`${v.url} ${v.width}w`));
 assert(entry.includes('style="object-position:50% 30%"'),'portrait keeps the family inside the landscape frame');
 assert(entry.includes('loading="lazy"'));
 assert.match(readFileSync(root+'/trip/trip-home.css','utf8'),/\.dest-photo\{aspect-ratio:3\/2;[^}]*\}\n\.dest-photo img\{width:100%;height:100%;object-fit:cover/);
});
test('built Singapore is part of public indexable inventory',()=>{
 assert(collectIndexablePages(root).some(p=>p.path==='/trip/singapore/'));
});
