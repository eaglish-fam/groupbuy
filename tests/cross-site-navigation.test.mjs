import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {collectIndexablePages} from '../scripts/site-seo-inventory.mjs';
import {renderRelatedJournal} from '../scripts/related-journal.mjs';
const root=resolve(import.meta.dirname,'..');

test('every public page puts one three-site switcher after its footer, with no return strip',()=>{
 const pages=collectIndexablePages(root);
 assert.equal(pages.length,39);
 for(const page of pages){
  const html=page.html;
  const nav=html.match(/<!-- site-navigation:start -->([\s\S]*?)<!-- site-navigation:end -->/)?.[1];
  assert.ok(nav,`${page.path} has shared navigation`);
  assert.equal((html.match(/<!-- site-navigation:start -->/g)||[]).length,1,page.path);
  for(const href of ['/', '/blog/', '/trip/'])assert.match(nav,new RegExp(`<a href="${href.replaceAll('/','\\/')}" data-site-section=`),page.path);
  assert.equal((nav.match(/aria-current="location"/g)||[]).length,1,page.path);
  assert.ok(html.lastIndexOf('</footer>')<html.indexOf('<!-- site-navigation:start -->'),`${page.path} switcher follows footer`);
  assert.doesNotMatch(html,/site-travel-return|site-navigation\.js|回到旅行/);
  const hash=createHash('sha256').update(readFileSync(resolve(root,'site-navigation.css'))).digest('hex').slice(0,12);
  assert.ok(html.includes(`/site-navigation.css?v=${hash}`),`${page.path} stylesheet cache current`);
 }
 const store=readFileSync(resolve(root,'index.html'),'utf8');
 assert.ok(store.indexOf('<header class="site-header">')<store.indexOf('<!-- site-navigation:start -->'));
 assert.doesNotMatch(store,/<nav class="mobile-nav"|id="mobile-saved"/);
 for(const label of ['買物社','選物誌','遠行所'])assert.match(store,new RegExp(`>${label}</a>`));
 const storeFooter=store.match(/<footer class="wrap">([\s\S]*?)<\/footer>/)?.[1];
 assert.ok(storeFooter);
 assert.match(storeFooter,/<a href="\/blog\/">選物部落格<\/a>/,'the existing journal footer link remains');
 assert.match(storeFooter,/<a href="\/trip\/">旅行指南・鷹家遠行所<\/a>/,'the existing travel footer link remains');
});

test('only the three-site switcher stays at the desktop bottom, with travel headers sticky',()=>{
 const css=readFileSync(resolve(root,'site-navigation.css'),'utf8');
 assert.match(css,/\.site-switcher\{[^}]*position:fixed;left:0;right:0;bottom:0/);
 assert.match(css,/body>header\.home-masthead,body>header\.masthead\.wrap\{position:sticky;top:0/);
 assert.doesNotMatch(css,/\.home-footer[^\n]*position:fixed|\.footer[^\n]*position:fixed/);
 assert.match(css,/@media\(max-width:700px\)[^{]*\{body\{padding-bottom:calc\(56px/);
});

test('Bangkok Jurassic related reading goes to two real journal articles after travel details',()=>{
 const html=readFileSync(resolve(root,'trip/guides/bangkok-with-kids/index.html'),'utf8');
 const section=html.match(/<section id="jurassic"[\s\S]*?<\/section>/)?.[0];
 assert.ok(section);
 assert.ok(section.indexOf('bkk-sources')<section.indexOf('延伸選物筆記'));
 for(const slug of ['branden','shoumaji']){
  assert.match(section,new RegExp(`<a href="/blog/${slug}/">`));
  assert.doesNotThrow(()=>readFileSync(resolve(root,`blog/${slug}/index.html`)));
 }
 assert.doesNotMatch(section,/使用侏羅紀.*壓縮袋|現場.*壓縮袋/);
});

test('editorial links require existing local journal articles and escape content',()=>{
 assert.throws(()=>renderRelatedJournal({title:'A',description:'B',links:[{slug:'missing-fake',label:'C'}]}),/existing article/);
 const note=renderRelatedJournal({title:'A < B',description:'D & E',links:[{slug:'branden',label:'F " G'}]});
 assert.match(note,/A &lt; B/);
 assert.match(note,/D &amp; E/);
 assert.match(note,/F &quot; G/);
});
