import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const publicPages=['index.html'];
for(const section of ['blog','trip','guides','how-we-select']){
 const visit=directory=>{
  for(const entry of readdirSync(resolve(root,directory),{withFileTypes:true})){
   const path=`${directory}/${entry.name}`;
   if(entry.isDirectory())visit(path);
   else if(entry.name==='index.html')publicPages.push(path);
  }
 };
 visit(section);
}

test('three-site headline font covers public Chinese headings without remote font requests',()=>{
 const glyphs=new Set(readFileSync(resolve(root,'assets/fonts/heading-glyphs.txt'),'utf8'));
 const font=readFileSync(resolve(root,'assets/fonts/noto-serif-tc-headings-v8.woff2'));
 assert.equal(font.toString('ascii',0,4),'wOF2');
 assert.ok(font.byteLength<256*1024,'shared headline font should stay under 256 KiB');
 const css=readFileSync(resolve(root,'site-navigation.css'),'utf8');
 assert.match(css,/font-display:swap/);
 assert.match(css,/noto-serif-tc-headings-v8\.woff2/);
 let checked=0;
 for(const path of publicPages){
  const html=readFileSync(resolve(root,path),'utf8');
  if(/<meta name="robots" content="noindex/.test(html))continue;
  checked++;
  assert.match(html,/\/site-navigation\.css\?v=/,path);
  assert.doesNotMatch(html,/fonts\.googleapis\.com|fonts\.gstatic\.com/,path);
  for(const heading of html.matchAll(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/gi)){
   const text=heading[1].replace(/<[^>]*>/g,'');
   for(const char of text){
    if(char.codePointAt(0)>=0x3400&&char.codePointAt(0)<=0x9fff)
     assert.ok(glyphs.has(char),`${path} has an uncovered heading character: ${char}`);
   }
  }
 }
 assert.ok(checked>=39);
});
