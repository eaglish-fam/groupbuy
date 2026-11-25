import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const ProductContent = require('../product-content.js');

test('campaign results carry the start date so the key-facts card can show the whole window', () => {
  const row = { '品牌': '加拿大 Jan & Jul 秋冬保暖系列', '類型': '限時', '開團日期': '2026/11/16', '結束日期': '2026/12/07', '連結': 'https://example.com/janjul' };
  const open = ProductContent.campaignFor([row], 'janJulWinter', '2026-11-25');
  assert.equal(open.state, 'open');
  assert.equal(open.start, '2026-11-16');
  assert.equal(open.end, '2026-12-07');
  const upcoming = ProductContent.campaignFor([row], 'janJulWinter', '2026-11-10');
  assert.equal(upcoming.state, 'upcoming');
  assert.equal(upcoming.start, '2026-11-16');
});

test('key-facts card: open campaigns get facts written from the article itself; both article scripts mount it', () => {
  assert.equal(typeof ProductContent.mountKeyFacts, 'function');
  for (const key of ['janJulWinter', 'ilovekidsBookcase', 'momaxLocator']) {
    const f = ProductContent.catalog[key].facts;
    assert.ok(f && f.price && f.shipping && f.delivery, key);
  }
  assert.match(fs.readFileSync(new URL('../articles/sheet-offer.js', import.meta.url), 'utf8'), /mountKeyFacts\?\.\(key, campaign/);
  assert.match(fs.readFileSync(new URL('../articles/article.js', import.meta.url), 'utf8'), /mountKeyFacts\?\.\(articleKey,c,/);
  const source = fs.readFileSync(new URL('../product-content.js', import.meta.url), 'utf8');
  assert.match(source, /\['open','upcoming'\]\.includes\(c\.state\)/, 'closed campaigns show no card');
});
