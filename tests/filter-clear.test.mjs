// 篩選後要有明顯的橘色「清除篩選，看全部商品」（Hiram 2026-11-11）。
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {existsSync, readFileSync, statSync} from 'node:fs';
import {resolve, extname} from 'node:path';
import {loadBrowserRuntime} from './browser-runtime.mjs';
const root = resolve(import.meta.dirname, '..');

test('homepage ships an orange clear-filters bar, hidden until something is filtered', () => {
  const html = readFileSync(resolve(root, 'index.html'), 'utf8');
  assert.match(html, /<div class="active-filters" id="active-filters" hidden>[\s\S]*?data-reset-filters>✕ 清除篩選，看全部商品<\/button>/);
  const css = readFileSync(resolve(root, 'design/design.css'), 'utf8');
  assert.match(css, /\.filter-clear \{[^}]*background: var\(--orange\)/);
});

test('filtering shows what is filtered; one click brings back every product', {timeout: 90_000}, async (t) => {
  const runtime = await loadBrowserRuntime();
  if (!runtime) return t.skip('Playwright is unavailable');
  const mime = {'.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml'};
  const server = http.createServer((req, res) => {
    let file = resolve(root, `.${decodeURIComponent(new URL(req.url, 'http://x').pathname)}`);
    if (!file.startsWith(root) || !existsSync(file)) { res.statusCode = 404; return res.end(); }
    if (statSync(file).isDirectory()) file = resolve(file, 'index.html');
    res.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    res.end(readFileSync(file));
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  const base = `http://127.0.0.1:${server.address().port}`;
  const csv = ['品牌,商品ID,連結,類型,開團日期,結束日期,商品描述,方案詳情,圖片網址,分類,國家',
    '奶瓶,b1,https://example.invalid/a,長期,,,說明,,,母嬰,日本',
    '果乾,f1,https://example.invalid/b,長期,,,說明,,,食品,台灣',
    '枕頭,h1,https://example.invalid/c,長期,,,說明,,,居家,台灣'].join('\n');
  const browser = await runtime.chromium.launch({headless: true, executablePath: runtime.executablePath});
  t.after(async () => { await browser.close(); server.close(); });
  for (const width of [390, 1440]) {
    const context = await browser.newContext({viewport: {width, height: 900}, serviceWorkers: 'block'});
    await context.route('**/*', (route) => {
      const url = new URL(route.request().url());
      if (url.hostname === 'docs.google.com') return route.fulfill({contentType: 'text/csv', body: csv});
      if (url.origin === base) return route.continue();
      return route.fulfill({status: 204, body: ''});
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(base + '/#catalog', {waitUntil: 'load'});
    await page.waitForFunction(() => /^3 件選物/.test(document.querySelector('#result-count')?.textContent || ''));
    const bar = page.locator('#active-filters');
    assert.equal(await bar.isVisible(), false, `${width}: no bar before filtering`);
    await page.selectOption('#category', '母嬰');
    await bar.waitFor({state: 'visible'});
    assert.equal(await page.locator('#active-filters-label').innerText(), '母嬰');
    await page.fill('#search', '奶');
    assert.equal(await page.locator('#active-filters-label').innerText(), '母嬰・「奶」');
    const color = await page.locator('#active-filters .filter-clear').evaluate((b) => getComputedStyle(b).backgroundColor);
    assert.equal(color, 'rgb(168, 76, 43)', 'our orange');
    assert.equal(await page.locator('#active-filters .filter-clear').evaluate((b) => getComputedStyle(b).borderRadius), '3px', 'same corner as the site buttons (Hiram 11/12)');
    await page.locator('#active-filters .filter-clear').click();
    await bar.waitFor({state: 'hidden'});
    assert.match(await page.locator('#result-count').innerText(), /^3 件選物$/);
    assert.equal(await page.locator('#category').inputValue(), '');
    assert.equal(await page.locator('#search').inputValue(), '');
    // A tab other than 全部商品 counts as a filter too; an empty result offers the same button.
    await page.locator('.status-tabs [data-status="upcoming"]').click();
    assert.equal(await page.locator('#active-filters-label').innerText(), '即將開團');
    await page.locator('#products #reset-filters.filter-clear').click();
    await bar.waitFor({state: 'hidden'});
    assert.equal(await page.locator('.status-tabs [data-status="all"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    await context.close();
  }
});
