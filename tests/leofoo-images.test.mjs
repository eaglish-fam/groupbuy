import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url),hash=b=>createHash('sha256').update(b).digest('hex');
test('Leofoo serves compressed responsive images without overwriting or cropping source photographs',()=>{
 const manifest=JSON.parse(readFileSync(new URL('assets/leofoo/responsive-manifest.json',root),'utf8'));
 const html=readFileSync(new URL('blog/leofoo/index.html',root),'utf8');
 assert.equal(manifest.images.length,9);assert.equal(manifest.crop,false);assert.equal(manifest.originalsPreserved,true);
 let before=0,after=0;
 for(const image of manifest.images){
  assert.equal(hash(readFileSync(new URL('.'+image.source,root))),image.sourceSha256);
  const tag=[...html.matchAll(/<img\b[^>]*>/g)].map(m=>m[0]).find(t=>t.includes(`src="${image.source}"`));
  assert.ok(tag);assert.ok(tag.includes(`sizes="${image.sizes}"`));assert.match(tag,/decoding="async"/);
  for(const v of image.variants){
   const file=new URL('.'+v.path,root);assert.ok(tag.includes(`${v.path} ${v.width}w`));
   assert.equal(statSync(file).size,v.bytes);assert.equal(hash(readFileSync(file)),v.sha256);assert.ok(v.bytes<=150000);
   assert.ok(Math.abs(v.height-v.width*image.sourceHeight/image.sourceWidth)<=1,'same uncropped aspect ratio');
  }
  if(image.source.endsWith('/cover.webp'))assert.match(tag,/fetchpriority="high"/);else assert.match(tag,/loading="lazy"/);
  before+=image.sourceBytes;after+=image.variants.at(-1).bytes;
 }
 assert.ok(after<before*.6,'maximum-size responsive photos save at least 40%');
});
