import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import http from 'node:http';
import { createRequire } from 'node:module';
import { extname, resolve } from 'node:path';
import test from 'node:test';

const require = createRequire(import.meta.url);
const PermanentOffers = require('../design/permanent-offers.js');
const registry = JSON.parse(readFileSync(new URL('../config/permanent-offers.json', import.meta.url), 'utf8'));
const accepted = registry.offers[0];

const publishedRegistry = (overrides = {}) => ({
  schema: registry.schema,
  offers: [{ ...accepted, state: 'published', publicationNotYetAccepted: false, ...overrides }],
});
const candidateRegistry = () => ({
  schema: registry.schema,
  offers: [{ ...accepted, state: 'candidate', publicationNotYetAccepted: true }],
});

test('current reviewed Shinwa record is published while a candidate revision never reaches consumers', () => {
  assert.equal(PermanentOffers.validateRegistry(registry).offers[0].id, 'shinwa-living-eaglish');
  assert.equal(PermanentOffers.mergeProducts([], registry)[0].images[0], '/assets/shinwa-living/product-card.webp');
  const sheet = [{ brand: '既有優惠', coupon: 'SAVE', key: 'sheet:1' }];
  assert.deepEqual(PermanentOffers.mergeProducts(sheet, candidateRegistry()), sheet);
});

test('published reviewed offer maps to the existing coupon-card shape without mutating the official URL', () => {
  const [offer] = PermanentOffers.mergeProducts([], publishedRegistry());
  assert.equal(offer.kind, 'coupon');
  assert.equal(offer.status.key, 'open');
  assert.equal(offer.brand, '心窪生活');
  assert.equal(offer.coupon, 'eaglish');
  assert.equal(offer.description, '現折200元');
  assert.equal(offer.url, 'https://www.shinwaliving.com/');
  assert.equal(new URL(offer.url).search, '');
  assert.equal(offer.exactDestination, true);
  assert.equal(offer.article.article, '/blog/shinwa-living/');
  assert.equal(offer.article.id, 'shinwa-living');
  assert.deepEqual(offer.images, ['/assets/shinwa-living/product-card.webp']);
  assert.match(offer.disclosure, /可能獲得分潤/);
  assert.deepEqual(offer.terms, {});
});

test('reviewed permanent offer deduplicates a Sheet row by stable id or brand plus code', () => {
  const byId = { brand: '別名', coupon: 'OTHER', permanentOfferId: accepted.id, key: 'sheet:id' };
  const byIdentity = { brand: ' 心窪生活 ', coupon: 'EAGLISH', key: 'sheet:identity', url: 'https://example.invalid/' };
  const unrelated = { brand: '其他優惠', coupon: 'EAGLISH', key: 'sheet:other' };
  const merged = PermanentOffers.mergeProducts([byId, byIdentity, unrelated], publishedRegistry());
  assert.equal(merged.length, 2);
  assert.equal(merged[0], unrelated);
  assert.equal(merged[1].permanentOfferId, accepted.id);
  assert.equal(merged.filter((item) => item.brand === '心窪生活').length, 1);
});

test('refresh failure preserves ordinary products as unavailable and admits only the current reviewed registry', () => {
  const ordinary = {
    brand: '既有普通商品', key: 'sheet:ordinary', coupon: 'STALE',
    status: { key: 'open', label: '限時開團', long: false },
    retailers: [{ name: '舊購買入口', url: 'https://example.invalid/stale' }],
  };
  const stalePermanent = {
    brand: '舊常駐優惠', key: 'permanent-offer:stale', coupon: 'OLD',
    permanentOfferId: 'stale-offer', exactDestination: true,
    status: { key: 'open', label: '推薦優惠', long: true },
  };
  const fallback = PermanentOffers.unavailableProducts([ordinary, stalePermanent], publishedRegistry());
  assert.equal(fallback.length, 2);
  assert.equal(fallback[0].key, ordinary.key);
  assert.deepEqual(fallback[0].status, { key: 'unknown', label: '團購狀態待確認', long: false });
  assert.deepEqual(fallback[0].retailers, []);
  assert.ok(!fallback.some((product) => product.permanentOfferId === 'stale-offer'));
  assert.equal(fallback[1].permanentOfferId, accepted.id);
  assert.equal(fallback[1].status.key, 'open');
});

