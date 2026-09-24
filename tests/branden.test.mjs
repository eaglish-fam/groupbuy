import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
const pc=createRequire(import.meta.url)('../product-content.js');
const row={'品牌':'Branden 壓縮袋','連結':'https://gbf.tw/mtekp','類型':'限時開團','開團日期':'2026-09-23','結束日期':'2026-09-30','影片網址':'https://youtube.com/shorts/xmlMSx5ABQw'};
test('BRANDEN identity, series video and article mapping are exact',()=>{
 assert.equal(pc.entry(row.品牌)?.id,'branden');assert.equal(pc.entry('收麻吉手捲收納袋')?.id,'shoumaji');assert.equal(pc.entry(row.品牌).article,'/blog/branden/');
 assert.equal(pc.fromRow(row)[0].youtubeId,'xmlMSx5ABQw');
 assert.equal(pc.catalog.branden.cardImage,'/assets/branden/product-card.webp');
});
test('BRANDEN current offers fail closed for ended, duplicate or missing records',()=>{
 assert.equal(pc.campaignFor([row],'branden','2026-09-24').state,'open');
 assert.equal(pc.campaignFor([row],'branden','2026-10-01').state,'closed');
 assert.equal(pc.campaignFor([row,row],'branden','2026-09-24').state,'unavailable');
 assert.equal(pc.campaignFor([],'branden','2026-09-24').state,'unavailable');
});
test('BRANDEN separates two families, true video frames and non-numeric choice guidance',()=>{
 const html=fs.readFileSync(new URL('../blog/branden/index.html',import.meta.url),'utf8');
 for(const file of ['frame-10','frame-15','frame-20','gen2-1','lite-7'])assert.ok(html.includes('/assets/branden/'+file+'.webp'));
 for(const section of ['packing','types','series','sizes','chooser','questions'])assert.ok(html.includes('id="'+section+'"'));
 assert.ok(html.includes('不換算固定天數或保證袋數'));
 assert.ok(html.includes('BRANDEN'));
 assert.ok(!html.includes('縮小50%'));
});
