import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';

const read = name => readFileSync(new URL('../' + name, import.meta.url), 'utf8');
const html = read('trip/flights/index.html');
const css = read('flights/flights.css') + read('flights/faraway.css');
function contrast(a, b) {
  const luminance = color => {
    const rgb = color.match(/[a-f0-9]{2}/gi).map(x => parseInt(x, 16) / 255)
      .map(x => x <= .04045 ? x / 12.92 : ((x + .055) / 1.055) ** 2.4);
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  };
  const values = [luminance(a), luminance(b)].sort((a, b) => b - a);
  return (values[0] + .05) / (values[1] + .05);
}

test('Faraway identity keeps internal production notes out of the consumer interface', () => {
  assert.match(html, /<title>鷹家遠行所/);
  const wordmark = read('flights/assets/faraway-wordmark.svg');
  assert.match(wordmark, /<title id="title">鷹家遠行所/);
  assert.equal((wordmark.match(/<path /g) || []).length, 5);
  assert.doesNotMatch(wordmark, /@font-face|data:font|<image/);
  for (const asset of ['fuji-sky.webp', 'fuji-sky-800.webp', 'fuji-sky.jpg', 'sky-wing.webp']) {
    assert.ok(existsSync(new URL('../flights/assets/' + asset, import.meta.url)), asset);
  }
  assert.doesNotMatch(html, /AI\s*(?:生成|視覺|品牌)|人工智慧|意象圖|製作註記/);
  assert.doesNotMatch(html, /hero-credit|faraway-design\.md|design-notes\.md/);
  assert.match(html, /票價以供應商最新報價為準/);
  assert.match(html, /商品連結含聯盟合作/);
  assert.doesNotMatch(html, /台北.*紐約|27,800/);
});

test('Faraway keeps dual-ticket layout, responsive fallback, and reduced motion', () => {
  assert.match(css, /\.deal-grid\s*\{[^}]*repeat\(2, minmax\(0, 1fr\)\)/);
  assert.match(css, /@media \(max-width: 900px\)/);
  assert.match(css, /\.deal-grid\s*\{ grid-template-columns: 1fr; \}/);
  assert.match(css, /prefers-reduced-motion: reduce/);
  assert.match(read('flights/flights.js'), /不代表已出票或保留座位/);
  assert.match(css, /\.inspiration-band\s*\{ background: var\(--sky\)/);
  assert.match(css, /\.product-link\s*\{[^}]*background: var\(--rust\)/);
});

test('blue and orange-red small text/buttons retain AA contrast', () => {
  for (const [foreground, background] of [
    ['#15366a', '#fffefa'], ['#566781', '#f1f7ff'],
    ['#c4472d', '#fffefa'], ['#ffffff', '#c4472d'],
    ['#ffffff', '#075cdb'],
  ]) assert.ok(contrast(foreground, background) >= 4.5, foreground + ' on ' + background);
});
