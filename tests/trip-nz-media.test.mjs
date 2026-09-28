import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {nzRegions} from '../scripts/trip-nz-visuals.mjs';
import {regions} from '../trip/new-zealand-data.mjs';
import {galleries} from '../trip/new-zealand-galleries.mjs';

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
  assert.match(html, /href="#ninja-valley"><img src="\/trip\/assets\/nz-christchurch-akaroa-ninja-valley-2585s-v1.webp"/);
});

test('New Zealand media retains source evidence, checksums, and bounded image weight', () => {
  const media = JSON.parse(read('trip/assets/nz-media.json'));
  assert.ok(media.length>=29); // Original reviewed collection plus later sourced galleries.
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
    assert.match(guide,/從照片與玩法挑選今天想去的地方。點進各站看交通、建議停留與雨備；跨城和預約活動記得預留移動及報到時間。/,region.id);
    assert.doesNotMatch(guide,/有核對來源的景點附實景；其餘先用文字介紹/,region.id);
  }
  assert.match(read('trip/new-zealand/north-island/index.html'),/href="\/trip\/new-zealand\/wellington\/">威靈頓親子兩到三天<\/a>/);
  assert.match(read('trip/new-zealand/wellington/index.html'),/nz-wellington-te-papa-v1.webp/);
  assert.match(read('trip/new-zealand/wellington/index.html'),/nz-wellington-cable-car-v1.webp/);
  assert.match(read('trip/new-zealand/queenstown-arrowtown/index.html'),/nz-queenstown-skyline-luge-v1.webp/);
  assert.match(read('trip/new-zealand/queenstown-arrowtown/index.html'),/nz-queenstown-earnslaw-v1.webp/);
  assert.match(read('trip/new-zealand/queenstown-arrowtown/index.html'),/nz-arrowtown-street-v1.webp/);
  assert.doesNotMatch(hub,/nz-wellington-zoo|nz-hamilton-zoo/);
});

test('regional photo galleries use distinct sourced images and retain explicit source gaps', () => {
  const media = new Map(JSON.parse(read('trip/assets/nz-media.json')).map(item => [item.name,item]));
  const legacyMedia = new Set(['nz-farm','nz-boat']);
  const gaps = new Set([
    'christchurch-akaroa/tram','otago/oamaru','otago/moeraki',
    'wanaka-tekapo/cardrona','wanaka-tekapo/wanaka-lake','wanaka-tekapo/wanaka-tree',
    'wanaka-tekapo/tekapo-lake','wanaka-tekapo/church',
  ]);
  let complete=0;
  for (const region of regions) {
    const html = read(region.route.slice(1)+'index.html');
    for (const place of region.stops.filter(stop => !stop.alternate)) {
      const photos = galleries[region.id]?.[place.id];
      assert.ok(photos?.length,`${region.id}/${place.id}`);
      assert.equal(photos.length,gaps.has(`${region.id}/${place.id}`)?1:3,`${region.id}/${place.id}`);
      if (photos.length===3) complete++;
      assert.ok(photos.every(item => media.get(item.name)?.source || legacyMedia.has(item.name)),`${region.id}/${place.id} source`);
      assert.equal(new Set(photos.map(item => item.name)).size,photos.length,`${region.id}/${place.id} duplicate image`);
      const hashes = photos.map(item => media.get(item.name)?.sha256 ?? createHash('sha256').update(readFileSync(new URL('../trip/assets/'+item.name+'.webp',import.meta.url))).digest('hex'));
      assert.equal(new Set(hashes).size,photos.length,`${region.id}/${place.id} duplicate pixels`);
      assert.ok(html.includes(`id="${place.id}"`),`${region.id}/${place.id} anchor`);
      for (const item of photos) assert.ok(html.includes(`/trip/assets/${item.name}`),`${region.id}/${place.id} image`);
    }
  }
  assert.equal(complete,30);
  assert.ok(galleries['queenstown-arrowtown'].lakefront.some(item => item.name==='nz-fergburger-eating-v1'));
  assert.ok(galleries['queenstown-arrowtown'].arrowtown.some(item => item.name==='nz-arrowtown-gold-panning-v1'));
});

test('regional preview cards use their place gallery covers when legacy photo fields are empty', () => {
  let galleryBackedCards = 0;
  for (const region of regions) {
    const html = read(region.route.slice(1)+'index.html');
    const cards = [...html.matchAll(/<a class="nz-photo-card([^"]*)" href="#([^"]+)">([\s\S]*?)<\/a>/g)];
    assert.ok(cards.length,`${region.id} preview cards`);
    for (const [,classes,placeId,body] of cards) {
      const cover = galleries[region.id]?.[placeId]?.[0];
      if (!cover) continue;
      galleryBackedCards++;
      assert.ok(!classes.includes('nz-photo-card--text'),`${region.id}/${placeId} is not a text card`);
      assert.ok(body.includes(`src="/trip/assets/${cover.name}`),`${region.id}/${placeId} cover`);
    }
  }
  assert.ok(galleryBackedCards >= 11);
});
