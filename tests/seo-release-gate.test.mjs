import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';

import { auditRelease } from '../scripts/seo-release-gate.mjs';

async function makeRoot() {
  const root = await mkdtemp(join(tmpdir(), 'seo-gate-'));
  await mkdir(join(root, 'assets'), { recursive: true });
  await mkdir(join(root, 'blog', 'widget'), { recursive: true });
  await mkdir(join(root, 'config'), { recursive: true });
  await writeFile(join(root, 'assets/hero.webp'), Buffer.alloc(2048));
  await writeFile(join(root, 'assets/article-cover.webp'), Buffer.alloc(2048));
  await writeFile(join(root, 'assets/divider.webp'), Buffer.alloc(64));
  return root;
}

const CLEAN_ITEMS = Array.from({ length: 6 }, (_, i) => ({
  id: `p${i}`, brand: `品項 ${i}`, description: '一段介紹文字', category: '居家', article: null, image: null,
}));

async function writeCatalogSnapshot(root, items = CLEAN_ITEMS) {
  await writeFile(join(root, 'config/catalog-snapshot.json'), JSON.stringify({
    version: 1, observedAt: '2026-09-15T00:00:00.000Z',
    source: 'https://docs.google.com/spreadsheets/d/example/', items,
  }));
}

async function writeHomepage(root, {
  canonical = 'https://www.eaglish.store/',
  robots = '<meta name="robots" content="index,follow">',
  heroImg = '<img src="/assets/hero.webp" width="1600" height="1000" alt="鷹家好物首頁主圖" loading="eager">',
  extra = '',
} = {}) {
  const html = `<!doctype html><html><head><link rel="canonical" href="${canonical}">${robots}</head><body>${heroImg}<a href="/blog/">選物誌</a><a href="https://example.com/partner">外部合作夥伴</a>${CLEAN_ITEMS.map(i=>`<article data-snapshot-card>${i.brand}</article>`).join('')}${extra}</body></html>`;
  await writeFile(join(root, 'index.html'), html);
}

async function writeBlogIndex(root) {
  await writeFile(join(root, 'blog/index.html'), '<!doctype html><html><head><link rel="canonical" href="https://www.eaglish.store/blog/"></head><body>選物誌首頁</body></html>');
}

async function writeArticle(root, {
  robots = '',
  imgAlt = '<img src="/assets/article-cover.webp" width="1400" height="900" alt="商品實拍照片" loading="lazy">',
  decorativeImg = '<img src="/assets/divider.webp" width="10" height="10" alt="" aria-hidden="true" loading="lazy">',
  extraLinks = '',
} = {}) {
  const html = `<!doctype html><html><head><link rel="canonical" href="https://www.eaglish.store/blog/widget/">${robots}</head><body><h1 id="top">Widget</h1>${imgAlt}${decorativeImg}<a href="/#missing-fragment">回到首頁片段</a>${extraLinks}</body></html>`;
  await writeFile(join(root, 'blog/widget/index.html'), html);
}

