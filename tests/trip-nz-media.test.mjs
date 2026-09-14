import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {nzRegions} from '../scripts/trip-nz-visuals.mjs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const article=()=>read('trip/new-zealand/christchurch/3-days/index.html');
test('Christchurch leads with its own photo and real city stops, before logistics',()=>{
 const html=article();const early=html.split('id="itinerary"')[0];
 assert.ok((early.match(/<img /g)||[]).length>=5);
 assert.match(html,/<figure class="route-portrait"><img src="\/trip\/assets\/nz-christchurch-tram.webp"/);
 assert.match(html,/id="tram"/);assert.match(html,/id="new-regent"/);
 assert.ok(html.indexOf('基督城｜電車')<html.indexOf('Akaroa｜海灣'));
 assert.match(html,/property="og:image" content="https:\/\/www.eaglish.store\/trip\/assets\/nz-christchurch-tram.jpg"/);
});
test('user-confirmed restaurant and source-bound video frames do not inherit the old shop identity',()=>{
 const html=article();
 assert.match(html,/Bully Hayes Restaurant &amp; Bar|Bully Hayes Restaurant & Bar/);
 assert.match(html,/https:\/\/maps.app.goo.gl\/jakzvS5oCc3fzL45A/);
 assert.doesNotMatch(html,/59 Beach Road|並非我們已試吃推薦/);
 for(const name of ['akaroa-walk','akaroa-museum','akaroa-lunch'])assert.ok(html.includes('nz-'+name+'.webp'));
});
test('NZ media has real-source provenance, verified checksums and bounded image weight',()=>{
 const media=JSON.parse(read('trip/assets/nz-media.json'));
 assert.equal(media.length,18);assert.equal(new Set(media.map(m=>m.name)).size,18);
 for(const m of media){
  const image=readFileSync(new URL('../trip/assets/'+m.name+'.webp',import.meta.url));
  assert.equal(createHash('sha256').update(image).digest('hex'),m.sha256);
  assert.ok(m.width<=1440);assert.ok(m.height>0);assert.ok(m.bytes<400000);
  assert.match(m.source,/^https:\/\/www\.(instagram|youtube)\.com\//);
  if(m.kind==='video-frame')assert.ok(m.source.endsWith('&t='+m.second+'s'));
  assert.equal(m.path,undefined);
 }
 assert.equal(nzRegions.length,10);
 const hub=read('trip/new-zealand/index.html');
 assert.doesNotMatch(hub,/Milford Sound|Mt Cook|Oamaru Blue Penguin Colony|nz-nz-lake-cruise/);
 for(const region of nzRegions){assert.ok(hub.includes(region.name));assert.ok(hub.includes(region.image+'.webp'));}
});
