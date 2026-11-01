import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const content=require('../product-content.js');
test('康軒對外文案維持品牌第一人稱，不把作者寫成受訪者',()=>{
 const html=readFileSync(new URL('../blog/knsh/index.html',import.meta.url),'utf8');
 const js=readFileSync(new URL('../blog/knsh/knsh.js',import.meta.url),'utf8');
 const entry=JSON.stringify(content.entry('康軒雜誌'));
 for(const text of [html,js,entry]) assert.doesNotMatch(text,/秀秀|Queenie|原文也分享過|在過去的文章裡分享/);
 assert.match(html,/我們一直有讓在恩看兒童學習雜誌的習慣/);
 assert.match(html,/我們在影片裡翻開各版雜誌/);
});
test('康軒 uses only the live brand and keeps current offers in the Sheet',()=>{
 const entry=content.entry('康軒雜誌');
 assert.equal(entry.id,'knsh');assert.equal(entry.article,'/blog/knsh/');
 assert.equal(content.entry('康軒學習雜誌'),undefined);
 assert.equal(entry.cardImage,'/assets/knsh/product-card.webp');
 assert.equal(entry.url,undefined);assert.equal(entry.buyUrl,undefined);
 for(const t of ['2–6','6–10','10–12','6,480','7,920']) assert.ok(entry.details.includes(t));
});
test('康軒 article exposes source-bound previews and local video without eager download',()=>{
 const html=readFileSync(new URL('../blog/knsh/index.html',import.meta.url),'utf8');
 for(const t of ['data-reading-nav','id="video"','id="versions"','data-current-offer','2026/10/12–10/31','102_150dpi','_443-150','_455'])assert.ok(html.includes(t));
 assert.ok(!html.includes('<video'));assert.ok(!html.includes('autoplay'));
 assert.ok(html.includes('/assets/knsh/reading-video-mobile.mp4'));
 for(const file of ['reading-video-mobile.mp4','reading-video.webm']) assert.ok(existsSync(new URL('../assets/knsh/'+file,import.meta.url)));
});