async function writeSitemap(root, urls = [
  'https://www.eaglish.store/',
  'https://www.eaglish.store/blog/',
  'https://www.eaglish.store/blog/widget/',
]) {
  const body = urls.map((loc) => `<url><loc>${loc}</loc><lastmod>2026-09-15</lastmod></url>`).join('');
  await writeFile(join(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`);
}

function findBy(findings, category, pattern) {
  return findings.find((f) => f.category === category && pattern.test(f.message));
}

test('clean fixture site has no blocking findings', async (context) => {
  const root = await makeRoot();
  context.after(() => rm(root, { recursive: true, force: true }));
  await writeHomepage(root);
  await writeBlogIndex(root);
  await writeArticle(root);
  await writeSitemap(root);
  await writeCatalogSnapshot(root);

  const findings = [];
  const report = auditRelease(root, findings);
  assert.equal(report.counts.blocking, 0, JSON.stringify(findings, null, 2));
  assert.equal(report.counts.pages, 3);
});

test('flags an unsafe canonical mismatch', async (context) => {
  const root = await makeRoot();
  context.after(() => rm(root, { recursive: true, force: true }));
  await writeHomepage(root, { canonical: 'https://www.eaglish.store/?ref=email' });
  await writeBlogIndex(root);
  await writeArticle(root);
  await writeSitemap(root);
  await writeCatalogSnapshot(root);

  const findings = [];
  auditRelease(root, findings);
  assert.ok(findBy(findings, 'sitemap', /Canonical mismatch/));
});

test('flags a noindex page still listed in the sitemap', async (context) => {
  const root = await makeRoot();
  context.after(() => rm(root, { recursive: true, force: true }));
  await writeHomepage(root);
  await writeBlogIndex(root);
  await writeArticle(root, { robots: '<meta name="robots" content="noindex,nofollow">' });
  await writeSitemap(root);
  await writeCatalogSnapshot(root);

  const findings = [];
  auditRelease(root, findings);
  assert.ok(findBy(findings, 'sitemap', /noindex/));
});

test('rejects non-HTTPS, wrong-host, query-string, and test/design sitemap entries', async (context) => {
  const root = await makeRoot();
  context.after(() => rm(root, { recursive: true, force: true }));
  await writeHomepage(root);
  await writeBlogIndex(root);
  await writeArticle(root);
  await writeSitemap(root, [
    'https://www.eaglish.store/',
    'https://www.eaglish.store/blog/',
    'https://www.eaglish.store/blog/widget/',
    'http://www.eaglish.store/insecure/',
    'https://staging.eaglish.store/other-host/',
    'https://www.eaglish.store/blog/?debug=1',
    'https://www.eaglish.store/design/preview/',
  ]);
  await writeCatalogSnapshot(root);

  const findings = [];
  auditRelease(root, findings);
  assert.ok(findBy(findings, 'sitemap', /not HTTPS/));
  assert.ok(findBy(findings, 'sitemap', /host is not/));
  assert.ok(findBy(findings, 'sitemap', /query string/));
  assert.ok(findBy(findings, 'sitemap', /test\/design/));
});

test('flags a broken internal link but leaves external links unchecked against the filesystem', async (context) => {
  const root = await makeRoot();
  context.after(() => rm(root, { recursive: true, force: true }));
  await writeHomepage(root, { extra: '<a href="/broken-page/">缺頁</a>' });
  await writeBlogIndex(root);
  await writeArticle(root);
  await writeSitemap(root);
  await writeCatalogSnapshot(root);

  const findings = [];
  auditRelease(root, findings);
  assert.ok(findBy(findings, 'links', /Broken internal link.*\/broken-page\//));
  assert.ok(!findings.some((f) => f.message.includes('example.com')));
});

test('warns without crashing on an orphaned link fragment, including a regex-unsafe fragment id', async (context) => {
  const root = await makeRoot();
  context.after(() => rm(root, { recursive: true, force: true }));
  await writeHomepage(root);
  await writeBlogIndex(root);
  await writeArticle(root, { extraLinks: '<a href="/blog/widget/#c++">self reference</a>' });
  await writeSitemap(root);
  await writeCatalogSnapshot(root);

  const findings = [];
  const report = auditRelease(root, findings);
  const fragmentFinding = findBy(findings, 'links', /fragment not found/);
  assert.ok(fragmentFinding);
  assert.equal(fragmentFinding.level, 'warn');
  assert.equal(report.counts.blocking, findings.filter((f) => f.level === 'blocking').length);
});

test('blocks an article image with no alt and no dimensions, but exempts a marked decorative image', async (context) => {
  const root = await makeRoot();
  context.after(() => rm(root, { recursive: true, force: true }));
  await writeHomepage(root);
  await writeBlogIndex(root);
  await writeArticle(root, { imgAlt: '<img src="/assets/article-cover.webp" loading="lazy">' });
  await writeSitemap(root);
  await writeCatalogSnapshot(root);

  const findings = [];
  auditRelease(root, findings);
  const altFinding = findBy(findings, 'images', /missing meaningful alt text/);
  const dimsFinding = findBy(findings, 'images', /missing positive width\/height/);
  assert.ok(altFinding && altFinding.level === 'blocking');
  assert.ok(dimsFinding && dimsFinding.level === 'blocking');
  assert.ok(!findings.some((f) => f.message.includes('divider.webp') && f.level === 'blocking'));
});

test('blocks a missing local image source without claiming image weight guarantees ranking', async (context) => {
  const root = await makeRoot();
  context.after(() => rm(root, { recursive: true, force: true }));
  await writeHomepage(root);
  await writeBlogIndex(root);
  await writeArticle(root, { imgAlt: '<img src="/assets/missing-cover.webp" width="1400" height="900" alt="不存在的商品照片" loading="lazy">' });
  await writeSitemap(root);
  await writeCatalogSnapshot(root);

  const findings = [];
  auditRelease(root, findings);
  const missing = findBy(findings, 'images', /Local image source not found/);
  assert.ok(missing && missing.level === 'blocking');
  assert.ok(!findings.some((f) => /guarantee/.test(f.message) && f.message.includes('ranking') && f.level === 'blocking'));
});

test('too-empty snapshot and a leaked operational field are both blocking, without crashing on either', async (context) => {
  const root = await makeRoot();
  context.after(() => rm(root, { recursive: true, force: true }));
  await writeHomepage(root);
  await writeBlogIndex(root);
  await writeArticle(root);
  await writeSitemap(root);
  await writeCatalogSnapshot(root, [{ id: 'p1', brand: '單一商品', description: 'x', category: '居家', article: null, image: null }]);

  const findings = [];
  auditRelease(root, findings);
  assert.ok(findBy(findings, 'snapshot', /too few public items/));

  const findings2 = [];
  await writeCatalogSnapshot(root, [
    ...CLEAN_ITEMS,
    { id: 'leaky', brand: '洩漏商品', description: 'x', category: '居家', article: null, image: null, price: 999 },
  ]);
  auditRelease(root, findings2);
  assert.ok(findBy(findings2, 'snapshot', /disallowed operational field: price/));
});

test('does not leak the raw Sheet source URL onto the built homepage', async (context) => {
  const root = await makeRoot();
  context.after(() => rm(root, { recursive: true, force: true }));
  await writeHomepage(root, { extra: '<!-- https://docs.google.com/spreadsheets/d/leak/ -->' });
  await writeBlogIndex(root);
  await writeArticle(root);
  await writeSitemap(root);
  await writeCatalogSnapshot(root);

  const findings = [];
  auditRelease(root, findings);
  assert.ok(findBy(findings, 'snapshot', /raw Sheet source URL/));
});
