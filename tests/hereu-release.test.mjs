import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),content=require('../product-content.js');
const row={'品牌':'hereu 智慧定位器','類型':'短期','開團日期':'2026-09-10','結束日期':'2026-09-30','連結':'https://gbf.tw/bmcfn'};
test('Hereu exact identity resolves to its own article, not a Tag 2.0 sibling',()=>{
 assert.equal(content.entry(row['品牌']).article,'/blog/hereu-tag/');
 assert.equal(content.entry('Hereu Tag 2.0'),undefined);
 assert.equal(content.readingLinks({brand:row['品牌']})[0].url,'/blog/hereu-tag/');
});
test('Hereu uses the current campaign and fails closed on expired, duplicate or missing rows',()=>{
 assert.equal(content.campaignFor([row],'hereu','2026-09-11').url,row['連結']);
 assert.equal(content.campaignFor([row],'hereu','2026-10-01').state,'closed');
 assert.equal(content.campaignFor([row],'hereu','2026-09-09').state,'upcoming');
 for(const rows of [[],[row,row],[{...row,'連結':''}]])assert.equal(content.campaignFor(rows,'hereu','2026-09-11').state,'unavailable');
});
test('Hereu guide embeds the matching manual and preserves important consumer limits',()=>{
 const h=fs.readFileSync(new URL('../blog/hereu-tag/index.html',import.meta.url),'utf8');
 assert.match(h,/o51QlZgmlbI/);assert.match(h,/data-article-key="hereu"/);
 assert.match(h,/不是能持續顯示移動路線的即時 GPS/);assert.match(h,/並非 Android 款/);
 assert.match(h,/不能代替看顧或即時安全定位/);assert.match(h,/正極朝上/);
 for(const file of ['cover','everyday','find-my','contents']){
  assert.match(h,new RegExp(`/assets/hereu-tag/${file}\\.webp`));
  assert.ok(fs.statSync(new URL(`../assets/hereu-tag/${file}.webp`,import.meta.url)).size<160000);
 }
 const home=fs.readFileSync(new URL('../blog/index.html',import.meta.url),'utf8');
 assert.ok(home.indexOf('data-article="hereu"')<home.indexOf('data-article="mitoy"'));
});
