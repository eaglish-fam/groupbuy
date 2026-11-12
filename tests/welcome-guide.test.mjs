// 首次來訪引導「你想找什麼？」（Hiram 2026-11-10）：分類、日常、略過；分享連結進來不打擾。
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require = createRequire(import.meta.url);
const read = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const {shouldShow, KEY} = require('../design/welcome-guide.js');
const store = (v) => ({getItem: (k) => (k === KEY ? v : null)});

test('welcome guide shows only on a plain first visit', () => {
  assert.equal(shouldShow({hash: '', search: ''}, store(null)), true);
  assert.equal(shouldShow({hash: '', search: '?utm_source=line'}, store(null)), true);
  assert.equal(shouldShow({hash: '', search: ''}, store('done')), false, 'already answered or skipped');
  assert.equal(shouldShow({hash: '#product-momax-locator', search: ''}, store(null)), false, 'shared product link');
  assert.equal(shouldShow({hash: '#catalog', search: ''}, store(null)), false);
  assert.equal(shouldShow({hash: '#coupon', search: ''}, store(null)), false);
  assert.equal(shouldShow({hash: '', search: '?p=Momax'}, store(null)), false, 'shared ?p= link');
  assert.equal(shouldShow({hash: '', search: ''}, {getItem() { throw new Error('blocked'); }}), false, 'no storage → do not nag');
});

test('homepage ships the guide with categories, 日常, skip and a reopen link', () => {
  const html = read('index.html');
  const dlg = html.match(/<dialog id="welcome-guide"[\s\S]*?<\/dialog>/)?.[0];
  assert.ok(dlg, 'dialog present');
  assert.match(dlg, /你想找什麼？/);
  for (const c of ['母嬰', '食品', '居家', '旅遊', '3C 家電'])
    assert.match(dlg, new RegExp(`data-category="${c}" data-welcome-choice="${c}"`), c);
  assert.match(dlg, /data-category="" data-welcome-choice="all"><strong>全部好物</);
  assert.match(dlg, /<a class="welcome-everyday" href="\/everyday\/"/);
  assert.match(dlg, /data-welcome-skip>先自己逛逛</);
  assert.match(html, /class="welcome-reopen" data-welcome-open>✦ 幫我找：你想找什麼？</);
  assert.match(html, /class="welcome-reopen-chip" data-welcome-open[^>]*>✦ 幫我找</, 'phones: the chip');
  assert.ok(html.indexOf('welcome-reopen-chip') < html.indexOf('<button data-category="食品">'), 'phones: 幫我找 is the first chip');
  assert.doesNotMatch(read('design/welcome-guide.js'), /setTimeout\(open/, 'no automatic popup (Hiram 11/12: opens when tapped)');
  assert.match(html, /\/design\/welcome-guide\.js\?v=20261112-help-everyday/);
  assert.match(html, /\/design\/welcome-guide\.css\?v=20261112-help-everyday/);
});

test('a first-time visitor picks a category, skips, or reopens the guide', {timeout: 90_000}, async (t) => {
  const {loadBrowserRuntime} = await import('./browser-runtime.mjs');
  const runtime = await loadBrowserRuntime();
  if (!runtime) return t.skip('Playwright is unavailable');
  const http = await import('node:http');
  const {existsSync, statSync} = await import('node:fs');
  const {resolve, extname} = await import('node:path');
  const root = resolve(import.meta.dirname, '..');
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
  const csv = ['品牌,商品ID,連結,類型,開團日期,結束日期,商品描述,方案詳情,圖片網址,分類',
    '奶瓶,b1,https://example.invalid/a,長期,,,說明,,,母嬰',
    '果乾,f1,https://example.invalid/b,長期,,,說明,,,食品'].join('\n');
  const browser = await runtime.rawChromium.launch({headless: true, executablePath: runtime.executablePath});
  t.after(async () => { await browser.close(); server.close(); });
  const open = async (path, width) => {
    const context = await browser.newContext({viewport: {width, height: 800}, serviceWorkers: 'block'});
    await context.route('**/*', (route) => {
      const url = new URL(route.request().url());
      if (url.hostname === 'docs.google.com') return route.fulfill({contentType: 'text/csv', body: csv});
      if (url.origin === base) return route.continue();
      return route.fulfill({status: 204, body: ''});
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(base + path, {waitUntil: 'load'});
    return {page, context, errors};
  };
  const dialog = (page) => page.locator('#welcome-guide');

  // Phone, first visit: no popup; the orange 幫我找 chip opens it.
  const {page, context, errors} = await open('/', 390);
  await page.waitForTimeout(1200);
  assert.equal(await dialog(page).isVisible(), false, 'no automatic popup');
  const chip = page.locator('.category-links .welcome-reopen-chip');
  assert.equal(await chip.evaluate((b) => getComputedStyle(b).backgroundColor), 'rgb(168, 76, 43)', 'orange chip');
  assert.equal(await chip.evaluate((b) => getComputedStyle(b).borderStyle), 'none', 'not dashed');
  await chip.click();
  await dialog(page).waitFor({state: 'visible'});
  assert.equal(await page.evaluate(() => document.activeElement?.dataset.welcomeChoice), '母嬰');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
  const box = await dialog(page).boundingBox();
  assert.ok(box.width <= 390 && box.height <= 800, 'fits a phone screen');
  // Phones: the carousel is the hero, the tagline block is visually gone but the h1 remains.
  assert.equal(await page.locator('#hero-title').count(), 1);
  assert.ok((await page.locator('.hero-copy').boundingBox()).height <= 1, 'hero tagline hidden on phones');
  // Picking 母嬰 closes the guide and filters the catalogue.
  await page.locator('#welcome-guide [data-welcome-choice="母嬰"]').click();
  assert.equal(await dialog(page).isVisible(), false);
  await page.waitForFunction(() => document.querySelector('#category')?.value === '母嬰');
  assert.equal(await page.locator('#category').inputValue(), '母嬰');
  // The 鷹家日常 banner is right under the chips.
  assert.equal(await page.locator('a.everyday-banner[href="/everyday/"]').isVisible(), true);
  await page.locator('[data-welcome-open]:visible').click();
  await dialog(page).waitFor({state: 'visible'});
  await page.keyboard.press('Escape');
  assert.equal(await dialog(page).isVisible(), false);
  assert.deepEqual(errors, []);
  await context.close();

  // Desktop: no popup; the orange button opens it; skip closes it.
  const desk = await open('/', 1440);
  await desk.page.waitForTimeout(1200);
  assert.equal(await dialog(desk.page).isVisible(), false);
  await desk.page.locator('.discovery .welcome-reopen').click();
  await dialog(desk.page).waitFor({state: 'visible'});
  await desk.page.locator('[data-welcome-skip]').click();
  assert.equal(await dialog(desk.page).isVisible(), false);
  assert.ok((await desk.page.locator('.hero-copy').boundingBox()).height > 100, 'desktop keeps the hero tagline');
  assert.equal(await desk.page.locator('.content-nav a.nav-everyday[href="/everyday/"]').isVisible(), true);
  await desk.context.close();

  // A shared product link never shows the guide.
  const shared = await open('/?p=%E5%A5%B6%E7%93%B6', 390);
  await shared.page.waitForTimeout(900);
  assert.equal(await dialog(shared.page).isVisible(), false);
  await shared.context.close();
});
