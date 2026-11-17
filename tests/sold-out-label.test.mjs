import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const core=createRequire(import.meta.url)('../design/catalog-core.js');
const row=extra=>({品牌:'Happymoon',類型:'賣完為止',開團日期:'2026-10-01',結束日期:'2026-10-31',連結:'https://example.com/hm',...extra});
const c=(r,today)=>core.classify(r,today);

test('a 賣完為止 row stays open after its end date and says 賣完為止',()=>{
 const s=c(row(),'2026-11-03');
 assert.deepEqual([s.key,s.label,s.long,s.soldOut],['open','賣完為止',false,true]);
});
test('a 賣完為止 row with no dates at all is open too, not "檔期待確認"',()=>{
 assert.equal(c(row({開團日期:'',結束日期:''}),'2026-11-03').key,'open');
});
test('the type may carry other words: 長期賣完為止 is still a sold-out-based drop, not an evergreen one',()=>{
 const s=c(row({類型:'長期，賣完為止'}),'2026-11-03');
 assert.deepEqual([s.key,s.long,s.soldOut],['open',false,true]);
});
test('sold out stock, a closed type, a missing link, a future start and a bad date still win',()=>{
 assert.equal(c(row({庫存狀態:'售完'}),'2026-11-03').label,'目前已售完');
 assert.equal(c(row({類型:'長期，賣完為止',庫存狀態:'售完'}),'2026-11-03').long,false,'sold out stock keeps it out of the evergreen group too');
 assert.equal(c(row({類型:'結團，賣完為止'}),'2026-11-03').key,'closed');
 assert.equal(c(row({連結:''}),'2026-11-03').label,'購買入口待確認');
 assert.equal(c(row({開團日期:'2026-12-01',結束日期:'2026-12-31'}),'2026-11-03').key,'upcoming');
 assert.equal(c(row({結束日期:'not a date'}),'2026-11-03').key,'unknown');
});
test('every other kind of row is classified exactly as before',()=>{
 const base={品牌:'X',連結:'https://example.com/x'};
 const cases=[
  [{類型:'短期',開團日期:'2026-11-01',結束日期:'2026-11-08'},'2026-11-03','open','限時開團'],
  [{類型:'短期',開團日期:'2026-11-01',結束日期:'2026-11-08'},'2026-11-09','closed','本次已結團'],
  [{類型:'長期',開團日期:'',結束日期:''},'2026-11-03','open','常駐開團'],
  [{類型:'長期',開團日期:'2026-10-01',結束日期:'2026-10-31'},'2026-11-03','closed','當期連結待更新'],
  [{類型:'即將開團',開團日期:'2026-11-10',結束日期:'2026-11-20'},'2026-11-03','upcoming','即將開團'],
  [{類型:'結團'},'2026-11-03','closed','本次已結團'],
  [{類型:'短期',開團日期:'2026-11-01',結束日期:'2026-11-08',庫存狀態:'售完'},'2026-11-03','closed','目前已售完'],
  [{類型:'短期'},'2026-11-03','unknown','檔期待確認'],
  [{類型:'折扣碼'},'2026-11-03','open','限時開團'],
  [{類型:'長期',開團日期:'',結束日期:'',連結:''},'2026-11-03','unknown','購買入口待確認']
 ];
 for(const [extra,today,key,label] of cases){
  const s=c({...base,...extra},today);
  assert.deepEqual([s.key,s.label],[key,label],JSON.stringify(extra)+' @'+today);
  assert.ok(!s.soldOut,'only 賣完為止 rows carry soldOut');
 }
});
test('a 賣完為止 card has no countdown, and no closing-day or add-to-calendar entry',()=>{
 const [item]=core.normalize([row({結束日期:'2099-12-31'})],false);
 assert.equal(item.status.soldOut,true);
 assert.equal(core.timedCampaign(item),false);
 const limited=core.normalize([row({類型:'短期',結束日期:'2099-12-31'})],false)[0];
 assert.equal(core.timedCampaign(limited),true,'a normal limited campaign still counts down');
 const events=core.collectEvents([item,limited]);
 assert.ok(!events.some(e=>e.p===item&&e.kind==='end'),'no 結團截止 for the sold-out-based card');
 assert.ok(events.some(e=>e.p===limited&&e.kind==='end'),'the normal limited campaign keeps its closing day');
});
