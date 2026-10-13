import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const content=require('../product-content.js');
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
 for(const t of ['data-reading-nav','id="video"','id="versions"','data-current-offer','2026/10/12–10/22','102_150dpi','_443-150','_455'])assert.ok(html.includes(t));
 assert.ok(!html.includes('<video'));assert.ok(!html.includes('autoplay'));
 assert.ok(html.includes('/assets/knsh/reading-video.mp4'));
 assert.ok(existsSync(new URL('../assets/knsh/reading-video.mp4',import.meta.url)));
});