test('unsafe, ambiguous or prematurely published records fail closed', () => {
  for (const destinationUrl of [
    'http://www.shinwaliving.com/',
    'https://user:pass@www.shinwaliving.com/',
    'https://www.shinwaliving.com/#offer',
    'https://www.shinwaliving.com'
  ]) assert.throws(() => PermanentOffers.validateRegistry(publishedRegistry({ destinationUrl })), /destination/);
  assert.throws(() => PermanentOffers.validateRegistry(publishedRegistry({ discount: { amount: 0, currency: 'TWD', display: '現折200元' } })), /discount/);
  assert.throws(() => PermanentOffers.validateRegistry(publishedRegistry({ image: { path: 'https://example.invalid/card.webp', sha256: accepted.image.sha256, alt: 'x' } })), /image/);
  assert.throws(() => PermanentOffers.validateRegistry(publishedRegistry({ state: 'candidate', publicationNotYetAccepted: false })), /Candidate/);
  assert.throws(() => PermanentOffers.validateRegistry({ schema: registry.schema, offers: [accepted, accepted] }), /Duplicate/);
});

test('copy helper reports success and provides a manual-copy fallback', async () => {
  let copied = '', success = 0, failure = 0;
  const ok = await PermanentOffers.copyCode('eaglish', {
    clipboard: { writeText: async (value) => { copied = value; } },
    onSuccess: () => success++,
    onFailure: () => failure++,
  });
  assert.deepEqual(ok, { ok: true, manual: false });
  assert.equal(copied, 'eaglish');
  assert.equal(success, 1);
  assert.equal(failure, 0);

  const fallback = await PermanentOffers.copyCode('eaglish', {
    clipboard: { writeText: async () => { throw Error('denied'); } },
    onSuccess: () => success++,
    onFailure: () => failure++,
  });
  assert.deepEqual(fallback, { ok: false, manual: true });
  assert.equal(success, 1);
  assert.equal(failure, 1);
});

test('active homepage source loads the adapter and keeps accessible copy fallback markup', () => {
  const html = readFileSync(new URL('../design/index.html', import.meta.url), 'utf8');
  const design = readFileSync(new URL('../design/design.js', import.meta.url), 'utf8');
  const complete = readFileSync(new URL('../design/complete-content.js', import.meta.url), 'utf8');
  const css = readFileSync(new URL('../design/complete-content.css', import.meta.url), 'utf8');
  assert.match(html, /permanent-offers\.js/);
  assert.match(html, /id="toast"[^>]*aria-live="polite"[^>]*aria-atomic="true"/);
  assert.match(html, /<noscript><p class="resource-empty">/);
  assert.match(design, /PermanentOffers\.mergeProducts/);
  assert.match(design, /p\.exactDestination/);
  assert.match(design, /destinationUrl: p\.url/);
  assert.match(complete, /PermanentOffers\.copyCode/);
  assert.match(css, /\.coupon-inline button\s*\{[^}]*min-height:\s*44px/s);
});

