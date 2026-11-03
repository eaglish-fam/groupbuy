import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const core=createRequire(import.meta.url)('../design/catalog-core.js');
const row=extra=>({品牌:'三富休閒農場',類型:'即將開團',開團日期:'2026-10-26',結束日期:'2026-11-02',連結:'https://example.com/book',...extra});
const key=(r,today)=>core.classify(r,today).key;

test('a row typed 即將開團 is open once its start date arrives and still has a link',()=>{
  assert.equal(key(row(),'2026-10-26'),'open');
  assert.equal(key(row(),'2026-11-02'),'open');
});
test('before the start date the row stays upcoming, after the end date it closes',()=>{
  assert.equal(key(row(),'2026-10-25'),'upcoming');
  assert.equal(key(row(),'2026-11-03'),'closed');
});
test('without a link the launched row is not shown as open',()=>{
  assert.equal(core.classify(row({連結:''}),'2026-10-26').label,'購買入口待確認');
});
test('a row with no dates or only a start date keeps its 即將開團 type',()=>{
  assert.equal(key(row({開團日期:'',結束日期:''}),'2026-10-26'),'upcoming');
  assert.equal(key(row({結束日期:''}),'2026-10-26'),'upcoming');
});
test('announcements from the 即將開團 tab keep their type even inside the window',()=>{
  // normalize() reads the real clock, so the window is built around today (Taipei) instead of fixed dates.
  const day=offset=>new Date(Date.now()+8*36e5+offset*864e5).toISOString().slice(0,10);
  const [item]=core.normalize([row({開團日期:day(-1),結束日期:day(+10)})],true);
  assert.equal(item.status.key,'upcoming');
});

test('a launched row with no link is "purchase link to be confirmed" (the home page and /calendar/ both use classify), never open',()=>{
  const day=core.classify(row({連結:''}),'2026-10-26');
  assert.equal(day.key,'unknown');
  assert.equal(day.label,'購買入口待確認');
});
test('catalog-core.js is loaded with its own cache version on the home page and /calendar/',async()=>{
  const {readFileSync}=await import('node:fs');
  const read=f=>readFileSync(new URL('../'+f,import.meta.url),'utf8');
  assert.match(read('index.html'),/\/design\/catalog-core\.js\?v=20261101-gb015-6/);
  assert.match(read('calendar/index.html'),/\/design\/catalog-core\.js\?v=20261101-gb015-6/);
  assert.match(read('scripts/build-homepage.mjs'),/const catalogCoreRelease = '20261101-gb015-6'/);
});
