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
 const html=renderTravelHomeR24();assert.equal((html.match(/data-guide-id="singapore"/g)||[]).length,1);assert(html.includes('href="/trip/singapore/"'));
 const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert(schema.hasPart.some(p=>p.url==='https://www.eaglish.store/trip/singapore/'));
 assert(html.includes('data-photo-grid="guides"'));assert(html.includes('id="globe-stage"'));
});
test('new home entry preserves both approved independent photographs in the shared 3:2 pair',()=>{
 const html=renderTravelHomeR24(),entry=html.match(/<article class="home-guide" data-guide-id="singapore">[\s\S]*?<\/article>/)[0];
 const card=model.navigationView.cards.find(c=>c.target==='jewel');
 assert.deepEqual(card.imagePair,['sg-ig-DX_y4WhE3EF-01','sg-jewel-grandmother-social-refresh-g1-r1']);
 assert(entry.includes(`data-photo-pair="${card.imagePair.join(' ')}"`));
 for(const id of card.imagePair){const photo=[...model.article.heroImages,...model.article.sections.flatMap(s=>s.images)].find(i=>i.assetId===id);assert(entry.includes(`data-asset-id="${id}"`));assert(entry.includes(`width="${photo.width}" height="${photo.height}"`));for(const v of photo.variants)assert(entry.includes(`${v.url} ${v.width}w`));}
 assert(entry.includes('aspect-ratio:3/2'));assert(entry.includes('object-fit:cover'));
 assert(entry.includes('loading="lazy" fetchpriority="low"'));
});
test('built Singapore is part of public indexable inventory',()=>{
 assert(collectIndexablePages(root).some(p=>p.path==='/trip/singapore/'));
});
