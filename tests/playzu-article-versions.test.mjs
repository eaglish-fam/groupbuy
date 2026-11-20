import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, mkdtempSync, rmSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {renderVintage} from '../scripts/build-playzu-article.mjs';
const read=(p)=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const config=JSON.parse(read('config/playzu-article-versions.json'));
const legacy=JSON.parse(read('config/article-variants/playzu/all-series.json'));
const html=read('blog/playzu/index.html');
const builder=fileURLToPath(new URL('../scripts/build-playzu-article.mjs',import.meta.url));
const preview=(version)=>{
  const dir=mkdtempSync(join(tmpdir(),'playzu-preview-'));
  try {
    const output=join(dir,`${version}.html`);
    execFileSync(process.execPath,[builder,'--version',version,'--output',output]);
    return readFileSync(output,'utf8');
  } finally { rmSync(dir,{recursive:true,force:true}); }
};
// The purchase entry's initial status text is shared markup replaced at runtime by article.js.
const withoutOfferStatus=(s)=>s.replace(/<p id="offer-status"[^>]*>[\s\S]*?<\/p>/,'');

test('Playzu public version is the current Morocco campaign',()=>{
  assert.equal(config.activeVersion,'morocco');
  for(const s of ['濛霧之影','鹽梅之寄','62 × 62','124 × 183','NT$2,394','11/30'])assert.ok(html.includes(s),s);
  for(const s of ['醉月星空','初衷之心','秘境沙灘','為準','@playzuhome','上一檔','開團後','僅供參考','花園系列｜','20 款','7HBV5e0bggc'])assert.ok(!html.includes(s),s);
  assert.ok(!withoutOfferStatus(html).includes('當期'),'no 當期 wording in article copy or metadata');
  assert.equal((html.match(/data-pattern=/g)||[]).length,2);
  for(const n of ['08','09'])assert.ok(html.includes(`/assets/playzu/pattern-${n}.webp`));
  assert.ok(html.includes('data-reading-nav'));
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  for(const hook of ['data-current-offer','id="offer-status"'])assert.equal(html.split(hook).length-1,1,hook);
  assert.ok(html.includes('"dateModified":"2026-11-20"'));
  assert.ok(html.includes('"keywords":["Playzu 地墊","Playzu 摩洛哥系列","灰色地墊","地墊尺寸與清潔"]'));
  assert.ok(config.versions.morocco.description.length<=180);
});
test('Playzu Morocco shipping threshold arithmetic is correct',()=>{
  const [mat,balls,total]=html.match(/([\d,]+)＋([\d,]+)＝([\d,]+)/).slice(1).map(n=>Number(n.replaceAll(',','')));
  assert.deepEqual([mat,balls],[2394,703]);
  assert.equal(mat+balls,total);
  assert.ok(total>=3000);
});
test('Playzu version builder is deterministic and preserves the complete original',()=>{
  assert.equal(renderVintage(legacy,config.versions.morocco,read(config.versions.morocco.source)),html);
  assert.ok(legacy.html.includes('20 款花色'));
  assert.ok(legacy.html.includes('/assets/playzu/family-1.webp'));
  assert.ok(legacy.html.includes('花園系列'));
  assert.ok(legacy.card.includes('20 款花色'));
  assert.ok(legacy.product.includes("id:'playzu'"));
});
test('Playzu vintage version still renders its three vintage patterns',()=>{
  const vintage=renderVintage(legacy,config.versions.vintage,read(config.versions.vintage.source));
  assert.equal(preview('vintage'),vintage);
  for(const name of ['醉月星空','初衷之心','秘境沙灘'])assert.ok(vintage.includes(name));
  for(const name of ['花園系列','摩洛哥','波斯花','北歐風','現代風','水磨石','波爾卡','62 ×','20 款','family-1.webp','7HBV5e0bggc'])assert.ok(!vintage.includes(name),name);
  assert.equal((vintage.match(/data-pattern=/g)||[]).length,3);
  assert.ok(vintage.includes('data-reading-nav'));
  assert.equal((vintage.match(/<h1\b/g)||[]).length,1);
});
test('Playzu all-series version still renders the complete original',()=>{
  assert.equal(preview('all-series'),legacy.html);
});
test('Playzu index and shared editorial entry follow the active version',()=>{
  const active=config.versions[config.activeVersion];
  const card=read('blog/index.html').match(/<article\b[^>]*data-article="playzu"[\s\S]*?<\/article>/)[0];
  const entry=read('product-content.js').split('\n').find(l=>l.includes("article:'/blog/playzu/'"));
  for(const s of [card,entry]){assert.ok(s.includes(active.cover));assert.ok(s.includes(active.cardTitle));assert.ok(!s.includes('20 款'));assert.ok(!s.includes('復古'));}
  assert.ok(card.includes(`alt="${active.coverAlt}"`));
  assert.ok(!card.includes('vintage-cover'));
});
test('Playzu cover review is bound to the active version cover',()=>{
  const active=config.versions[config.activeVersion];
  const entry=JSON.parse(read('config/blog-cover-identities.json')).articles['/blog/playzu/'];
  assert.deepEqual(entry,active.coverReview);
  assert.equal(entry.image,active.cover);
});
