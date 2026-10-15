import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {collectIndexablePages,decodeHtml} from '../scripts/site-seo-inventory.mjs';
const root=resolve(import.meta.dirname,'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
test('complete emitted cmap covers all public Chinese headings with no automatic font triggers',()=>{
 const manifest=JSON.parse(read('assets/fonts/complete-site-font-v1.json'));
 const font=readFileSync(resolve(root,'assets/fonts/noto-serif-tc-complete-500-v1.woff2'));
 assert.equal(font.toString('ascii',0,4),'wOF2');
 assert.equal(createHash('sha256').update(font).digest('hex'),manifest.sha256);
 assert.equal(font.length,manifest.bytes);
 assert.ok(manifest.unicodeCount>20000);assert.equal(manifest.weight,500);
 assert.equal(manifest.fullSourceCmapExact,true);assert.match(manifest.version,/2\.003/);
 const covered=cp=>manifest.ranges.some(([a,z])=>cp>=a&&cp<=z);
 let headings=0,pages=0;
 for(const page of collectIndexablePages(root)){
  const path=page.file;
  const html=read(path);pages++;
  assert.doesNotMatch(html,/@font-face\s*\{|<link\b[^>]*\bas=["']font["']|fonts\.googleapis\.com|fonts\.gstatic\.com/,path);
  assert.match(html,/<script defer src="\/site-font-loader\.js\?v=[a-f0-9]+" data-font-entry="(?:true|false)">/,path);
  for(const heading of html.matchAll(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi)){
   headings++;
   for(const char of decodeHtml(heading[1].replace(/<[^>]*>/g,'')))
    if(/\p{Script=Han}/u.test(char))assert.ok(covered(char.codePointAt(0)),`${path}: ${char} absent from emitted cmap`);
  }
 }
 assert.ok(pages>=39);assert.ok(headings>200);
 for(const path of ['site-navigation.css','trip/heading-theme-r24.css','trip/singapore.css'])assert.doesNotMatch(read(path),/@font-face\s*\{/);
 assert.match(read('site-navigation.css'),/Songti TC/);
 for(const alias of ['Eaglish Heading Serif','Eaglish Travel Heading Serif'])assert.ok(read('site-font-loader.js').includes(alias));
 assert.match(read('site-font-loader.js'),/cache: 'force-cache'/);
});
test('v2 site face plus slices cover the complete cmap and every public heading needs only the site face',()=>{
 const complete=JSON.parse(read('assets/fonts/complete-site-font-v1.json'));
 const manifest=JSON.parse(read('assets/fonts/heading-serif-500-v2/manifest.json'));
 assert.equal(manifest.source.sha256,complete.sha256);
 const parse=range=>range.split(',').map(part=>part.slice(2).split('-').map(hex=>parseInt(hex,16))).map(([a,z=a])=>[a,z]);
 const count=ranges=>ranges.reduce((n,[a,z])=>n+z-a+1,0);
 for(const face of [manifest.site,...manifest.slices]){
  const bytes=readFileSync(resolve(root,'assets/fonts/heading-serif-500-v2',face.file));
  assert.equal(bytes.toString('ascii',0,4),'wOF2',face.file);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),face.sha256,face.file);
  assert.equal(bytes.length,face.bytes,face.file);
  assert.equal(count(parse(face.unicodeRange)),face.count,face.file);
 }
 // Disjoint faces that together are exactly the complete font's cmap: nothing falls back.
 const all=[manifest.site,...manifest.slices].flatMap(face=>parse(face.unicodeRange)).sort((x,y)=>x[0]-y[0]);
 for(let i=1;i<all.length;i++)assert.ok(all[i][0]>all[i-1][1],'faces overlap');
 assert.equal(count(all),complete.unicodeCount);
 assert.ok(all.every(([a,z])=>complete.ranges.some(([ca,cz])=>a>=ca&&z<=cz)));
 assert.ok(manifest.site.bytes<700_000,`site face ${manifest.site.bytes} bytes`);
 assert.ok(manifest.slices.every(slice=>slice.bytes<160_000));
 const site=parse(manifest.site.unicodeRange),inSite=cp=>site.some(([a,z])=>cp>=a&&cp<=z);
 for(const page of collectIndexablePages(root)){
  const html=read(page.file);
  for(const heading of html.matchAll(/<h[1-6]\b[^>]*>([\s\S]*?)<\/h[1-6]>/gi))
   for(const char of decodeHtml(heading[1].replace(/<[^>]*>/g,'')))
    if(/\p{Script=Han}/u.test(char))assert.ok(inSite(char.codePointAt(0)),`${page.file}: ${char} only in a slice; rerun scripts/build-site-heading-font.mjs`);
 }
 assert.match(read('site-font-loader.js'),/\/assets\/fonts\/heading-serif-500-v2\//);
});
