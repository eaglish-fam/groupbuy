// Insta360 卡片圖：Sheet 的 Drive 圖 insta360.jpg 內容是空白（2026-11-08），改用網站自備的官方商品照（Hiram 核准，Kingdom decisions/2026-11-08-hiram-insta360-official-photos-ok.md）。
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync, statSync} from 'node:fs';
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
test('Insta360 cards use the reviewed local photo first, before the Sheet image', () => {
  const core = read('design/catalog-core.js');
  assert.match(core, /prefix: "Insta360", image: "\/assets\/insta360\/product-card\.webp"/);
  const f = new URL('../assets/insta360/product-card.webp', import.meta.url);
  assert.ok(existsSync(f) && statSync(f).size > 5000);
  for (const page of ['index.html', 'calendar/index.html', 'everyday/index.html'])
    assert.match(read(page), /\/design\/catalog-core\.js\?v=20261110-insta360-img/, page);
});
