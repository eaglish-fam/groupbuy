import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),pc=require('../product-content.js');
const html=fs.readFileSync(new URL('../blog/playzu/index.html',import.meta.url),'utf8');
test('Playzu article is identity bound and fails closed for ended or duplicate offers',()=>{
 const row={'品牌':'Playzu','類型':'短期','開團日期':'2026-09-03','結束日期':'2026-09-30','連結':'https://gbf.tw/e56or'};
 assert.equal(pc.entry('Playzu').article,'/blog/playzu/');
 assert.equal(pc.campaignFor([row],'playzu','2026-09-11').state,'open');
 assert.equal(pc.campaignFor([row],'playzu','2026-10-01').state,'closed');
 assert.equal(pc.campaignFor([row,row],'playzu','2026-09-11').state,'unavailable');
 assert.equal(pc.entry('unrelated'),undefined);
});
test('Playzu contains 20 named vendor patterns, all three family photos and shared journal chrome',()=>{
 assert.equal((html.match(/data-pattern=/g)||[]).length,20);
 for(const n of [1,2,3])assert.ok(html.includes(`/assets/playzu/family-${n}.webp`));
 for(const id of ['garden','vintage','lines','dots','size','care','safety'])assert.ok(html.includes(`id="${id}"`));
 for(const path of ['/blog/journal-nav.css','/articles/article.css','/assets/editorial/eaglish-journal-wordmark-v1.svg'])assert.ok(html.includes(path));
 assert.ok(html.includes('58 公分和 62 公分不能混拼'));
 assert.ok(html.includes('不是嬰兒睡眠床墊'));
 assert.ok(html.includes('https://www.youtube.com/shorts/7HBV5e0bggc'),'only the exact Playzu video from its current Sheet row');
 for(const m of html.matchAll(/src="(\/assets\/playzu\/[^"?]+)"/g))assert.ok(fs.existsSync(new URL('..'+m[1],import.meta.url)));
});
