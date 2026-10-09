import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url), P=require('../product-content.js');
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const html=read('blog/locknlock/index.html');
const row={'品牌':'樂扣樂扣','開團日期':'2026-10-08','結束日期':'2026-10-15','類型':'短期','連結':'https://kindays.my1shop.com/z1fmcp'};
test('LocknLock resolves the exact live campaign and closes after October 15',()=>{
  assert.equal(P.campaignFor([row],'locknlock','2026-10-08').url,row['連結']);
  assert.equal(P.campaignFor([row],'locknlock','2026-10-15').state,'open');
  assert.equal(P.campaignFor([row],'locknlock','2026-10-16').state,'closed');
  assert.equal(P.campaignFor([{...row,品牌:'其他商品'}],'locknlock','2026-10-08').state,'unavailable');
});
test('LocknLock keeps actual family scenes separate from each current model photograph',()=>{
  for(const name of ['family-1','family-2','family-3','family-4','children-450','children-500','fun-750-set','flip-850','steel-720','urban-900','large-2l']) assert.ok(html.includes('/assets/locknlock/'+name+'.webp'));
  assert.match(html,/當期款式與外觀，請對照下面的商品圖/);
  assert.doesNotMatch(html,/實測不漏|完全防漏|AI 邊界|內部審核|tailb3e7be|localhost/);
});
test('four real family photos form one two-column gallery without visible photo captions',()=>{
  const family=html.match(/<section id="family"[\s\S]*?<\/section>/)[0];
  assert.equal((family.match(/class="photo-pair family-pair"/g)||[]).length,1);
  assert.equal((family.match(/<figure>/g)||[]).length,4);
  assert.doesNotMatch(family,/<figcaption\b/);
  assert.equal((family.match(/alt="[^"]+"/g)||[]).length,4);
  const css=read('blog/locknlock/locknlock.css');
  assert.match(css,/\.family-pair\{grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.doesNotMatch(css,/\.family-pair\{[^}]*grid-template-columns:1fr/);
  assert.match(css,/\.family-pair img\{aspect-ratio:auto;height:auto\}/);
  assert.match(css,/\.family-pair figure\{min-width:0;padding:8px\}/);
});
test('unique real short clips are lazy, muted, inline, automatic loops without extra controls',()=>{
  let total=0;
  for(const i of [1,3]){
    assert.match(html,new RegExp('id="loop-'+i+'" autoplay muted loop playsinline preload="none"'));
    assert.match(html,new RegExp('data-src="/assets/locknlock/loop-'+i+'\\.mp4"'));
    total+=fs.statSync(new URL('../assets/locknlock/loop-'+i+'.mp4',import.meta.url)).size;
  }
  assert.ok(total<400000);
  assert.match(read('blog/locknlock/loops.js'),/prefers-reduced-motion/);
  assert.doesNotMatch(html,/data-loop-control|暫停短片|<video[^>]*\bcontrols\b/);
  assert.doesNotMatch(read('blog/locknlock/loops.js'),/manualPause|\.button/);
  assert.match(read('blog/locknlock/loops.js'),/visibilitychange/);
});
test('article titles name the reader choices directly and short loops remain two columns on mobile',()=>{
  assert.match(html,/<em>兒童水壺、吸管杯與容量比較<\/em>/);
  assert.doesNotMatch(html,/先想誰喝/);
  const css=read('blog/locknlock/locknlock.css');
  assert.match(css,/\.loop-grid\{display:grid;grid-template-columns:repeat\(2,minmax\(0,1fr\)\)/);
  assert.doesNotMatch(css,/\.loop-grid\{[^}]*grid-template-columns:1fr/);
});
test('article uses shared navigation and model-specific care without volatile Offer schema',()=>{
  assert.ok(html.includes('/blog/reading-nav.js'));
  for(const id of ['family','children','adults','capacity','watch','care','questions','purchase']) assert.ok(html.includes('href="#'+id+'"')&&html.includes('id="'+id+'"'));
  assert.match(html,/850ml 掀蓋款.*?60°C/);
  assert.match(html,/data-current-offer/);
  assert.doesNotMatch(html,/"@type":"(?:Product|Offer|FAQPage)"/);
  assert.match(html,/團後 7–10 個工作天依序出貨/);
});
