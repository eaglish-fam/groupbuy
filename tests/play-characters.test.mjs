// GB-028: 角色卡體驗（/play/，測試版）。
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';

const require = createRequire(import.meta.url);
const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
require('../play/characters.js');
const P = globalThis.PlayCharacters;
const snapshotBrands = new Set(JSON.parse(read('config/catalog-snapshot.json')).items.map((i) => i.brand));

test('every product a character or the card builder mentions is a brand in the catalogue snapshot', () => {
  const used = new Set();
  for (const c of P.characters) for (const s of c.day) for (const b of s.options) used.add(b);
  for (const x of [...P.builder.roles, ...P.builder.worries]) for (const b of x.brands) used.add(b);
  const missing = [...used].filter((b) => !snapshotBrands.has(b));
  assert.deepEqual(missing, []);
  assert.ok(used.size >= 20);
});

test('characters are complete, unique and mostly women as Hiram described the audience', () => {
  const ids = P.characters.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const c of P.characters) {
    for (const k of ['name', 'nick', 'role', 'place', 'tagline', 'story', 'color']) assert.ok(c[k], `${c.id}.${k}`);
    assert.match(c.gender, /^[fm]$/);
    assert.ok(Number.isInteger(c.age) && c.age >= 18);
    assert.ok(c.day.length >= 4, `${c.id} needs a day`);
    for (const s of c.day) {
      for (const k of ['time', 'title', 'text', 'need', 'reaction']) assert.ok(s[k], `${c.id} ${s.title} ${k}`);
      assert.ok(s.options.length >= 1 && s.options.length <= 3);
    }
    for (const g of c.groups) assert.ok(P.groups.some((x) => x.id === g), `${c.id} group ${g}`);
  }
  const women = P.characters.filter((c) => c.gender === 'f').length / P.characters.length;
  assert.ok(women >= 0.7, `women share ${women}`);
  assert.ok(P.characters.some((c) => c.gender === 'm'), 'at least one father');
});

test('the test page stays out of search and the sitemap, and the homepage links to it', () => {
  const page = read('play/index.html');
  assert.match(page, /<meta name="robots" content="noindex,follow" \/>/);
  assert.doesNotMatch(read('sitemap.xml'), /\/play\//);
  for (const p of ['design/index.html', 'index.html']) {
    const nav = read(p).match(/<nav class="content-nav"[\s\S]*?<\/nav>/)[0];
    assert.match(nav, /<a href="\/play\/">角色卡體驗（測試）<\/a>/, p);
  }
  // Same catalogue rules as the homepage: catalog-core loads before the page script.
  assert.ok(page.indexOf('/design/catalog-core.js') < page.indexOf('/play/play.js'));
  assert.ok(page.indexOf('/play/characters.js') < page.indexOf('/play/play.js'));
});

test('the page only offers a buy link for open campaigns and keeps progress on the device', () => {
  const js = read('play/play.js');
  assert.match(js, /url: p\.status\.key === "open" \? p\.url : ""/);
  assert.match(js, /localStorage\.setItem\(STORE/);
  assert.doesNotMatch(js, /fetch\([^)]*(?:POST|method)/i, 'no data is sent anywhere');
});
