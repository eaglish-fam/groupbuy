import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
const source = readFileSync(new URL('../design/design.js', import.meta.url), 'utf8');
const fn = source.slice(source.indexOf('function sortCatalog('), source.indexOf('function setStatus('));
const sort = vm.runInNewContext(fn + '; sortCatalog');
const item = (id, long, end = '', featured = false) => ({ id, status: { long, key: 'open' }, end, featured });
const rows = [item('late', false, '2026-09-30'), item('Meroware', true), item('early', false, '2026-09-11'), item('long2', true, '', true), item('middle', false, '2026-09-20')];
const ids = list => Array.from(list, p => p.id);
test('default alternates closing-date timed products and Sheet-order evergreen products', () => {
  assert.deepEqual(ids(sort(rows, 'all', 'recommended')), ['early', 'Meroware', 'middle', 'long2', 'late']);
  assert.deepEqual(ids(rows), ['late', 'Meroware', 'early', 'long2', 'middle']);
});
test('individual categories, empty sides, ties and pagination remain stable', () => {
  const timed = rows.filter(p => !p.status.long), long = rows.filter(p => p.status.long);
  assert.deepEqual(ids(sort(timed, 'open', 'recommended')), ['early', 'middle', 'late']);
  assert.deepEqual(ids(sort(long, 'long', 'recommended')), ['Meroware', 'long2']);
  assert.deepEqual(ids(sort(long, 'all', 'recommended')), ['Meroware', 'long2']);
  assert.deepEqual(ids(sort([], 'all', 'recommended')), []);
  assert.deepEqual(ids(sort([item('a', false, '2026-09-11'), item('b', false, '2026-09-11')], 'all', 'recommended')), ['a', 'b']);
  const full = sort(rows, 'all', 'recommended');
  assert.deepEqual(ids([...full.slice(0, 2), ...full.slice(2)]), ids(full));
});
test('explicit user sort still overrides default and default/reset expose active products only', () => {
  assert.deepEqual(ids(sort(rows, 'all', 'closing')), ['early', 'middle', 'late', 'Meroware', 'long2']);
  assert.match(source, /currentStatus = "all"/);
  assert.match(source, /currentStatus === "all" \? !p.kind && p.status.key === "open"/);
  const html = readFileSync(new URL('../design/index.html', import.meta.url), 'utf8');
  assert.match(html, /data-status="all" aria-pressed="true">全部商品/);
});
