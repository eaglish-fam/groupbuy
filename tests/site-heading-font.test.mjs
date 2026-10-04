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
 const travelGlyphs=new Set(readFileSync(resolve(root,'assets/fonts/travel-heading-glyphs-r24.txt'),'utf8'));
 const singaporeGlyphs=new Set(readFileSync(resolve(root,'assets/fonts/singapore-heading-glyphs-v1.txt'),'utf8'));
 const approvedGlyphs=new Set(readFileSync(resolve(root,'assets/fonts/approved-travel-heading-glyphs-v1.txt'),'utf8').trim());
 const approvedFont=readFileSync(resolve(root,'assets/fonts/noto-serif-tc-approved-travel-v1.woff2'));
 assert.equal(approvedGlyphs.size,37);assert.equal(approvedFont.toString('ascii',0,4),'wOF2');assert.ok(approvedFont.byteLength<=24576);
 const singaporeFont=readFileSync(resolve(root,'assets/fonts/noto-serif-tc-singapore-v1.woff2'));
 assert.equal(singaporeFont.toString('ascii',0,4),'wOF2');assert.ok(singaporeFont.byteLength<16000);
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
  const approved=html.includes('<style data-approved-publication-font>');
  if(approved){
   assert.match(html,/class="(?:approved-country|bkk-guide city-guide approved-city-guide)"/);
   assert.match(html,/src:url\("\/assets\/fonts\/noto-serif-tc-approved-travel-v1\.woff2"\)/);
   const ranges=html.match(/data-approved-publication-font>[^<]*unicode-range:([^}]+)/)?.[1].split(',')||[];
   assert.deepEqual(new Set(ranges),new Set([...approvedGlyphs].map(c=>'U+'+c.codePointAt(0).toString(16).toUpperCase())));
  }
  assert.match(html,/\/site-navigation\.css\?v=/,path);
  assert.doesNotMatch(html,/fonts\.googleapis\.com|fonts\.gstatic\.com/,path);
  const scoped=path==='trip/index.html'||path==='trip/guides/cebu-bohol-with-kids/index.html';
  const atlasStart=html.indexOf('<div class="atlas-component"'),atlasEnd=html.indexOf('<section class="home-planning');
  if(scoped)assert.match(html,/\/trip\/heading-theme-r24\.css/);
  if(atlasStart>=0)assert.match(readFileSync(resolve(root,'trip/atlas-component.css'),'utf8'),/\.atlas-component h1,\.atlas-component h2,\.atlas-component h3\{font-family:'Songti TC'/);
  for(const heading of html.matchAll(/<h[1-3]\b[^>]*>([\s\S]*?)<\/h[1-3]>/gi)){
   if(atlasStart>=0&&heading.index>atlasStart&&heading.index<atlasEnd)continue;
   const text=heading[1].replace(/<[^>]*>/g,'');
   for(const char of text){
    if(char.codePointAt(0)>=0x3400&&char.codePointAt(0)<=0x9fff)
     assert.ok((scoped?travelGlyphs:glyphs).has(char)||(path==='trip/singapore/index.html'&&singaporeGlyphs.has(char))||(approved&&approvedGlyphs.has(char)),`${path} has an uncovered heading character: ${char}`);
   }
  }
 }
 assert.ok(checked>=39);
});
