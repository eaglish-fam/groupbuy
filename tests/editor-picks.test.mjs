import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const ProductContent = require('../product-content.js');
const EditorPicks = require('../design/editor-picks.js');

test("Editor's Pick includes every published article and starts with the newest", () => {
  const picks = EditorPicks.ordered(ProductContent.catalog);
  assert.equal(picks.length, 12);
  assert.deepEqual(picks.map((item) => item.key), [
    'miamily',
    'caesarKenting',
    'fushan',
    'kietla',
    'playzu',
    'hereu',
    'mitoy',
    'chuluAomori',
    'meroware',
    'atojet',
    'wave',
    'artisanCb301',
  ]);
  assert.ok(picks.every((item) => item.article.startsWith('/blog/') && item.image.startsWith('/assets/')));
});

test("Editor's Pick navigation wraps in both directions", () => {
  assert.equal(EditorPicks.wrap(6, 6), 0);
  assert.equal(EditorPicks.wrap(-1, 6), 5);
  assert.equal(EditorPicks.wrap(3, 6), 3);
  assert.equal(EditorPicks.wrap(1, 0), 0);
});

test('homepage exposes an accessible, pausable carousel with a no-JS first article', () => {
  const source = fs.readFileSync(new URL('../design/index.html', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../design/design.css', import.meta.url), 'utf8');
  const script = fs.readFileSync(new URL('../design/editor-picks.js', import.meta.url), 'utf8');
  assert.match(source, /data-editor-picks/);
  assert.match(source, /aria-roledescription="carousel"/);
  assert.match(source, /data-pick-prev/);
  assert.match(source, /data-pick-next/);
  assert.match(source, /data-pick-toggle/);
  assert.match(source, /data-pick-dots/);
  assert.match(source, /class="hero-image-link"/);
  assert.match(source, /class="hero-caption"/);
  assert.doesNotMatch(source.match(/class="hero-caption"[\s\S]*?<\/div>/)?.[0] || '', /<br/);
  assert.match(source, /href="\/blog\/mitoy-rice-blocks\/"/);
  assert.match(source, /editor-picks\.js/);
  assert.match(css, /min-height: 44px/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(script, /6500/);
  assert.match(script, /pointerup/);
  assert.match(script, /document\.hidden/);
  assert.match(script, /suppressClick/);
  assert.match(css, /height: clamp\(250px, 72vw, 300px\)/);
  assert.match(css, /object-position: left center/);
  assert.match(css, /text-overflow: ellipsis/);
  assert.match(css, /white-space: nowrap/);
  assert.match(css, /\.pick-arrow/);
  assert.match(css, /grid-template-columns: 1fr auto 1fr/);
});
