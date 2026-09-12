import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../flights/index.html', import.meta.url), 'utf8');
const js = readFileSync(new URL('../flights/flights.js', import.meta.url), 'utf8');
const model = readFileSync(new URL('../flights/flights-model.js', import.meta.url), 'utf8');
const appsScript = readFileSync(new URL('../flights-pipeline/apps-script/Code.gs', import.meta.url), 'utf8');

test('flights page has an indexable canonical consumer entry', () => {
  assert.match(html, /<link rel="canonical" href="https:\/\/www\.eaglish\.store\/flights\/"/);
  assert.match(html, /<meta name="robots" content="index,follow,max-image-preview:large"/);
  assert.equal((html.match(/<h1>/g) || []).length, 1);
});

test('Apps Script bridge keeps the catalog URL out of cells and has no automatic trigger', () => {
  assert.match(appsScript, /PropertiesService\.getScriptProperties\(\)/);
  assert.match(appsScript, /syncKlookCatalogOnDemand/);
  assert.doesNotMatch(appsScript, /newTrigger\s*\(/);
  assert.doesNotMatch(appsScript, /KLOOK_CATALOG_URL\s*:\s*['"]https:/);
});

test('flights page reads approved fare and published activity sheets', () => {
  assert.match(js, /getRows\('機票優惠'\)/);
  assert.match(js, /getRows\('旅遊商品'\)/);
  assert.match(model, /row\.review_status === 'approved'/);
  assert.match(model, /row\.status === 'published'/);
  assert.match(js, /rel="sponsored noopener"/);
});

test('flights page labels empty and reference-price states honestly', () => {
  assert.match(js, /目前沒有仍在有效時間內的機票/);
  assert.match(js, /Klook 目錄參考價起/);
  assert.match(html, /價格變動時請到供應商重新確認/);
});
