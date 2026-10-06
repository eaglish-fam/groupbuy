import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {renderVintage} from '../scripts/build-playzu-article.mjs';
const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const config=JSON.parse(read('config/playzu-article-versions.json'));
const legacy=JSON.parse(read('config/article-variants/playzu/all-series.json'));
const html=read('blog/playzu/index.html');
test('Playzu public version has only the three current vintage patterns',()=>{
  assert.equal(config.activeVersion,'vintage');
  for(const name of ['醉月星空','初衷之心','秘境沙灘'])assert.ok(html.includes(name));
  for(const name of ['花園系列','摩洛哥','波斯花','北歐風','現代風','水磨石','波爾卡','62 ×','20 款','family-1.webp','7HBV5e0bggc'])assert.ok(!html.includes(name),name);
  assert.equal((html.match(/data-pattern=/g)||[]).length,3);
  assert.ok(html.includes('data-reading-nav'));
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
});
test('Playzu version builder is deterministic and preserves the complete original',()=>{
  assert.equal(renderVintage(legacy,config.versions.vintage,read(config.versions.vintage.source)),html);
  assert.ok(legacy.html.includes('20 款花色'));
  assert.ok(legacy.html.includes('/assets/playzu/family-1.webp'));
  assert.ok(legacy.html.includes('花園系列'));
  assert.ok(legacy.card.includes('20 款花色'));
  assert.ok(legacy.product.includes("id:'playzu'"));
});
test('Playzu index and shared editorial entry follow the active version',()=>{
  const card=read('blog/index.html').match(/<article\b[^>]*data-article="playzu"[\s\S]*?<\/article>/)[0];
  const entry=read('product-content.js').split('\n').find(l=>l.includes("article:'/blog/playzu/'"));
  for(const s of [card,entry]){assert.ok(s.includes(config.versions.vintage.cover));assert.ok(s.includes(config.versions.vintage.cardTitle));assert.ok(!s.includes('20 款'));}
});