test('refresh failure keeps ordinary cards unavailable while the current published fixture remains usable', async (t) => {
  const root = resolve(import.meta.dirname, '..');
  const mime = { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.json': 'application/json' };
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, 'http://local');
    let file = resolve(root, `.${url.pathname}`);
    if (!file.startsWith(root) || !existsSync(file)) { response.statusCode = 404; return response.end(); }
    if (statSync(file).isDirectory()) file = resolve(file, 'index.html');
    response.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    response.setHeader('Cache-Control', 'no-store');
    response.end(readFileSync(file));
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  let sheetFails = false;
  const csv = [
    ['品牌', '商品ID', '連結', '類型', '開團日期', '結束日期', '商品描述', '方案詳情', '圖片網址', '分類'],
    ['既有普通商品', 'ordinary-1', 'https://example.invalid/ordinary', '長期', '', '', '原本已顯示的商品', '', '', '其他'],
    ['心窪生活', 'shinwa-ordinary', 'https://example.invalid/shinwa-ordinary', '長期', '', '', '普通 Sheet 商品', '', '', '居家'],
  ].map((row) => row.map((value) => `"${value}"`).join(',')).join('\n');
  const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '/Users/zosia/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  t.after(() => browser.close());
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await context.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.origin === base && url.pathname === '/config/permanent-offers.json')
      return route.fulfill({ contentType: 'application/json', body: JSON.stringify(publishedRegistry()) });
    if (url.hostname === 'docs.google.com') {
      if (sheetFails) return route.abort();
      return route.fulfill({ contentType: 'text/csv', body: csv });
    }
    if (url.origin === base) return route.continue();
    if (url.hostname === 'www.googletagmanager.com') return route.fulfill({ contentType: 'text/javascript', body: '' });
    if (['image', 'font', 'media'].includes(route.request().resourceType())) return route.abort();
    return route.fulfill({ contentType: 'text/plain', body: '' });
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    window.sent = [];
    window.open = () => ({ opener: null, document: {}, closed: false, location: { replace: (url) => window.sent.push(url) }, close() { this.closed = true; } });
  });
  await page.goto(`${base}/#product-offer-shinwa-living-eaglish`, { waitUntil: 'domcontentloaded' });
  const ordinary = page.locator('#products .product-card', { hasText: '既有普通商品' });
  await ordinary.waitFor();
  assert.equal(await ordinary.locator('.status').innerText(), '常駐開團');
  assert.equal(await ordinary.locator('[data-buy-key]').count(), 1);
  const linkedOffer = page.locator('#product-offer-shinwa-living-eaglish');
  await linkedOffer.waitFor();
  await page.waitForFunction(() => {
    const element = document.getElementById('product-offer-shinwa-living-eaglish');
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < innerHeight;
  });
  assert.equal(await linkedOffer.evaluate((element) => {
    const rect = element.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < innerHeight;
  }), true);

  // Re-enter through the same warm browser context and wait for the full
  // registry + Sheet render, not just the first instant that the id exists.
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForFunction(() => {
    const element = document.getElementById('product-offer-shinwa-living-eaglish');
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < innerHeight;
  });
  await page.evaluate(() => {
    const shift = document.createElement('div');
    shift.id = 'late-layout-shift';
    shift.style.height = '2000px';
    document.body.prepend(shift);
  });
  await page.waitForFunction(() => {
    const element = document.getElementById('product-offer-shinwa-living-eaglish');
    const rect = element.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < innerHeight;
  });

  sheetFails = true;
  assert.equal(await page.evaluate(() => load()), false);
  await page.locator('#source-status', { hasText: '目前無法取得最新團購資料' }).waitFor();
  assert.equal(await ordinary.locator('.status').innerText(), '團購狀態待確認');
  assert.equal(await ordinary.locator('[data-buy-key]').count(), 0);
  assert.equal(await ordinary.locator('[data-copy-code]').count(), 0);

  const card = page.locator('#coupon-products .product-card', { hasText: '心窪生活' });
  await card.waitFor();
  assert.equal(await card.getAttribute('id'), 'product-offer-shinwa-living-eaglish');
  assert.equal(await page.locator('#products #product-shinwa-living').count(), 1);
  assert.equal(await page.locator('#product-offer-shinwa-living-eaglish').count(), 1);
  assert.equal(await page.evaluate(() => {
    const ids = [...document.querySelectorAll('[id]')].map((element) => element.id);
    return ids.length === new Set(ids).size;
  }), true);
  assert.equal(await card.locator('code').innerText(), 'eaglish');
  assert.match(await card.innerText(), /現折200元/);
  assert.match(await card.innerText(), /可能獲得分潤/);
  const link = card.locator('[data-buy-key]');
  assert.equal(await link.getAttribute('href'), 'https://www.shinwaliving.com/');
  assert.equal(await card.locator('[data-copy-code]').evaluate((button) => getComputedStyle(button).minHeight), '44px');
  await link.click();
  await page.waitForFunction(() => window.sent.length === 1);
  assert.deepEqual(await page.evaluate(() => window.sent), ['https://www.shinwaliving.com/']);
  assert.equal(errors.length, 0, errors.join('\n'));
});
