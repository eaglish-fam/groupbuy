import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, resolve } from 'node:path';
import vm from 'node:vm';

const root = resolve(import.meta.dirname, '..');
const source = readFileSync(resolve(root, 'design/design.js'), 'utf8');
const css = readFileSync(resolve(root, 'design/design.css'), 'utf8');
const productContent = (await import('../product-content.js')).default;
const playwrightPath = '/Users/zosia/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
const brands = {
  A: '六福莊住宿 A｜樂園無限玩',
  B: '六福莊住宿 B｜經典探險',
  C: '六福莊住宿 C｜FUN肆玩樂季',
};
const urls = {
  A: 'https://pse.is/9p7sug',
  B: 'https://pse.is/9p7svd',
  C: 'https://pse.is/9p7svv',
};

function homepageHelpers() {
  const constants = source.slice(
    source.indexOf('const LEOFOO_PLANS'),
    source.indexOf('const catalogueFallback'),
  );
  const helpers = source.slice(
    source.indexOf('function leofooPlanFor('),
    source.indexOf('function leofooCard('),
  );
  return vm.runInNewContext(`${constants}\n${helpers}\n({ LEOFOO_PLANS, groupLeofooForDisplay, applyLeofooCampaignStatus, leofooGroupStatus })`);
}

test('Leofoo display grouping retains the three actual normalized products and display counts', () => {
  const { groupLeofooForDisplay, applyLeofooCampaignStatus } = homepageHelpers();
  const products = [
    { brand: '其他商品', key: 'other', status: { key: 'open', label: '限時開團' } },
    ...Object.entries(brands).map(([code, brand]) => ({
      brand,
      key: `leofoo-${code.toLowerCase()}`,
      status: { key: 'open', label: '限時開團' },
    })),
  ];
  const displayed = groupLeofooForDisplay(products, products);
  assert.equal(displayed.length, 2);
  assert.equal(displayed[1].product, products[1]);
  assert.deepEqual(Array.from(displayed[1].leofooPlans, p => p.key), ['leofoo-a', 'leofoo-b', 'leofoo-c']);
  assert.ok(displayed[1].leofooPlans.every(p => products.includes(p)));

  for (const [missingIndex, missingCode] of ['A', 'B', 'C'].entries()) {
    const incomplete = products.filter(product => product.key !== `leofoo-${missingCode.toLowerCase()}`);
    const group = groupLeofooForDisplay(incomplete, incomplete).find(item => item.leofooPlans.length);
    assert.ok(group, `missing ${missingCode} still renders one group`);
    assert.equal(group.leofooPlans.length, 3);
    assert.equal(group.leofooPlans[missingIndex], undefined);
    assert.equal(group.product, missingCode === 'A' ? incomplete[1] : products[1]);
    assert.ok(group.leofooPlans.filter(Boolean).every(product => incomplete.includes(product)));
  }

  const mixed = products.slice(1);
  mixed[0].status = { key: 'closed', label: '本次已結團' };
  mixed[1].status = { key: 'open', label: '限時開團' };
  mixed[2].status = { key: 'closed', label: '本次已結團' };
  const mixedGroup = groupLeofooForDisplay([mixed[1]], mixed)[0];
  assert.equal(mixedGroup.product, mixed[0]);
  assert.equal(homepageHelpers().leofooGroupStatus(mixedGroup.matchedLeofooPlans).key, 'open');

  const rows = Object.entries(brands).map(([code, brand]) => ({
    品牌: brand,
    連結: urls[code],
    類型: '短期',
    開團日期: '2026-10-02',
    結束日期: '2026-10-08',
  }));
  const duplicateCampaign = productContent.campaignFor([...rows, rows[0]], 'leofoo', '2026-10-02');
  applyLeofooCampaignStatus(products, duplicateCampaign);
  assert.equal(products[1].status.key, 'unknown');
  assert.equal(products[2].status.key, 'open');
  assert.equal(products[3].status.key, 'open');
});

