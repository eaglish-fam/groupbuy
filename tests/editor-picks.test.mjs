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

test('journal home: campaign banner on every width, status navigation, and the newest pick as the no-JS slide', () => {
  // Hiram 2026-11-24：選物誌要像選物部落格，有導航列（開團中、即將開團、已結團）和 Hero Banner。
  const html = fs.readFileSync(new URL('../blog/index.html', import.meta.url), 'utf8');
  const css = fs.readFileSync(new URL('../blog/journal-hero.css', import.meta.url), 'utf8');
  const script = fs.readFileSync(new URL('../blog/journal-home.js', import.meta.url), 'utf8');
  const [first] = EditorPicks.ordered(ProductContent.catalog);
  const hero = html.match(/<section class="campaign-hero"[\s\S]*?<\/section>/)?.[0] || '';
  assert.match(hero, /data-campaign-hero/);
  assert.match(hero, /aria-roledescription="carousel"/);
  for (const control of ['data-ch-prev', 'data-ch-next', 'data-ch-toggle', 'data-ch-dots']) assert.ok(hero.includes(control), control);
  assert.ok(hero.includes(`data-pick-key="${first.key}"`) && hero.includes(`href="${first.article}"`), 'static slide is the newest pick');
  const image = hero.match(/<img [^>]*>/)?.[0] || '';
  assert.match(image, /loading="eager"/);
  assert.doesNotMatch(hero, /data:image\/gif/, 'the banner image loads on phones too');
  assert.match(html, /<header class="blog-hero"><h1>/);
  const tabs = html.match(/<nav class="status-tabs"[\s\S]*?<\/nav>/)?.[0] || '';
  for (const [tab, label] of [['open', '開團中'], ['upcoming', '即將開團'], ['journal', '已結團'], ['guides', '知識指南']]) {
    assert.ok(tabs.includes(`data-status-tab="${tab}"`) && tabs.includes(label), label);
    assert.ok(html.includes(`data-shelf="${tab}"`), `shelf ${tab}`);
  }
  assert.equal((html.match(/class="journal-chrome"/g) || []).length, 1);
  assert.ok(html.indexOf('class="status-tabs"') > html.indexOf('class="journal-chrome"') && html.indexOf('class="status-tabs"') < html.indexOf('<main'), 'status tabs live in the sticky journal chrome');
  assert.match(html, /\/blog\/journal-hero\.css\?v=/);
  assert.ok(html.indexOf('/blog/blog.js') < html.indexOf('/blog/journal-home.js'), 'journal home script loads after blog.js');
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /min-height:4[4-8]px/);
  assert.match(script, /6500/);
  assert.match(script, /document|doc\.hidden/);
  assert.match(script, /JournalHome/);
});

test('homepage carousel switches to open campaigns once the Sheet loads: timed first by end date, evergreens fill up to eight', () => {
  const all = [
    { key: 'a', article: '/blog/a/', published: '2026-11-01', title: 'A' },
    { key: 'b', article: '/blog/b/', published: '2026-11-02', title: 'B' },
    { key: 'c', article: '/blog/c/', published: '2026-11-03', title: 'C' },
    { key: 'd', article: '/blog/d/', published: '2026-11-04', title: 'D' },
  ];
  const open = (href, end, long = false) => ({ article: { article: href }, status: { key: 'open', long }, end, url: 'https://shop.example/' + href, key: href });
  const picks = EditorPicks.openPicks(all, [
    open('/blog/a/', '2026-12-10'),
    open('/blog/b/', '', true),
    open('/blog/c/', '2026-11-30'),
    { article: { article: '/blog/d/' }, status: { key: 'closed' }, end: '2026-11-01' },
    { kind: 'book', article: { article: '/blog/a/' }, status: { key: 'open' } },
  ], Date.parse('2026-11-25T12:00:00+08:00'));
  assert.deepEqual(picks.map(p => p.key), ['c', 'a', 'b']);
  assert.equal(picks[0].campaign.url, 'https://shop.example//blog/c/');
  assert.equal(picks[2].campaign.end, '');
  const script = fs.readFileSync(new URL('../design/editor-picks.js', import.meta.url), 'utf8');
  assert.match(script, /catalog-rendered/);
  assert.match(script, /dataset\.buyKey/);
});
