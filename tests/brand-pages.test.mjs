import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {validatePages,renderBrandPage} from '../scripts/build-brand-pages.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const config=JSON.parse(readFileSync(resolve(root,'config/brand-pages.json'),'utf8'));
const goLinks=JSON.parse(readFileSync(resolve(root,'config/go-links.json'),'utf8'));
const pages=validatePages(config,goLinks);
const bySlug=Object.fromEntries(pages.map(p=>[p.slug,p]));

// normalize-site-seo adds navigation, share-image fields and twitter tags to every indexable page after the
// generator runs, so the committed file is compared on what the generator owns: <main> and the head facts.
const mainOf=html=>html.match(/<main>[\s\S]*<\/main>/)[0];
test('the three brand pages exist and each committed file has exactly the generator\'s main content',()=>{
 assert.deepEqual(Object.keys(bySlug).sort(),['happymoon','plafarm','tiger-family']);
 for(const p of pages){
  const committed=readFileSync(resolve(root,'brand',p.slug,'index.html'),'utf8');
  assert.equal(mainOf(committed),mainOf(renderBrandPage(p)));
  assert.ok(committed.includes('<!-- generated:brand-pages -->'));
  assert.ok(committed.includes(`<meta name="description" content="${p.description}">`));
 }
});
test('static HTML carries the brand name, title format and self canonical',()=>{
 for(const p of pages){
  const html=readFileSync(resolve(root,'brand',p.slug,'index.html'),'utf8');
  assert.match(html,new RegExp(`<title>${p.brand} 團購2026｜開團日期、商品與優惠｜鷹式一家</title>`));
  assert.match(html,new RegExp(`<h1>${p.brand} 團購2026：商品與開團資訊</h1>`));
  assert.ok(html.includes(`<link rel="canonical" href="https://www.eaglish.store/brand/${p.slug}/">`));
  for(const s of p.sections)assert.ok(html.includes(s.text),'section text is in the HTML: '+s.heading);
 }
});
test('thin brand pages are noindex,follow and stay out of the sitemap (Bingo 2026-11-02)',()=>{
 const sitemap=readFileSync(resolve(root,'sitemap.xml'),'utf8');
 for(const p of pages){
  assert.equal(p.indexable,false);
  const html=readFileSync(resolve(root,'brand',p.slug,'index.html'),'utf8');
  assert.match(html,/<meta name="robots" content="noindex,follow">/);
  assert.ok(!sitemap.includes(`/brand/${p.slug}/`),'noindex page is not in the sitemap');
 }
});
test('a page becomes indexable only with an existing journal article, and then says index,follow',()=>{
 const p=bySlug['plafarm'];
 const ok={...p,indexable:true,article:'/blog/leofoo/'};
 assert.doesNotThrow(()=>validatePages({...config,pages:[ok]},goLinks));
 assert.match(renderBrandPage(ok),/<meta name="robots" content="index,follow,max-image-preview:large">/);
 for(const patch of [{indexable:true},{indexable:true,article:'/blog/no-such-article/'},{indexable:true,article:'https://evil.example/'},{indexable:'yes'},{indexable:undefined},{article:'/guides/'}])
  assert.throws(()=>validatePages({...config,pages:[{...p,...patch}]},goLinks),undefined,JSON.stringify(patch));
});
test('no buy link and no invented facts while the group buy is not confirmed open',()=>{
 for(const p of pages){
  assert.notEqual(p.status,'open');
  assert.equal(p.buy,null);
  const html=renderBrandPage(p);
  assert.match(html,/開團時間待公告/);
  assert.doesNotMatch(html,/href="\/go\//,'no /go/ link');
  assert.doesNotMatch(html,/href=""/);
  assert.doesNotMatch(html,/"@type":"(?:Offer|Product|AggregateOffer)"/,'no Offer or Product markup without a verified offer');
  assert.doesNotMatch(html,/NT\$|\$\s?\d|\d+\s?元/,'no price in the page');
 }
});
test('an open page gets a /go/ button with the brand tag, only through an existing go slug',()=>{
 const open={...bySlug['plafarm'],status:'open',buy:{goSlug:'cal',label:'前往團購'}};
 assert.doesNotThrow(()=>validatePages({...config,pages:[open]},goLinks));
 assert.match(renderBrandPage(open),/<a class="brand-buy" href="\/go\/cal\/\?c=brand-plafarm">前往團購<\/a>/);
 assert.doesNotMatch(renderBrandPage(open),/開團時間待公告/);
});
test('the config rejects a buy button on a page that is not open, a missing go slug, and missing facts',()=>{
 const p=bySlug['plafarm'];
 for(const patch of [{buy:{goSlug:'cal',label:'x'}},{status:'open',buy:null},{status:'open',buy:{goSlug:'nope',label:'x'}},{status:'open',buy:{goSlug:'cal',label:''}},{status:'bogus'},{slug:'Bad Slug'},{title:'沒有品牌名的標題'},{h1:'沒有品牌'},{description:'太短'},{sections:[]},{sections:[{heading:'開團資訊',text:''}]},{more:{label:'x',href:'https://evil.example/'}},{more:{label:'x',href:'//evil.example/'}},{intro:''}])
  assert.throws(()=>validatePages({...config,pages:[{...p,...patch}]},goLinks),undefined,JSON.stringify(patch).slice(0,60));
 assert.throws(()=>validatePages({...config,pages:[p,p]},goLinks),/duplicate/);
});
