// Jowua discount-code article and coupon card (Hiram 2026-11-16: 折扣碼區＋選物誌，攻「Jowua 折扣碼」).
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const pc = require('../product-content.js');
const PermanentOffers = require('../design/permanent-offers.js');
const registry = JSON.parse(readFileSync(new URL('../config/permanent-offers.json', import.meta.url), 'utf8'));
const html = readFileSync(new URL('../blog/jowua/index.html', import.meta.url), 'utf8');

test('jowua: the coupon card shows code eagle, 95 折 and the affiliate link, next to the existing offer', () => {
  const merged = PermanentOffers.mergeProducts([], registry);
  const jowua = merged.find(p => p.brand === 'Jowua');
  assert.ok(jowua, 'Jowua coupon card');
  assert.equal(jowua.coupon, 'eagle');
  assert.equal(jowua.description, '全館 95 折');
  assert.equal(jowua.url, 'https://global.jowua-life.com/eagle');
  assert.equal(jowua.kind, 'coupon');
  assert.equal(jowua.article.article, '/blog/jowua/');
  assert.ok(existsSync(new URL('..' + jowua.images[0], import.meta.url)));
  assert.ok(merged.some(p => p.brand === '心窪生活'), 'the existing fixed-amount offer still loads');
});

test('jowua: percentage discounts are validated', () => {
  const base = registry.offers.find(o => o.id === 'jowua-eagle');
  const v = discount => PermanentOffers.validateRegistry({schema: registry.schema, offers: [{...base, discount}]});
  assert.doesNotThrow(() => v({percent: 5, display: '全館 95 折'}));
  for (const bad of [{percent: 0, display: 'x'}, {percent: 100, display: 'x'}, {percent: 5.5, display: 'x'}, {percent: 5, amount: 10, display: 'x'}, {percent: 5, currency: 'TWD', display: 'x'}, {percent: 5}])
    assert.throws(() => v(bad), undefined, JSON.stringify(bad));
});

test('jowua: article targets 「Jowua 折扣碼」 and states the code, value and link plainly', () => {
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /<title>Jowua 折扣碼 eagle 全館 95 折/);
  assert.match(html, /<h1>Jowua 折扣碼 eagle 全館 95 折/);
  assert.match(html, /<strong class="offer-code">eagle<\/strong>/);
  assert.match(html, /data-jowua-copy="eagle"/);
  assert.ok((html.match(/href="https:\/\/global\.jowua-life\.com\/eagle"/g) || []).length >= 2);
  assert.match(html, /我們可能獲得分潤/);
  assert.doesNotMatch(html, /growthhero|password|ivy\.song/i, 'no account details in a public page');
  const nav = html.match(/<nav[^>]*data-reading-nav[^>]*>([\s\S]*?)<\/nav>/)?.[1] || '';
  for (const [, id] of nav.matchAll(/href="#([^"]+)"/g)) assert.match(html, new RegExp(`id="${id}"`), id);
  assert.match(html, /<noscript>[\s\S]*?href="\/"/);
});

test('jowua: catalog entry and journal card (recommended offer, not a group-buy status)', () => {
  assert.equal(pc.entry('Jowua')?.id, 'jowua');
  const card = readFileSync(new URL('../blog/index.html', import.meta.url), 'utf8').match(/<article class="article-card" data-article="jowua"[\s\S]*?<\/article>/)?.[0];
  assert.ok(card);
  assert.match(card, /data-content-kind="coupon"/);
  const model = require('../blog/blog-model.js');
  assert.deepEqual(model.stateForArticle([], 'jowua', '2026-11-16', 'coupon'), {shelf: 'journal', label: '推薦優惠'});
});
