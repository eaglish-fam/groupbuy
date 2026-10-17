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
test('campaigns ending within a week come first in the default view, soonest first', () => {
  const now = Date.parse('2026-10-17T12:00:00+08:00');
  const list = [item('mid', false, '2026-10-30'), item('E1', true), item('knsh', false, '2026-10-22'), item('E2', true), item('parakito', false, '2026-10-21'), item('far', false, '2026-11-20')];
  // 10/21 and 10/22 are within 7 days; 10/30 and 11/20 are not and keep the old alternation.
  assert.deepEqual(ids(sort(list, 'all', 'recommended', now)), ['parakito', 'knsh', 'mid', 'E1', 'far', 'E2']);
});
test('a campaign ending today still counts as ending soon, an ended one does not', () => {
  const now = Date.parse('2026-10-17T12:00:00+08:00');
  const list = [item('later', false, '2026-10-19'), item('E1', true), item('today', false, '2026-10-17'), item('gone', false, '2026-10-10')];
  assert.deepEqual(ids(sort(list, 'all', 'recommended', now)), ['today', 'later', 'gone', 'E1']);
});
test('other views and explicit sorting are not changed by the ending-soon rule', () => {
  const now = Date.parse('2026-10-17T12:00:00+08:00');
  const list = [item('far', false, '2026-11-20'), item('E1', true), item('soon', false, '2026-10-21')];
  assert.deepEqual(ids(sort(list, 'open', 'recommended', now)), ['soon', 'far', 'E1']);
  assert.deepEqual(ids(sort(list, 'long', 'recommended', now)), ['far', 'E1', 'soon']);
  assert.deepEqual(ids(sort(list, 'all', 'closing', now)), ['soon', 'far', 'E1']);
});
test('card countdown says how many days are left, then hours on the last day', () => {
  const count = vm.runInNewContext(source.slice(source.indexOf('function countdownText('), source.indexOf('function timedCampaign(')) + '; countdownText');
  const at = value => Date.parse(value);
  assert.equal(count('2026-10-21', at('2026-10-17T12:00:00+08:00')), '剩 4 天');
  assert.equal(count('2026-10-18', at('2026-10-17T12:00:00+08:00')), '剩 1 天');
  assert.equal(count('2026-10-17', at('2026-10-17T12:00:00+08:00')), '最後 12 小時 0 分');
  assert.equal(count('2026-10-17', at('2026-10-17T23:30:00+08:00')), '最後 0 小時 30 分');
  assert.equal(count('2026-10-10', at('2026-10-17T12:00:00+08:00')), '本次已結團');
});
