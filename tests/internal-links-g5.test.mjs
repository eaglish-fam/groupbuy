import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {withCatalogArticle,snapshotCards,readSnapshot} from '../scripts/catalog-snapshot.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=f=>readFileSync(resolve(root,f),'utf8');

test('C2-01..04: each source article links its paired target once, with the planned anchor text',()=>{
 const edges=[
  ['blog/meroware/index.html','/blog/done-by-deer/#s3','Done by deer 碗盤的分格、深度與尺寸'],
  ['blog/locknlock/index.html','/blog/done-by-deer/#s4','Done by deer 水壺與便當盒的冷熱用途'],
  ['blog/sanfufarm/index.html','/blog/parakito/','防蚊噴霧、滾珠與手環怎麼選'],
  ['blog/leofoo/index.html','/blog/parakito/','戶外防蚊用品的形式與使用限制']
 ];
 for(const [file,href,text] of edges){
  const html=read(file);
  assert.equal(html.split(`<a href="${href}">${text}</a>`).length-1,1,file);
  const target=read(href.split('#')[0].slice(1)+'index.html');
  if(href.includes('#'))assert.ok(target.includes(`id="${href.split('#')[1]}"`),'target anchor exists: '+href);
 }
});
test('the three lodging articles all list each other under related reading',()=>{
 const slugs=['leofoo','caesar-kenting','sanfufarm'];
 for(const a of slugs){
  const html=read(`blog/${a}/index.html`);
  const nav=html.match(/<nav class="related-reading"[\s\S]*?<\/nav>/)[0];
  for(const b of slugs.filter(x=>x!==a))assert.ok(nav.includes(`href="/blog/${b}/"`),`${a} -> ${b}`);
 }
});
test('a homepage card without an article gets the catalogue article for its brand',()=>{
 const shinwa=readSnapshot().items.find(i=>i.brand==='心窪生活');
 assert.ok(shinwa,'snapshot has the 心窪生活 card');
 const fixed=withCatalogArticle({...shinwa,article:null});
 assert.equal(fixed.article,'/blog/shinwa-living/');
 assert.ok(fixed.image&&fixed.image.startsWith('/assets/'),'the card also gets the article image');
 assert.equal(withCatalogArticle({...shinwa,article:null,image:'/assets/keep.webp'}).image,'/assets/keep.webp');
 const cards=snapshotCards({items:[{...shinwa,article:null}]});
 assert.match(cards,/href="\/blog\/shinwa-living\/"/);
 assert.match(read('index.html'),/id="product-[^"]*"[^]*?href="\/blog\/shinwa-living\/"/);
});
test('a card keeps its own article, and a brand with no article stays unlinked',()=>{
 assert.equal(withCatalogArticle({brand:'樂扣樂扣',article:'/blog/locknlock/',image:'x'}).article,'/blog/locknlock/');
 assert.equal(withCatalogArticle({brand:'心窪生活',article:'/blog/own-choice/',image:'x'}).article,'/blog/own-choice/','an article already on the card is not replaced');
 const none=withCatalogArticle({brand:'Alzipmat',article:null,image:null});
 assert.equal(none.article,null);
 assert.match(snapshotCards({items:[{id:'z',brand:'Alzipmat',category:'x',description:'d',article:null,image:null}]}),/href="\/guides\/"/);
});
