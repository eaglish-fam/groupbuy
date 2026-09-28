import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {nzRegions} from '../scripts/trip-nz-visuals.mjs';
import {regions} from '../trip/new-zealand-data.mjs';

const read = path => readFileSync(new URL('../'+path,import.meta.url),'utf8');
const article = () => read('trip/new-zealand/christchurch/3-days/index.html');

test('reviewed Christchurch article keeps city-first photos, confirmed meal, and stable anchors', () => {
  const html = article();
  const early = html.split('id="itinerary"')[0];
  assert.ok((early.match(/<img /g) || []).length >= 5);
  assert.match(html, /<figure class="nz-hero"><img src="\/trip\/assets\/nz-christchurch-tram.webp"/);
  assert.match(html, /id="tram"/);
  assert.match(html, /id="new-regent"/); // old deep link remains usable
  assert.ok(html.indexOf('基督城市區電車') < html.indexOf('Akaroa Dolphins'));
  assert.match(html, /property="og:image" content="https:\/\/www.eaglish.store\/trip\/assets\/nz-christchurch-tram.webp"/);
  assert.match(html, /Bully Hayes Restaurant &amp; Bar|Bully Hayes Restaurant & Bar/);
  assert.match(html, /https:\/\/maps.app.goo.gl\/jakzvS5oCc3fzL45A/);
  assert.doesNotMatch(html, /59 Beach Road|並非我們已試吃推薦|實景照片待核對/);
  assert.match(html, /nz-photo-card--text/); // no unverified replacement imagery
});

test('New Zealand media retains source evidence, checksums, and bounded image weight', () => {
  const media = JSON.parse(read('trip/assets/nz-media.json'));
  assert.equal(media.length,29); // original 18 plus eleven reviewed Terra frames
  assert.equal(new Set(media.map(item => item.name)).size,media.length);
  for (const item of media) {
    const image = readFileSync(new URL('../trip/assets/'+item.name+'.webp',import.meta.url));
    assert.equal(createHash('sha256').update(image).digest('hex'),item.sha256,item.name);
    assert.ok(item.width <= 1440 && item.height > 0,item.name);
    assert.ok(item.bytes < 400000,item.name);
    assert.match(item.source,/^https:\/\/www\.(instagram|youtube)\.com\//);
    if (item.kind.includes('video-frame')) assert.ok(item.source.endsWith('&t='+item.second+'s'),item.name);
    assert.equal(item.path,undefined);
  }
  assert.equal(nzRegions.length,10); // legacy visual catalog is still available
  const hub = read('trip/new-zealand/index.html');
  assert.doesNotMatch(hub,/Milford Sound|Mt Cook|Oamaru Blue Penguin Colony|nz-nz-lake-cruise/);
  for (const region of regions) {
    assert.ok(hub.includes(`href="${region.route}"`),region.id);
    assert.ok(hub.includes(region.hero+'.webp'),region.id);
    const guide = read(region.route.slice(1)+'index.html');
    assert.ok(guide.includes(`rel="canonical" href="https://www.eaglish.store${region.route}"`),region.id);
    assert.doesNotMatch(guide,/實景照片待核對|專屬實景照片待核對/,region.id);
  }
  assert.match(read('trip/new-zealand/north-island/index.html'),/href="\/trip\/new-zealand\/wellington\/">威靈頓親子兩到三天<\/a>/);
  assert.match(read('trip/new-zealand/wellington/index.html'),/nz-wellington-te-papa-v1.webp/);
  assert.match(read('trip/new-zealand/wellington/index.html'),/nz-wellington-cable-car-v1.webp/);
  assert.match(read('trip/new-zealand/queenstown-arrowtown/index.html'),/nz-queenstown-skyline-luge-v1.webp/);
  assert.match(read('trip/new-zealand/queenstown-arrowtown/index.html'),/nz-queenstown-earnslaw-v1.webp/);
  assert.match(read('trip/new-zealand/queenstown-arrowtown/index.html'),/nz-arrowtown-street-v1.webp/);
  assert.doesNotMatch(hub,/nz-wellington-zoo|nz-hamilton-zoo/);
});
