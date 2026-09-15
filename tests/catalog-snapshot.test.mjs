import assert from 'node:assert/strict';
import test from 'node:test';

import { normalizeSnapshot, snapshotCards, SHEET } from '../scripts/catalog-snapshot.mjs';

const HEADERS = ['品牌', '連結', '類型', '開團日期', '結束日期', '商品描述', '分類', '庫存狀態'];

function csvField(value) {
  return /[",\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function toCsv(rows) {
  return [HEADERS, ...rows].map((row) => row.map(csvField).join(',')).join('\n');
}

function longTermRow({ brand, description, category = '居家', link = 'https://example.com/checkout?coupon=SAVE10' }) {
  return [brand, link, '長期好物', '', '', description, category, ''];
}

test('normalizes a valid long-running CSV without leaking the checkout/coupon link column', () => {
  const rows = Array.from({ length: 6 }, (_, i) => longTermRow({ brand: `品項${i}`, description: `描述文字 ${i}` }));
  const snapshot = normalizeSnapshot(toCsv(rows), '2026-09-15T00:00:00.000Z');

  assert.equal(snapshot.version, 1);
  assert.equal(snapshot.items.length, 6);
  assert.ok(snapshot.source.includes(SHEET));
  for (const item of snapshot.items) {
    assert.deepEqual(Object.keys(item).sort(), ['article', 'brand', 'category', 'description', 'id', 'image'].sort());
    assert.ok(!('連結' in item));
    assert.ok(!JSON.stringify(item).includes('checkout'));
    assert.ok(!JSON.stringify(item).includes('coupon'));
  }
});

test('handles CSV quoting/escaping and escapes the rendered card safely', () => {
  const description = '含 , 逗號與"引號" 的描述 <script>';
  const rows = [
    ...Array.from({ length: 5 }, (_, i) => longTermRow({ brand: `品項${i}`, description: `描述文字 ${i}` })),
    longTermRow({ brand: '特殊字元商品', description }),
  ];
  const snapshot = normalizeSnapshot(toCsv(rows), '2026-09-15T00:00:00.000Z');
  const item = snapshot.items.find((x) => x.brand === '特殊字元商品');
  assert.equal(item.description, description);

  const html = snapshotCards(snapshot);
  assert.ok(html.includes('&quot;引號&quot;'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
});

test('rejects an error/login page body instead of parsing it as CSV', () => {
  assert.throws(() => normalizeSnapshot('<html><body>Sign in required</body></html>'), /Expected CSV/);
});

test('rejects a CSV missing a required Sheet header', () => {
  const rows = Array.from({ length: 6 }, (_, i) => [`品項${i}`, '', '長期好物', '', '一段描述', '居家']);
  const badHeaders = ['品牌', '連結', '類型', '開團日期', '商品描述', '分類'];
  const csv = [badHeaders, ...rows].map((row) => row.map(csvField).join(',')).join('\n');
  assert.throws(() => normalizeSnapshot(csv), /Unexpected Sheet headers/);
});

test('guards against an unexpectedly empty catalogue instead of publishing a near-empty snapshot', () => {
  const rows = [
    longTermRow({ brand: '品項A', description: '描述A' }),
    longTermRow({ brand: '品項B', description: '描述B' }),
  ];
  assert.throws(() => normalizeSnapshot(toCsv(rows), '2026-09-15T00:00:00.000Z'), /Unexpectedly empty/);
});
