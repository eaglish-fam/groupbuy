import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import { loadBrowserRuntime } from './browser-runtime.mjs';

const root = resolve(import.meta.dirname, '..');
const read = (file) => readFileSync(resolve(root, file), 'utf8');

test('calendar page has its own canonical URL, share card and breadcrumb data', () => {
  const html = read('calendar/index.html');
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.eaglish\.store\/calendar\/">/);
  assert.match(html, /<title>鷹家買物社團購行事曆｜本週開團、即將截止一次看<\/title>/);
  assert.match(html, /<meta name="robots" content="index,follow/);
  assert.match(html, /og:image" content="https:\/\/www\.eaglish\.store\/assets\/calendar\/og-calendar-v1\.jpg"/);
  assert.match(html, /og:image:width" content="1200"/);
  assert.match(html, /og:image:height" content="630"/);
  const jpeg = readFileSync(resolve(root, 'assets/calendar/og-calendar-v1.jpg'));
  const sof = jpeg.indexOf(Buffer.from([0xff, 0xc0]));
  assert.deepEqual([jpeg.readUInt16BE(sof + 7), jpeg.readUInt16BE(sof + 5)], [1200, 630]);
  const graph = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1])['@graph'];
  assert.deepEqual(graph.map((node) => node['@type']), ['WebPage', 'BreadcrumbList']);
  assert.doesNotMatch(html, /"@type":"Event"/);
  assert.equal((html.match(/<h1\b/g) || []).length, 1);
  assert.match(html, /<noscript>[\s\S]*href="\/"/);
  assert.match(html, /href="https:\/\/line\.me\/ti\/g2\//);
  // A clear way back to the store, at the top and after the lists.
  assert.match(html, /<a class="back-link" href="\/#catalog">/);
  assert.match(html, /<section class="back-cta wrap"[\s\S]*href="\/#catalog"/);
  assert.match(html, /id="month-grid"/);
  assert.ok(html.indexOf('/design/catalog-core.js') < html.indexOf('/calendar/calendar.js'));
  assert.match(read('sitemap.xml'), /<loc>https:\/\/www\.eaglish\.store\/calendar\/<\/loc>/);
});

test('homepage menu points the calendar entry at /calendar/ and keeps its own month view', () => {
  const page = read('index.html');
  const nav = page.match(/<nav class="content-nav"[\s\S]*?<\/nav>/)[0];
  assert.match(nav, /<a href="\/calendar\/">團購行事曆<\/a>/);
  assert.match(page, /id="calendar"/);
  assert.match(page, /class="text-link calendar-page-link" href="\/calendar\/"/);
  assert.ok(page.indexOf('/design/catalog-core.js') < page.indexOf('/design/design.js'));
});

test('calendar groups match the homepage counts and keep buying behind a live check', { timeout: 60_000 }, async (t) => {
  const runtime = await loadBrowserRuntime();
  if (!runtime) return t.skip('Playwright is unavailable');
  const { chromium, executablePath } = runtime;
  const mime = { '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2' };
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, 'http://local');
    let file = resolve(root, `.${decodeURIComponent(url.pathname)}`);
    if (!file.startsWith(root) || !existsSync(file)) { response.statusCode = 404; return response.end(); }
    if (statSync(file).isDirectory()) file = resolve(file, 'index.html');
    response.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    response.end(readFileSync(file));
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  const base = `http://127.0.0.1:${server.address().port}`;
  const header = ['品牌', '商品ID', '連結', '類型', '開團日期', '結束日期', '商品描述', '方案詳情', '圖片網址', '分類'];
  const rows = [
    ['快截止商品', 'closing-1', 'https://example.invalid/closing', '短期', '2026-10-15', '2026-10-23', '說明', '', '', '居家'],
    ['開團中商品', 'open-1', 'https://example.invalid/open', '短期', '2026-10-15', '2026-10-30', '說明', '', '', '食品'],
    ['下一檔商品', 'upcoming-1', 'https://example.invalid/upcoming', '短期', '2026-10-28', '2026-11-05', '說明', '', '', '母嬰'],
    ['常駐商品', 'long-1', 'https://example.invalid/long', '長期', '', '', '說明', '', '', '居家'],
    ['已結團商品', 'closed-1', 'https://example.invalid/closed', '短期', '2026-10-01', '2026-10-10', '說明', '', '', '居家'],
    ['折扣碼列', 'coupon-1', 'https://example.invalid/coupon', '折扣碼', '', '', '說明', '', '', '居家'],
  ];
  const csv = [header, ...rows].map((row) => row.map((v) => `"${v}"`).join(',')).join('\n');
  let sheetFails = false;
  const browser = await chromium.launch({ headless: true, executablePath });
  t.after(async () => { await browser.close(); server.close(); });
  const open = async (path, width) => {
    const context = await browser.newContext({ viewport: { width, height: 900 }, serviceWorkers: 'block' });
    await context.route('**/*', (route) => {
      const url = new URL(route.request().url());
      if (url.hostname === 'docs.google.com') return sheetFails ? route.abort() : route.fulfill({ contentType: 'text/csv', body: csv });
      if (url.origin === base) return route.continue();
      return route.fulfill({ status: 204, body: '' });
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.clock.install({ time: new Date('2026-10-21T04:00:00Z') });
    await page.addInitScript(() => {
      window.sent = [];
      window.open = () => ({ opener: null, document: {}, closed: false, location: { replace: (url) => window.sent.push(url) }, close() { this.closed = true; } });
    });
    await page.goto(base + path, { waitUntil: 'domcontentloaded' });
    return { page, context, errors };
  };

  const { page, context, errors } = await open('/calendar/', 390);
  await page.locator('[data-group="closing"] .cal-item').first().waitFor();
  const names = async (group) => page.locator(`[data-group="${group}"] .cal-item h3`).allTextContents();
  assert.deepEqual(await names('closing'), ['快截止商品']);
  assert.deepEqual(await names('open'), ['開團中商品']);
  assert.deepEqual(await names('upcoming'), ['下一檔商品']);
  assert.deepEqual(await names('evergreen'), ['常駐商品']);
  assert.match(await page.locator('#calendar-summary').innerText(), /限時開團 2 檔（3 天內截止 1 檔）・即將開團 1 檔/);
  assert.equal(await page.locator('[data-group="closing"] .cal-countdown').innerText(), '剩 2 天');
  assert.equal(await page.locator('[data-group="upcoming"] [data-buy-key]').count(), 0);
  assert.equal(await page.locator('#subscribe-all').isVisible(), true);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  // Month view: today's month, the first upcoming event day picked, cards for that day.
  assert.equal(await page.locator('#month-label').innerText(), '2026 年 10 月');
  assert.equal(await page.locator('#month-grid [data-day="2026-10-23"]').getAttribute('aria-pressed'), 'true');
  assert.equal(await page.locator('#agenda-title').innerText(), '10/23 的開結團（1 檔）');
  assert.deepEqual(await page.locator('#agenda-items .cal-item h3').allTextContents(), ['快截止商品']);
  assert.equal(await page.locator('#month-grid [data-day="2026-10-20"]').isDisabled(), true);
  await page.locator('#month-grid [data-day="2026-10-28"]').click();
  assert.deepEqual(await page.locator('#agenda-items .cal-item h3').allTextContents(), ['下一檔商品']);
  assert.match(await page.locator('#agenda-items .event-badge').innerText(), /10\/28 開團/);
  await page.locator('#month-next').click();
  assert.equal(await page.locator('#month-label').innerText(), '2026 年 11 月');
  assert.deepEqual(await page.locator('#agenda-items .cal-item h3').allTextContents(), ['下一檔商品']);
  await page.locator('#month-today').click();
  await page.locator('[data-group="closing"] [data-buy-key]').click();
  await page.waitForFunction(() => window.sent.length === 1);
  const destination = new URL(await page.evaluate(() => window.sent[0]));
  assert.equal(destination.origin + destination.pathname, 'https://example.invalid/closing');
  assert.equal(destination.searchParams.get('utm_medium'), 'groupbuy');
  await page.locator('[data-group="open"] [data-remind]').click();
  assert.equal(await page.locator('.reminder-dialog a').count(), 1);
  await page.keyboard.press('Escape');
  assert.deepEqual(errors, []);
  await context.close();

  // The homepage shows the same counts for its 限時開團 and 即將開團 views.
  const home = await open('/', 1440);
  await home.page.locator('#products .product-card[data-product-key="open-1"]').waitFor();
  await home.page.locator('button[data-status="open"]').click();
  assert.match(await home.page.locator('#result-count').innerText(), /^2 件選物/);
  await home.page.locator('button[data-status="upcoming"]').click();
  assert.match(await home.page.locator('#result-count').innerText(), /^1 件選物/);
  await home.context.close();

  for (const width of [320, 1440]) {
    const view = await open('/calendar/', width);
    await view.page.locator('[data-group="open"] .cal-item').first().waitFor();
    assert.equal(await view.page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, `no sideways scroll at ${width}`);
    await view.context.close();
  }

  sheetFails = true;
  const failed = await open('/calendar/', 390);
  await failed.page.locator('#calendar-summary', { hasText: '目前無法取得最新團購資料' }).waitFor();
  assert.equal(await failed.page.locator('[data-buy-key]').count(), 0);
  await failed.context.close();
});
