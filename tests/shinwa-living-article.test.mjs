import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import http from 'node:http';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { extname, resolve } from 'node:path';
import test from 'node:test';

const root = resolve(import.meta.dirname, '..');
const html = readFileSync(resolve(root, 'blog/shinwa-living/index.html'), 'utf8');
const media = JSON.parse(readFileSync(resolve(root, 'assets/shinwa-living/media-manifest.json'), 'utf8'));
const registry = JSON.parse(readFileSync(resolve(root, 'config/permanent-offers.json'), 'utf8'));
const require = createRequire(import.meta.url);
const ProductContent = require('../product-content.js');
const sha = path => createHash('sha256').update(readFileSync(path)).digest('hex');
const editorialCount = text => (text.match(/[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g) || []).length + (text.match(/[A-Za-z0-9]+(?:[.±–-][A-Za-z0-9]+)*/g) || []).length;

test('article uses the frozen seven-section structure and one public H1', () => {
  const article = html.match(/<article\b[^>]*>[\s\S]*?<\/article>/)?.[0] || '';
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.equal((article.match(/<h2\b/g) || []).length, 7);
  assert.equal((article.match(/<h3\b/g) || []).length, 2);
  const toc = html.match(/<nav class="article-toc guide-nav reading-nav-source"[^>]*>([\s\S]*?)<\/nav>/)?.[1] || '';
  assert.match(html, /<nav class="article-toc guide-nav reading-nav-source" data-reading-nav/);
  assert.equal((toc.match(/<a\b/g) || []).length, 7);
  for (const anchor of ['workshop','family-play','folding-game','memory-box','cat-tools','friend-videos','choose-and-shop'])
    assert.match(toc, new RegExp(`href="#${anchor}"`));
  for (const sentence of [
    '我們和心窪生活的朋友，在教會認識很多年了，也常去宜蘭住他們家。',
    '做了三個半小時，<br>兩台木車還沒完成',
    'NT$6,800 是一張桌板、兩張椅板的升級套件，不含木架',
    '心窪生活是我們認識多年的朋友；使用本文推薦折扣碼購買，我們可能獲得分潤。',
  ]) assert.ok(html.includes(sentence), sentence);
  const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/)?.[1] || '';
  const visible = main.replace(/<script\b[\s\S]*?<\/script>/gi, '').replace(/<style\b[\s\S]*?<\/style>/gi, '').replace(/<[^>]*>/g, ' ');
  assert.equal(editorialCount(visible), 1980);
  const css = readFileSync(resolve(root, 'blog/shinwa-living/shinwa.css'), 'utf8');
  assert.match(css, /\[data-article-key="shinwaLiving"\] \.story-photo\{padding:0;border:0;background:transparent;box-shadow:none\}/);
  assert.match(css, /\.cat-gallery\{display:grid;grid-template-columns:1\.347fr 1\.705fr 1\.544fr;align-items:start/);
  assert.match(css, /\.cat-gallery img\{display:block;width:100%;height:auto;max-height:none;object-fit:contain\}/);
});

test('metadata, canonical, Article and Breadcrumb identities agree', () => {
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.eaglish\.store\/blog\/shinwa-living\/">/);
  assert.match(html, /"mainEntityOfPage":"https:\/\/www\.eaglish\.store\/blog\/shinwa-living\/"/);
  assert.match(html, /"datePublished":"2026-10-14"/);
  assert.match(html, /"dateModified":"2026-10-14"/);
  assert.match(html, /"@type":"BreadcrumbList"/);
  assert.match(html, /<meta property="og:image" content="https:\/\/www\.eaglish\.store\/assets\/shinwa-living\/cover\.webp">/);
});

test('six click-to-load players preserve the adopted start and end bounds without eager iframes', () => {
  assert.equal((html.match(/data-video-src=/g) || []).length, 6);
  assert.equal((html.match(/<iframe\b/g) || []).length, 0);
  for (const range of [
    ['uIOk9Ie0YN0',529,769], ['uIOk9Ie0YN0',136,166], ['5mPDjzQOuPA',71,82],
    ['dSgptEdzEqM',832,887], ['z07oMlyI7ew',0,71], ['XpqY8O9-x40',851,1130],
  ]) assert.ok(html.includes(`embed/${range[0]}?start=${range[1]}&amp;end=${range[2]}&amp;autoplay=1&amp;rel=0`));
  assert.equal((html.match(/class="video-jumps"/g) || []).length, 1);
  assert.equal((html.match(/href="#video-(?:woodwork|bed|visit|market|outing)"/g) || []).length, 5);
});

test('adopted media files and manifest hashes are present and source bounded', () => {
  assert.equal(media.schema, 'eaglish.shinwa-media/v1');
  assert.ok(Date.parse(media.generatedAt) <= Date.now());
  assert.equal(media.outputs.length, 21);
  assert.equal(JSON.stringify(media).includes('/Users/'), false);
  for (const item of media.outputs) {
    const path = resolve(root, `.${item.path}`);
    assert.ok(existsSync(path), item.path);
    assert.equal(sha(path), item.sha256, item.path);
    assert.ok(item.width > 0 && item.height > 0, item.path);
  }
  const scratcher = media.outputs.find(item => item.path.endsWith('/cat-scratcher.webp'));
  assert.deepEqual([scratcher.width, scratcher.height], [1100, 1767]);
  assert.match(media.transforms.catScratcher, /no enlargement/);
});

test('published permanent offer, product article identity and blog entry stay aligned', () => {
  const offer = registry.offers.find(item => item.id === 'shinwa-living-eaglish');
  assert.equal(offer.state, 'published');
  assert.equal(offer.publicationNotYetAccepted, false);
  assert.equal(offer.destinationUrl, 'https://www.shinwaliving.com/');
  assert.equal(offer.articlePath, '/blog/shinwa-living/');
  assert.equal(offer.image.path, '/assets/shinwa-living/product-card.webp');
  assert.equal(offer.image.sha256, sha(resolve(root, `.${offer.image.path}`)));
  assert.equal(ProductContent.catalog.shinwaLiving.article, offer.articlePath);
  const blogIndex = readFileSync(resolve(root, 'blog/index.html'), 'utf8');
  assert.match(blogIndex, /data-article="shinwaLiving"/);
  assert.match(blogIndex, /href="\/blog\/shinwa-living\/"/);
});

test('article works at 320px, loads one player on click and copies the exact code', async t => {
  const mime = { '.js':'text/javascript', '.css':'text/css', '.html':'text/html', '.svg':'image/svg+xml', '.webp':'image/webp', '.json':'application/json' };
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, 'http://local');
    let file = resolve(root, `.${url.pathname}`);
    if (!file.startsWith(root) || !existsSync(file)) { response.statusCode = 404; return response.end(); }
    if (statSync(file).isDirectory()) file = resolve(file, 'index.html');
    response.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    response.setHeader('Cache-Control', 'no-store');
    response.end(readFileSync(file));
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  t.after(() => server.close());
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '/Users/zosia/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
  const browser = await chromium.launch({ headless:true, executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  t.after(() => browser.close());
  const context = await browser.newContext({ viewport:{ width:320, height:844 }, serviceWorkers:'block', permissions:['clipboard-read','clipboard-write'] });
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    if (url.origin === `http://127.0.0.1:${server.address().port}`) return route.continue();
    return route.abort();
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/blog/shinwa-living/`, { waitUntil:'networkidle' });
  assert.equal(await page.locator('[data-video-src]').count(), 6);
  assert.equal(await page.locator('iframe').count(), 0);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
  const poster = page.locator('#video-woodwork [data-video-src]');
  await poster.click();
  const frame = page.locator('#video-woodwork iframe');
  await frame.waitFor();
  assert.match(await frame.getAttribute('src'), /uIOk9Ie0YN0\?start=529&end=769&autoplay=1&rel=0/);
  await page.locator('[data-shinwa-copy]').click();
  await page.waitForFunction(() => document.querySelector('.copy-status').textContent.length > 0);
  assert.equal(await page.locator('.copy-status').innerText(), '折扣碼已複製');
  assert.equal(await page.evaluate(() => navigator.clipboard.readText()), 'eaglish');
  assert.equal(await page.locator('[data-shinwa-copy]').evaluate(element => parseFloat(getComputedStyle(element).height) >= 44), true);
  assert.deepEqual(errors, []);
});
