// Run against the local preview. Fixtures are intercepted in this isolated
// browser only: nothing is written to a Sheet or shipped as a public preview mode.
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdir } from 'node:fs/promises';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');
const Papa = require('../design/papaparse.min.js');
const out = process.env.FARAWAY_QA_OUTPUT || '/tmp/faraway-qa';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.FARAWAY_BROWSER_EXECUTABLE ? { executablePath: process.env.FARAWAY_BROWSER_EXECUTABLE } : {}),
});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:8767/flights/', { waitUntil: 'networkidle' });
  await page.locator('#product-grid[aria-busy="false"]').waitFor();
  await page.locator('#deal-grid[aria-busy="false"]').waitFor();
  const initialProducts = await page.locator('.product-card').count();
  assert.ok(initialProducts > 0, 'Real published products must render');
  const real = {
    title: await page.title(),
    deals: await page.locator('.deal-card').count(),
    products: await page.locator('#product-count').innerText(),
  };
  await page.screenshot({ path: out + '/desktop-live.png', fullPage: true });
  if (await page.locator('#show-more').isVisible()) {
    await page.locator('#show-more').click();
    assert.ok(await page.locator('.product-card').count() > initialProducts);
  }
  await page.locator('#product-search').fill('東京');
  assert.ok(await page.locator('.product-card').count() > 0);
  await page.locator('[data-product-region="歐洲"]').click();
  assert.equal(await page.locator('.product-card').count(), 0);
  await page.locator('#product-search').fill('');
  assert.ok(await page.locator('.product-card').count() > 0);
  await page.locator('[data-product-region="全部"]').click();
  if (real.deals) {
    await page.locator('.ticket-foot summary').first().click();
    assert.equal(await page.locator('.ticket-foot details[open]').count(), 1);
    await page.locator('.ticket-foot summary').first().click();
  }
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), width);
    await page.screenshot({ path: out + '/mobile-live-' + width + '.png', fullPage: true });
  }
  const fixture = (destination, region) => ({
    status: 'published', review_status: 'approved', origin: 'TPE', destination, region,
    outbound_date: '2026-10-08', inbound_date: '2026-10-12', price_twd: '10970',
    expires_at: '2100-01-01T00:00:00Z', observed_at: '2026-09-13T00:00:00Z',
    search_url: 'https://example.com/ui-test-only', baggage: 'UI 測試・行李待確認',
    source: 'UI 測試，非真實優惠', summary: '版面測試資料，不可訂購',
  });
  await page.route('https://docs.google.com/spreadsheets/**', async route => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('sheet') !== '機票優惠') return route.continue();
    await route.fulfill({ status: 200, contentType: 'text/csv',
      body: Papa.unparse([fixture('NRT', '亞洲'), fixture('JFK', '美國')]) });
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('.deal-card').nth(1).waitFor();
  const cards = await page.locator('.deal-card').all();
  const boxes = await Promise.all(cards.map(c => c.boundingBox()));
  assert.equal(boxes[0].y, boxes[1].y, 'Desktop tickets must be in one row');
  assert.ok(boxes[1].x > boxes[0].x);
  await page.locator('#deals').screenshot({ path: out + '/two-tickets-fixture.png' });
  await page.locator('[data-deal-region="美國"]').click();
  assert.equal(await page.locator('.deal-card').count(), 1);
  await page.locator('[data-deal-region="全部"]').click();
  await page.setViewportSize({ width: 320, height: 844 });
  const smallBoxes = await Promise.all(cards.map(c => c.boundingBox()));
  assert.ok(smallBoxes[1].y > smallBoxes[0].y);
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth), 320);
  await page.route('https://docs.google.com/spreadsheets/**', route => route.abort());
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('[data-retry]').first().waitFor();
  assert.equal(await page.locator('[data-retry]').count(), 2);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ real, screenshots: out, tests: 'real feed, search, filters, more, details, 390/320px, two-column fixture, offline retry', browserErrors: errors }, null, 2));
} finally {
  await browser.close();
}
