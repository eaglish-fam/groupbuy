import {readFile,stat} from 'node:fs/promises';
import {resolve} from 'node:path';
import sharp from 'sharp';

const root=resolve(import.meta.dirname,'..');
const pages=['/trip/','/trip/new-zealand/','/trip/new-zealand/christchurch/','/trip/new-zealand/akaroa/','/trip/new-zealand/christchurch/3-days/','/trip/thailand/','/trip/thailand/bangkok/','/trip/guides/bangkok-with-kids/'];
const maxBytes=width=>width<=640?120_000:width<=960?220_000:400_000;
let checked=0;
for(const page of pages){
 const html=await readFile(resolve(root,page.slice(1),'index.html'),'utf8');
 for(const [tag] of html.matchAll(/<img\b[^>]*>/g)){
  const src=tag.match(/\bsrc="(\/trip\/assets\/[^"?]+\.webp)"/)?.[1];
  if(!src)continue;
  const srcPath=resolve(root,'.'+src);
  const [srcMeta,srcFile]=await Promise.all([sharp(srcPath).metadata(),stat(srcPath)]);
  if(srcMeta.width>1440||srcFile.size>maxBytes(srcMeta.width))throw new Error(`${page}: fallback ${src} is ${srcMeta.width}px/${srcFile.size} bytes; use a compressed desktop variant`);
  const srcset=tag.match(/\bsrcset="([^"]+)"/)?.[1];
  const sizes=tag.match(/\bsizes="([^"]+)"/)?.[1];
  if(!srcset||!sizes)throw new Error(`${page}: ${src} needs srcset and sizes`);
  const variants=[...srcset.matchAll(/(\/trip\/assets\/[^\s,]+\.webp)\s+(\d+)w/g)];
  if(variants.length<2||!variants.some(v=>Number(v[2])<=640))throw new Error(`${page}: ${src} needs a <=640px variant`);
  for(const [,url,declared] of variants){
   const path=resolve(root,'.'+url);
   const [meta,file]=await Promise.all([sharp(path).metadata(),stat(path)]);
   const width=Number(declared);
   if(meta.width!==width)throw new Error(`${page}: ${url} declares ${width}px, actual ${meta.width}px`);
   if(file.size>maxBytes(width))throw new Error(`${page}: ${url} is ${file.size} bytes; budget ${maxBytes(width)}`);
   checked++;
  }
 }
}
console.log(`Trip image check: ${checked} responsive candidates across ${pages.length} pages within size budgets.`);
