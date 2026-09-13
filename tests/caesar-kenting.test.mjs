import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),content=require('../product-content.js');
const html=readFileSync(new URL('../blog/caesar-kenting/index.html',import.meta.url),'utf8');
const row={'品牌':'墾丁凱撒大飯店','類型':'短期','開團日期':'2026-09-14','結束日期':'2026-09-20','連結':'https://tlathena.ec-hotel.net/webhotel-v4/0018/rmProducts/0387/special'};
test('Caesar article is registered to exactly its product card',()=>{
 assert.equal(content.entry(row['品牌']).article,'/blog/caesar-kenting/');
 assert.equal(content.entry('H會館'),undefined);
 assert.equal(content.readingLinks({brand:row['品牌']})[0].url,'/blog/caesar-kenting/');
 assert.match(readFileSync(new URL('../blog/index.html',import.meta.url),'utf8'),/data-article="caesarKenting" data-category="旅遊"/);
});
test('Caesar article keeps campaign lifecycle and ambiguity fail-closed',()=>{
 assert.equal(content.campaignFor([row],'caesarKenting','2026-09-13').state,'upcoming');
 assert.equal(content.campaignFor([row],'caesarKenting','2026-09-14').state,'open');
 assert.equal(content.campaignFor([row],'caesarKenting','2026-09-21').state,'closed');
 assert.equal(content.campaignFor([row,row],'caesarKenting','2026-09-14').state,'unavailable');
});
test('Caesar has 20-plus real images, five room sections and useful FAQs',()=>{
 const imgs=[...html.matchAll(/<img\b[^>]*src="([^"]+)"[^>]*>/g)].filter(m=>m[1].includes('caesar-kenting'));
 assert.ok(new Set(imgs.map(m=>m[1])).size>=21);
 for(const m of imgs){assert.ok(existsSync(new URL('..'+m[1],import.meta.url)),m[1]);assert.match(m[0],/width="\d+"/);assert.match(m[0],/height="\d+"/);assert.match(m[0],/alt="[^"]+"/);}
 for(const id of ['superior','scenic','garden','poolside','suite'])assert.ok(html.includes('id="'+id+'"'));
 assert.equal([...html.matchAll(/<details>/g)].length,12);
 assert.ok(html.includes('NT$7,499')&&html.includes('NT$9,499'));
 assert.ok(!html.includes('FAQPage'));
 assert.ok(html.includes('data-current-offer disabled'));
});
test('Caesar video uses verified trip timestamp and its own poster',()=>{
 const js=readFileSync(new URL('../blog/caesar-kenting/video.js',import.meta.url),'utf8');
 assert.ok(js.includes('t=979s')&&js.includes('family-1630.webp'));
 assert.ok(!html.includes('<iframe'));
 assert.equal(content.videos('https://www.youtube.com/watch?v=0oNzr8gyxyQ&t=979s')[0].embedUrl,'https://www.youtube-nocookie.com/embed/0oNzr8gyxyQ?start=979');
});
