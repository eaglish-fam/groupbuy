import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url),model=require('../blog/blog-model.js');
const base={'品牌':'Atojet 濾芯蓮蓬頭','類型':'短期','開團日期':'2026-09-07','結束日期':'2026-09-16','連結':'https://example.com/current'};
test('blog groups confirmed campaigns into open, upcoming and journal shelves',()=>{
  assert.deepEqual(model.stateFor(base,'2026-09-08'),{shelf:'open',label:'開團中',url:base['連結']});
  assert.equal(model.stateFor({...base,'開團日期':'2026-09-12'},'2026-09-08').shelf,'upcoming');
  assert.equal(model.stateFor({...base,'結束日期':'2026-09-07'},'2026-09-08').label,'目前未開團');
  assert.equal(model.stateFor({...base,'開團日期':'明天'},'2026-09-08').label,'團購狀態待確認');
  assert.equal(model.stateFor({...base,'連結':'javascript:alert(1)'},'2026-09-08').shelf,'journal');
});
test('blog refuses ambiguous duplicate article identities',()=>{
  assert.equal(model.rowFor([base],'atojet'),base);
  assert.equal(model.rowFor([base,base],'atojet'),null);
  assert.equal(model.rowFor([base],'unknown'),null);
});
test('blog resolves Wave and ARTISAN into live shelves independently',()=>{
  const wave={'品牌':'Wave 鷹嘴豆泥','類型':'長期','開團日期':'','結束日期':'','連結':'https://example.com/wave'};
  const artisan={'品牌':'ARTISAN浴室清潔＆小腿按摩器','類型':'短期','開團日期':'2026-09-03','結束日期':'2026-09-12','連結':'https://example.com/artisan'};
  assert.equal(model.rowFor([wave,artisan],'wave'),wave);
  assert.equal(model.stateFor(wave,'2026-09-08').shelf,'open');
  assert.equal(model.rowFor([wave,artisan],'artisanCb301'),artisan);
  assert.equal(model.stateFor(artisan,'2026-09-13').shelf,'journal');
});
test('blog articles sort newest first and invalid dates fall to the end',()=>{
  assert.equal(model.newestFirst('2026-09-09','2026-09-08')<0,true);
  assert.equal(model.newestFirst('2026-09-08','2026-09-09')>0,true);
  assert.equal(model.newestFirst('not-a-date','2026-09-09')>0,true);
});
test('public blog candidate has clear sections, static article links, and no internal review language',()=>{
  const home=fs.readFileSync(new URL('../blog/index.html',import.meta.url),'utf8');
  const articles=['atojet','wave-hummus','artisan-cb301','meroware'].map(slug=>fs.readFileSync(new URL(`../blog/${slug}/index.html`,import.meta.url),'utf8'));
  for(const label of ['開團中','即將開團','選物文章'])assert.ok(home.includes(label));
  for(const slug of ['atojet','wave-hummus','artisan-cb301','meroware'])assert.ok(home.includes(`href="/blog/${slug}/"`));
  for(const internal of ['閱讀風格預覽','尚未發布','廠商情境照片','廠商套組照片']){assert.ok(!home.includes(internal));for(const article of articles)assert.ok(!article.includes(internal));}
  assert.ok(articles[0].includes('這支影片發布於 2026 年 2 月'));
  assert.ok(!articles[2].includes('bFNLF_Vgn7k'),'CB301 article must not inherit the same-row LM3000 video');
  assert.ok(home.includes('/assets/artisan-cb301/blog-cover-v2.webp'),'ARTISAN blog card uses the dedicated editorial cover');
  assert.ok(articles[2].includes('/assets/artisan-cb301/blog-cover-v2.webp'),'ARTISAN article hero uses the dedicated editorial cover');
  assert.ok(home.indexOf('data-article="meroware"')<home.indexOf('data-article="artisanCb301"'),'newest static card appears first before runtime sorting');
  assert.equal((home.match(/data-published="\d{4}-\d{2}-\d{2}"/g)||[]).length,4,'every article card declares a publication date');
  for(const category of ['','食品','居家','母嬰'])assert.ok(home.includes(`data-blog-category="${category}"`),'blog exposes the expected category filter');
  assert.equal((home.match(/data-category="(?:食品|居家|母嬰)"/g)||[]).length,4,'every article card has a storefront-compatible category');
  const storefront=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
  assert.ok(storefront.includes('href="/blog/meroware/"'),'storefront journal links to Meroware');
});
