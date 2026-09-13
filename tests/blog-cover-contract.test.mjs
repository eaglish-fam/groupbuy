import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validateBlogCover } from '../scripts/blog-cover-contract.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8');
function fixture() {
  const entry = JSON.parse(read('config/blog-cover-identities.json')).articles['/blog/caesar-kenting/'];
  // Fixture represents a completed editorial review; live review is audited separately.
  entry.review.viewportWidths = [320, 390, 768, 1440];
  entry.review.mobileCardLegible = true;
  return { root, datePublished: '2026-09-13', dateModified: '2026-09-14', entry,
    html: read('blog/caesar-kenting/index.html'),
    indexCard: read('blog/index.html').match(/<article[^>]*data-article="caesarKenting"[\s\S]*?<\/article>/)[0],
    productEntry: read('product-content.js').split('\n').find((line) => line.includes('caesarKenting:')) };
}
test('reviewed cover agrees with article, index, share metadata and shared editorial card', () => {
  assert.deepEqual(validateBlogCover(fixture()), []);
});
test('new or revised article with no cover review is blocked', () => {
  assert.deepEqual(validateBlogCover({ ...fixture(), entry: null }), ['cover-identity:missing-review']);
});
test('untouched legacy article does not require an unrelated migration', () => {
  assert.deepEqual(validateBlogCover({ datePublished:'2026-09-13', dateModified:'2026-09-13' }), []);
});
test('changing rendered image invalidates checksum-bound pixel review', () => {
  const input = fixture(); input.entry.imageSha256 = 'stale';
  const failures = validateBlogCover(input);
  assert.ok(failures.includes('cover-identity:render-checksum'));
  assert.ok(failures.includes('cover-identity:pixel-review'));
});
test('a slogan without identity in the article title is blocked', () => {
  const input = fixture(); input.html = input.html.replace(/<h1[\s\S]*?<\/h1>/, '<h1>先選對房</h1>');
  assert.ok(validateBlogCover(input).includes('cover-identity:article-title'));
});
test('a plain photo on the index cannot substitute for the reviewed cover', () => {
  const input = fixture(); input.indexCard = input.indexCard.replaceAll('cover-title-v2.webp', 'cover.webp');
  assert.ok(validateBlogCover(input).includes('cover-identity:index-image'));
});
test('source changes require re-rendering and a renewed source checksum', () => {
  const input = fixture(); input.entry.sourceSha256 = 'stale';
  assert.ok(validateBlogCover(input).includes('cover-identity:source-checksum'));
});
test('mobile card and each responsive check are required', () => {
  const input = fixture(); input.entry.review.viewportWidths = [1440];
  assert.ok(validateBlogCover(input).includes('cover-identity:pixel-review'));
});
