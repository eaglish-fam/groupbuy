import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const content=createRequire(import.meta.url)('../product-content.js');
test('Fushan ambient identity does not borrow roe campaign video',()=>{
 const entry=content.entry('富山私房菜｜常溫品');
 assert.equal(entry.article,'/blog/fushan-gifts/');
 assert.equal(entry.cardImage,'/assets/fushan/product-card.webp');
 assert.equal(entry.videoPolicy,'none');
 assert.equal(content.entry('富山烏魚子禮盒'),undefined);
 assert.ok(fs.statSync(new URL('../assets/fushan/product-card.webp',import.meta.url)).size<160000);
});
test('Fushan frozen group has a separate live card identity',()=>{
 const entry=content.entry('富山私房菜｜冷凍品');
 assert.equal(entry.id,'fushan-frozen');
 assert.equal(entry.article,null);
 assert.equal(entry.cardImage,'/assets/fushan-frozen/product-card.webp');
 assert.equal(content.readingButton({brand:'富山私房菜｜冷凍品'}),'');
});
test('Fushan guide separates empty box and historical roe, retaining all family photos',()=>{
 const html=fs.readFileSync(new URL('../blog/fushan-gifts/index.html',import.meta.url),'utf8');
 assert.match(html,/是空盒，食品要另外選購/);
 assert.match(html,/烏魚子目前未開團/);
 for(const name of ['family-gift','family-roe','family-roe-box','original','spicy','tea']) assert.ok(html.includes(`/assets/fushan/${name}.webp`));
 assert.match(html,/id="roe-videos"/);
 assert.doesNotMatch(html,/id="article-videos"/);
 const js=fs.readFileSync(new URL('../blog/fushan-gifts/roe-video.js',import.meta.url),'utf8');
 assert.match(js,/LaM-8Ib_rkg/);
 assert.match(js,/烏魚子/);
});
