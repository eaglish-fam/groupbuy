import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const ProductContent = require('../product-content.js');
const EditorPicks = require('../design/editor-picks.js');

test("Editor's Pick includes every published article and starts with the newest", () => {
  const picks = EditorPicks.ordered(ProductContent.catalog);
  assert.equal(picks.length, 22);
  assert.deepEqual(picks.map((item) => item.key), [
    'blackmores',
    'parakito',
    'shinwaLiving',
    'knsh',
    'locknlock',
    'leofoo',
    'eben',
    'branden',
    'lange',
    'shoumaji',
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
  assert.match(css, /height: clamp\(190px, 52vw, 220px\)/);
  assert.match(css, /object-position: left center/);
  assert.match(css, /text-overflow: ellipsis/);
  assert.match(css, /white-space: nowrap/);
  assert.match(css, /\.pick-arrow/);
  assert.match(css, /grid-template-columns: 1fr auto 1fr/);
});

test('journal home shows the same Editor\'s Pick carousel on desktop only', () => {
  const html = fs.readFileSync(new URL('../blog/index.html', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../blog/journal-hero.css', import.meta.url), 'utf8');
  const script = fs.readFileSync(new URL('../design/editor-picks.js', import.meta.url), 'utf8');
  const [first] = EditorPicks.ordered(ProductContent.catalog);
  const hero = html.match(/<div class="journal-hero">[\s\S]*?<section/)?.[0] || '';
  assert.match(hero, /<header class="blog-hero"><h1>/);
  assert.match(hero, /data-editor-picks data-editor-picks-media="\(min-width: 901px\)"/);
  assert.match(hero, /aria-roledescription="carousel"/);
  for (const control of ['data-pick-prev', 'data-pick-next', 'data-pick-toggle', 'data-pick-dots']) assert.ok(hero.includes(control), control);
  assert.ok(hero.includes(`data-pick-key="${first.key}"`) && hero.includes(`href="${first.article}"`), 'static slide is the newest pick');
  const image = hero.match(/<img [^>]*>/)?.[0] || '';
  assert.match(hero, /<picture><source media="\(max-width: 900px\)" srcset="data:image\/gif;base64,[^"]+" sizes="1px"><img /, 'hidden phone layout must not fetch the hero image');
  assert.match(image, /loading="eager"/);
  assert.match(css, /\.journal-hero \.hero-carousel\{display:none\}/);
  assert.match(css, /@media \(min-width:901px\)/);
  assert.match(html, /\/blog\/journal-hero\.css\?v=/);
  assert.ok(html.indexOf('/product-content.js') < html.indexOf('/design/editor-picks.js'), 'catalog loads before the carousel');
  assert.match(script, /editorPicksMedia/);
  assert.match(script, /gate\?\.matches === false/);
});