test('Leofoo homepage markup keeps exact links, modal defaults and accessibility sizing contracts', () => {
  assert.match(source, /data-detail="\$\{products\.indexOf\(product\)\}"/);
  assert.doesNotMatch(source, /data-detail="-1"/);
  assert.match(source, />前往方案 A<\/a>/);
  assert.match(source, /href="\/blog\/leofoo\/">閱讀選房指南<\/a>/);
  assert.match(source, /p\.article\?\.id === "leofoo"[\s\S]*?name === "方案詳情"/);
  const loadSource = source.slice(source.indexOf('async function performLoad()'), source.indexOf('function load()'));
  assert.match(loadSource, /const rows = await fetchRows\("現正開團"\)/);
  assert.doesNotMatch(loadSource, /即將開團/);
  assert.ok(loadSource.indexOf('ProductContent.campaignFor(rows, "leofoo")') < loadSource.indexOf('normalize(rows)'));
  assert.match(css, /\.leofoo-plan-titles\s*\{[\s\S]*?gap:\s*8px/);
  assert.match(css, /\.leofoo-plan-title\s*\{[\s\S]*?min-height:\s*44px/);
  assert.match(css, /\.leofoo-plan-title:focus-visible/);
  assert.match(css, /\.leofoo-plan-title:disabled\s*\{[\s\S]*?cursor:\s*default[\s\S]*?opacity:/);
  assert.match(css, /\.leofoo-card \.product-bottom \.card-reading,[\s\S]*?\.leofoo-card \.product-bottom \.card-calendar\s*\{[\s\S]*?min-height:\s*44px/);
});

test('Leofoo family aliases and exact plan deep links work in the homepage browser UI', { timeout: 45_000 }, async t => {
  if (!existsSync(playwrightPath)) return t.skip('bundled Playwright is unavailable');
  const { chromium } = await import(playwrightPath);
  const mime = {
    '.css': 'text/css', '.html': 'text/html', '.js': 'text/javascript',
    '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml',
    '.webp': 'image/webp', '.woff2': 'font/woff2',
  };
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, 'http://local');
    let file = resolve(root, `.${url.pathname}`);
    if (!file.startsWith(root) || !existsSync(file)) {
      response.statusCode = 404;
      return response.end();
    }
    if (statSync(file).isDirectory()) file = resolve(file, 'index.html');
    response.setHeader('Content-Type', mime[extname(file)] || 'application/octet-stream');
    response.setHeader('Cache-Control', 'no-store');
    response.end(readFileSync(file));
  });
  await new Promise(resolveListen => server.listen(0, '127.0.0.1', resolveListen));
  const base = `http://127.0.0.1:${server.address().port}`;
  let duplicateA = false;
  let missingCode = '';
  const requestedTabs = [];
  const header = ['品牌', '商品ID', '連結', '類型', '開團日期', '結束日期', '商品描述', '方案詳情', '圖片網址', '分類'];
  const planRows = Object.entries(brands).map(([code, brand]) => [
    brand, `leofoo-${code.toLowerCase()}`, urls[code], '短期', '2026-10-02', '2026-10-08',
    `${code} 方案說明`, `${code} 方案完整細節`, '/assets/leofoo/product-card.webp', '親子旅行',
  ]);
  const csv = rows => rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n');
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, serviceWorkers: 'block' });
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.hostname === 'docs.google.com') {
      requestedTabs.push(url.searchParams.get('sheet'));
      const availablePlans = planRows.filter((_, index) => ['A', 'B', 'C'][index] !== missingCode);
      // Match Google gviz: an unknown sheet name can silently mirror sheet 0.
      // The homepage must therefore never request a guessed secondary tab.
      const rows = [...availablePlans, ...(duplicateA ? [planRows[0]] : []), ['其他商品', 'other', 'https://example.invalid/other', '長期', '', '', '其他說明', '', '', '其他']];
      return route.fulfill({ contentType: 'text/csv', body: csv([header, ...rows]) });
    }
    if (url.origin === base) return route.continue();
    if (['image', 'font', 'media'].includes(route.request().resourceType())) return route.abort();
    return route.fulfill({ status: 204, body: '' });
  });
  const page = await context.newPage();
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.clock.install({ time: new Date('2026-10-02T04:00:00Z') });

  try {
    await page.goto(`${base}/?p=${encodeURIComponent('六福莊')}`, { waitUntil: 'domcontentloaded' });
    await page.locator('#product-leofoo').waitFor();
    assert.deepEqual([...new Set(requestedTabs)], ['現正開團']);
    assert.equal(await page.locator('#products .leofoo-card').count(), 1);
    assert.equal(await page.locator('#product-leofoo .leofoo-plan-title').count(), 3);
    assert.deepEqual(await page.locator('#product-leofoo .leofoo-plan-title').allTextContents(), [
      'A｜二天一夜・樂園', 'B｜二天一夜・動物體驗', 'C｜三天二夜・晚餐 DIY',
    ]);
    assert.deepEqual(await page.locator('#product-leofoo .leofoo-plan-title').evaluateAll(buttons => buttons.map(button => {
      const index = Number(button.dataset.detail);
      return { index, brand: products[index]?.brand, actual: index >= 0 && products[index] != null };
    })), [
      { index: 0, brand: '六福莊住宿 A｜樂園無限玩', actual: true },
      { index: 1, brand: '六福莊住宿 B｜經典探險', actual: true },
      { index: 2, brand: '六福莊住宿 C｜FUN肆玩樂季', actual: true },
    ]);
    assert.equal(await page.locator('#product-leofoo [data-buy-key]').innerText(), '前往方案 A');
    assert.equal(new URL(await page.locator('#product-leofoo [data-buy-key]').getAttribute('href')).href, urls.A);
    assert.equal(await page.locator('#product-leofoo a.card-reading').getAttribute('href'), '/blog/leofoo/');
    assert.equal(await page.locator('#result-count').innerText(), '1 件選物');
    assert.match(await page.locator('#browse-progress').innerText(), /1／1/);
    await page.evaluate(() => { query = ''; document.querySelector('#search').value = ''; render(); });
    assert.equal(await page.locator('#result-count').innerText(), '2 件選物');
    assert.match(await page.locator('#browse-progress').innerText(), /2／2/);

    const geometry = await page.locator('#product-leofoo .leofoo-plan-title').evaluateAll(buttons => buttons.map((button, index) => {
      const box = button.getBoundingClientRect();
      const previous = index ? buttons[index - 1].getBoundingClientRect() : null;
      return { height: box.height, gap: previous ? box.top - previous.bottom : null };
    }));
    assert.ok(geometry.every(item => item.height >= 44));
    assert.ok(geometry.slice(1).every(item => item.gap >= 8));
    assert.ok(await page.locator('#product-leofoo .card-reading').evaluate(link => link.getBoundingClientRect().height >= 44));
    assert.ok(await page.locator('#product-leofoo .card-calendar').evaluate(button => button.getBoundingClientRect().height >= 44));
    await page.locator('#product-leofoo .leofoo-plan-title').nth(1).focus();
    assert.notEqual(await page.locator('#product-leofoo .leofoo-plan-title').nth(1).evaluate(button => getComputedStyle(button).outlineStyle), 'none');

    await page.locator('#product-leofoo .leofoo-plan-title').nth(1).click();
    assert.equal(await page.locator('#detail-title').innerText(), brands.B);
    assert.equal(await page.locator('.detail-sections details[open] summary').innerText(), '方案詳情');
    await page.keyboard.press('Escape');

    await page.evaluate(() => { saved.add('leofoo-b'); updateSaved(); showSaved(); });
    assert.equal(await page.locator('#products .leofoo-card').count(), 1);
    assert.equal(await page.locator('#product-leofoo .leofoo-plan-title').count(), 3);
    assert.equal(await page.locator('#product-leofoo [data-buy-key]').count(), 0);

    for (const width of [320, 375, 390, 768]) {
      await page.setViewportSize({ width, height: 900 });
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.setViewportSize({ width: 844, height: 390 });
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));

    await page.goto(`${base}/?p=${encodeURIComponent(brands.C)}`, { waitUntil: 'domcontentloaded' });
    await page.locator('#product-dialog[open]').waitFor();
    assert.equal(await page.locator('#detail-title').innerText(), brands.C);

    await page.goto(`${base}/#product-leofoo`, { waitUntil: 'domcontentloaded' });
    await page.locator('#product-leofoo').waitFor();
    assert.equal(await page.locator('#product-leofoo .leofoo-plan-title').count(), 3);

    await page.evaluate(() => {
      products.find(product => product.brand === '六福莊住宿 A｜樂園無限玩').status = { key: 'closed', label: '本次已結團', long: false };
      products.find(product => product.brand === '六福莊住宿 B｜經典探險').status = { key: 'open', label: '限時開團', long: false };
      products.find(product => product.brand === '六福莊住宿 C｜FUN肆玩樂季').status = { key: 'closed', label: '本次已結團', long: false };
      query = '六福莊';
      document.querySelector('#search').value = query;
      setStatus('all');
    });
    assert.equal(await page.locator('#product-leofoo .status').innerText(), '仍有方案開團');
    assert.equal(await page.locator('#product-leofoo [data-buy-key]').count(), 0);
    assert.equal(await page.locator('#product-leofoo [data-plan-code="B"]').isEnabled(), true);
    await page.evaluate(() => setStatus('closed'));
    assert.equal(await page.locator('#product-leofoo .status').innerText(), '本次已結團');
    assert.equal(await page.locator('#product-leofoo [data-buy-key]').count(), 0);

    for (const code of ['A', 'B', 'C']) {
      missingCode = code;
      await page.goto(`${base}/?p=${encodeURIComponent('六福莊')}`, { waitUntil: 'domcontentloaded' });
      await page.locator('#product-leofoo').waitFor();
      const buttons = page.locator('#product-leofoo .leofoo-plan-title');
      assert.equal(await buttons.count(), 3);
      const missing = page.locator(`#product-leofoo [data-plan-code="${code}"]`);
      assert.equal(await missing.isDisabled(), true);
      assert.equal(await missing.getAttribute('data-detail'), null);
      assert.match(await missing.innerText(), /資料待確認/);
      assert.ok(await buttons.evaluateAll(items => items.filter(item => !item.disabled).every(item => {
        const index = Number(item.dataset.detail);
        return index >= 0 && products[index] != null;
      })));
      assert.equal(await page.locator('#product-leofoo .status').innerText(), '仍有方案開團');
      assert.equal(await page.locator('#product-leofoo [data-buy-key]').count(), code === 'A' ? 0 : 1);
    }

    missingCode = '';
    duplicateA = true;
    await page.evaluate(() => load());
    assert.equal(await page.locator('#product-leofoo [data-buy-key]').count(), 0);
    assert.equal(await page.locator('#product-leofoo .leofoo-plan-title').count(), 3);
    assert.equal(await page.evaluate(() => products.find(product => product.brand === '六福莊住宿 A｜樂園無限玩').status.key), 'unknown');
    assert.deepEqual([...new Set(requestedTabs)], ['現正開團']);
    assert.deepEqual(pageErrors, []);
  } finally {
    await context.close();
    await browser.close();
    await new Promise(resolveClose => server.close(resolveClose));
  }
});
