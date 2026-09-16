import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),content=require('../product-content.js');
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');
const html=read('blog/miamily/index.html');
test('MiaMily uses six real family photographs and two source-matched generation images',()=>{
 for(let i=1;i<=6;i++){
  const path='/assets/miamily/family-'+i+'.webp';
  assert.ok(html.includes(path));
  assert.ok(fs.existsSync(new URL('..'+path,import.meta.url)));
 }
 for(const gen of ['gen1','gen2']){
  const path='/assets/miamily/'+gen+'.webp';
  assert.ok(html.includes(path));
  assert.ok(fs.existsSync(new URL('..'+path,import.meta.url)));
 }
 assert.match(html,/請不要把它當成建議坐姿/);
 assert.doesNotMatch(html,/12 吋.*MacBook Air/);
});
test('MiaMily explains the second-generation front opening with real photos and accessible HTML',()=>{
 for(const image of ['second-gen-front-pockets','second-gen-front-access']){
  const path='/assets/miamily/'+image+'.webp';
  assert.ok(html.includes(path));
  assert.ok(fs.existsSync(new URL('..'+path,import.meta.url)));
 }
 assert.match(html,/aria-labelledby="second-gen-detail-title"/);
 assert.match(html,/小物放前門/);
 assert.match(html,/大件放主空間/);
 assert.match(html,/前門內袋適合放途中會拿的小物/);
 assert.match(html,/零碎物品可再用收納袋固定/);
});
test('MiaMily integrates the canonical article, Sheet identity, static card and shared reading/video/offer flows',()=>{
 assert.equal(content.entry('瑞士 Miamily').article,'/blog/miamily/');
 assert.match(html,/data-article-key="miamily"/);
 assert.match(html,/data-reading-nav/);
 assert.match(html,/data-current-offer/);
 assert.match(html,/https:\/\/www.instagram.com\/reel\/DGvPO7zTUdX\//);
 assert.match(read('blog/miamily/miamily.js'),/ProductContent.mountVideos/);
 assert.match(read('index.html'),/id="product-miamily"/);
 assert.match(read('blog/index.html'),/data-article="miamily"/);
 assert.match(read('sitemap.xml'),/https:\/\/www.eaglish.store\/blog\/miamily\//);
 assert.ok(html.includes('<noscript>'));
 assert.ok(html.includes('/assets/miamily/cover.webp'));
});
