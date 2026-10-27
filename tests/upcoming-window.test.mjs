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
  const [item]=core.normalize([row()],true);
  assert.equal(item.status.key,'upcoming');
});
