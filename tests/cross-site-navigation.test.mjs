import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {collectIndexablePages} from '../scripts/site-seo-inventory.mjs';
import {renderRelatedJournal} from '../scripts/related-journal.mjs';
const root=resolve(import.meta.dirname,'..');

test('every public page has one keyboard-first three-site switcher with its own current section',()=>{
 const pages=collectIndexablePages(root);
 assert.equal(pages.length,39);
 for(const page of pages){
  const html=page.html;
  const nav=html.match(/<!-- site-navigation:start -->([\s\S]*?)<!-- site-navigation:end -->/)?.[1];
  assert.ok(nav,`${page.path} has shared navigation`);
  assert.equal((html.match(/<!-- site-navigation:start -->/g)||[]).length,1,page.path);
  for(const href of ['/', '/blog/', '/trip/'])assert.match(nav,new RegExp(`<a href="${href.replaceAll('/','\\/')}" data-site-section=`),page.path);
  assert.equal((nav.match(/aria-current="location"/g)||[]).length,1,page.path);
  const skip=html.match(/<a\b[^>]*class="skip"[^>]*>/)?.index;
  if(skip!==undefined)assert.ok(skip<html.indexOf('<!-- site-navigation:start -->'),`${page.path} skip remains first`);
  for(const type of ['css','js']){
   const hash=createHash('sha256').update(readFileSync(resolve(root,`site-navigation.${type}`))).digest('hex').slice(0,12);
   assert.ok(html.includes(`/site-navigation.${type}?v=${hash}`),`${page.path} ${type} cache current`);
  }
 }
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
