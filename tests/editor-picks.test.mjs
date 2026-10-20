import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import fs from 'node:fs';

const require = createRequire(import.meta.url);
const ProductContent = require('../product-content.js');
const EditorPicks = require('../design/editor-picks.js');

test("Editor's Pick includes every published article and starts with the newest", () => {
  // Derived from the catalog so a new article needs no edit here; the rules are what is pinned.
  const picks = EditorPicks.ordered(ProductContent.catalog);
  const published = Object.entries(ProductContent.catalog)
    .filter(([, item]) => item.article && item.image && item.title && /^\d{4}-\d{2}-\d{2}$/.test(item.published || ''));
  assert.ok(picks.length >= 22, `picks: ${picks.length}`);
  assert.deepEqual(new Set(picks.map((item) => item.key)), new Set(published.map(([key]) => key)), 'every dated article exactly once');
  assert.equal(new Set(picks.map((item) => item.key)).size, picks.length);
  for (let i = 1; i < picks.length; i++) assert.ok(picks[i - 1].published >= picks[i].published, `${picks[i - 1].key} before ${picks[i].key}`);
  // Same-day articles keep catalog order, so the newest entry added at the top of the catalog leads.
  const newest = published.map(([, item]) => item.published).sort().at(-1);
  assert.equal(picks[0].key, published.find(([, item]) => item.published === newest)[0]);
  assert.ok(picks.every((item) => item.article.startsWith('/blog/') && item.image.startsWith('/assets/')));
  // Undated or articleless entries (e.g. a campaign without its own article) never enter the carousel.
  assert.ok(!picks.some((item) => item.key === 'fushanFrozen'));
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
