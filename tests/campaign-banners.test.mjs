// Insta360 Luna 限時活動 banner（Hiram 11/08 在 Bingo 對話交辦；Kingdom PR #1 6716976149）。不寫 Sheet，到期自動消失。
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const C = require('../design/campaign-banners.js');
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');

test('the Insta360 Luna banner says exactly what Hiram asked, and nothing more', () => {
  const c = C.campaigns.find((x) => x.id === 'insta360-luna-20261113');
  assert.ok(c);
  assert.equal(c.code, 'INRAEZ8');
  assert.equal(c.url, 'https://store.insta360.com/product/luna-series?utm_source=AffiliateCenter&utm_medium=copylink&utm_term=INRAEZ8');
  // Hiram 11/08 17:30（韓國）：連結換成聯盟中心的網址，三個 utm 都要在，不要 /tw，也不要舊的 c=6767。
  const u = new URL(c.url);
  assert.equal(u.pathname, '/product/luna-series');
  assert.equal(u.searchParams.get('utm_source'), 'AffiliateCenter');
  assert.equal(u.searchParams.get('utm_medium'), 'copylink');
  assert.equal(u.searchParams.get('utm_term'), 'INRAEZ8');
  assert.doesNotMatch(c.url, /\/tw\/|c=6767/);
  assert.deepEqual(c.lines, ['Luna Ultra 創作者套裝 85 折起', 'Care／FlexiCare 8 折', '雲端儲存 9 折']);
  assert.match(c.period, /11\/13.*23:59（台北時間）/);
  assert.match(c.gift, /INRAEZ8.*Luna Ultra 創作者套裝.*迷你磁吸補光燈.*總量 30 份.*送完為止/);
  const all = JSON.stringify(c) + C.markup(c) + C.markup(c, true);
  assert.doesNotMatch(all, /全館|全站|再打|再折|額外|疊加|NT\$|\$\d|元/, 'no sitewide discount, stacking or price claims');
  assert.ok(c.source, 'every banner keeps its source');
});

test('it shows on Insta360 cards until 2026-11-13 23:59 Taipei and then disappears by itself', () => {
  const before = Date.parse('2026-11-13T23:59:00+08:00'), after = Date.parse('2026-11-14T00:00:00+08:00');
  assert.ok(C.forBrand('Insta360 Ace Pro 2', before));
  assert.equal(C.forBrand('Insta360 Ace Pro 2', after), null);
  assert.equal(C.forBrand('Klook 折扣碼優惠', before), null, 'other brands are untouched');
  const m = C.markup(C.forBrand('Insta360', before));
  assert.match(m, /data-copy-code="INRAEZ8"/, 'the full banner has its own copy button');
  assert.match(m, /target="_blank" rel="noopener noreferrer"/);
});

test('the homepage loads the banner script', () => {
  const html = read('index.html');
  assert.match(html, /<script defer src="\/design\/campaign-banners\.js\?v=20261108-luna-link"><\/script>/, 'a new link needs a new script version so browsers do not keep the old one');
  assert.ok(html.indexOf('/design/campaign-banners.js') > html.indexOf('/design/design.js'));
});
