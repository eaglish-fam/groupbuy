import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import fs from 'node:fs';
const require=createRequire(import.meta.url),pc=require('../product-content.js');
const read=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const records=[
 {key:'mitoy',brand:'MiToy米積木',slug:'mitoy-rice-blocks'},
 {key:'chuluAomori',brand:'台東初鹿&青森蘋果汁',slug:'chulu-aomori-drinks'}
];
test('new articles resolve exact current Sheet identity, not similar product names',()=>{
 for(const {key,brand,slug} of records){
  const row={'品牌':brand,'類型':'長期','開團日期':'','結束日期':'','連結':'https://example.com/latest'};
  assert.equal(pc.entry(brand).article,`/blog/${slug}/`);
  assert.equal(pc.readingLinks({brand})[0].url,`/blog/${slug}/`);
  assert.equal(pc.campaignFor([row],key,'2026-09-10').url,row['連結']);
  assert.equal(pc.campaignFor([row,row],key).state,'unavailable');
  assert.equal(pc.campaignFor([{...row,'品牌':brand+'另一系列'}],key).state,'unavailable');
  assert.equal(pc.campaignFor([{...row,'連結':'https://example.com/next-month'}],key).url,'https://example.com/next-month');
  assert.equal(pc.campaignFor([{...row,'結束日期':'2026-09-01'}],key,'2026-09-10').state,'closed');
 }
});
test('both approved pages share production theme and live fail-closed purchase control',()=>{
 const home=read('blog/index.html');
 for(const {key,slug} of records){
  const html=read(`blog/${slug}/index.html`);
  assert.ok(html.includes(`data-article-key="${key}"`));
  assert.ok(html.includes('data-current-offer disabled'));
  assert.ok(html.includes('/articles/article.js?v='));
  assert.ok(!html.includes('<form action='));
  assert.ok(!html.includes('noindex'));assert.ok(!html.includes('<style>'));
  assert.ok(html.includes('LXGW+WenKai+TC'));assert.ok(html.includes('/articles/article.css?'));
  assert.ok(home.indexOf(`data-article="${key}"`)<home.indexOf('data-article="meroware"'));
  assert.ok(read('index.html').includes(`href="/blog/${slug}/"`));
  for(const match of html.matchAll(/src="(\/assets\/[^"?]+)"/g))assert.ok(fs.existsSync(new URL('..'+match[1],import.meta.url)),match[1]);
 }
});
test('drinks has exactly three promotion images, matched to the intended product section',()=>{
 const html=read('blog/chulu-aomori-drinks/index.html');
 assert.equal((html.match(/class="story-photo promotion-photo"/g)||[]).length,3);
 for(const [section,name] of [[0,'uht-breakfast'],[1,'flavored-break'],[3,'aomori-sharing']]){
  const content=html.match(new RegExp(`<section aria-labelledby="section-${section}">([\\s\\S]*?)</section>`))[1];
  assert.ok(content.includes(name+'-promotion.webp'));
  assert.ok(fs.statSync(new URL(`../assets/chulu-aomori-drinks/${name}-promotion.webp`,import.meta.url)).size<200000);
 }
 assert.ok(!html.includes('團購至 9 月 30 日'));
});
