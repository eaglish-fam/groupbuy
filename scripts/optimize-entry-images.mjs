import {readFileSync, writeFileSync, existsSync, statSync} from 'node:fs';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';

const require=createRequire(import.meta.url);
const {catalog}=require('../product-content.js');
const root=new URL('../',import.meta.url);
const pages=['design/index.html','index.html','blog/index.html'];
const sources=new Set(Object.values(catalog).flatMap(item=>[item.image,item.cardImage]).filter(Boolean));

for(const page of pages){
  const html=readFileSync(new URL(page,root),'utf8');
  for(const match of html.matchAll(/<img\b[^>]*\bsrc="(\/assets\/[^"?]+\.webp)"[^>]*>/g))sources.add(match[1]);
}

const imageMeta=new Map();
for(const src of sources){
  if(!/^\/assets\/[a-z0-9/_-]+\.webp$/i.test(src))throw Error(`Unexpected image path: ${src}`);
  const file=new URL(`.${src}`,root);
  if(!existsSync(file))throw Error(`Missing entry image: ${src}`);
  const meta=await sharp(fileURLToPath(file)).metadata();
  if(!meta.width||!meta.height)throw Error(`Unreadable entry image: ${src}`);
  const variants=[];
  for(const width of [480,960]){
    if(meta.width<=width)continue;
    const path=src.replace(/\.webp$/,`-${width}.webp`);
    const output=new URL(`.${path}`,root);
    if(!existsSync(output)||statSync(output).mtimeMs<statSync(file).mtimeMs){
      await sharp(fileURLToPath(file)).resize({width,withoutEnlargement:true}).webp({quality:76,effort:5}).toFile(fileURLToPath(output));
    }
    variants.push({path,width});
  }
  imageMeta.set(src,{width:meta.width,variants});
}
writeFileSync(new URL('design/entry-image-widths.js',root),
  `window.EntryImageWidths=Object.freeze(${JSON.stringify(Object.fromEntries([...imageMeta].map(([src,meta])=>[src,meta.width])))});\n`);

for(const page of pages){
  let html=readFileSync(new URL(page,root),'utf8');
  html=html.replace(/<img\b[^>]*\bsrc="(\/assets\/[^"?]+\.webp)"[^>]*>/g,(tag,src,offset)=>{
    const meta=imageMeta.get(src);
    if(!meta||!meta.variants.length)return tag;
    const hero=page!=='blog/index.html'&&html.slice(Math.max(0,offset-400),offset).includes('hero-image-link');
    const sizes=hero?'(max-width:700px) 100vw, 50vw':page==='blog/index.html'?'(max-width:700px) 90vw, 45vw':'(max-width:700px) 90vw, (max-width:1100px) 45vw, 30vw';
    const srcset=[...meta.variants.map(v=>`${v.path} ${v.width}w`),`${src} ${meta.width}w`].join(', ');
    let result=tag.replace(/\s(?:srcset|sizes)="[^"]*"/g,'');
    result=result.replace(/\s*\/?>(?=$)/,ending=>` srcset="${srcset}" sizes="${sizes}"${ending}`);
    if(!/\bdecoding=/.test(result))result=result.replace(/\s*\/?>(?=$)/,ending=>` decoding="async"${ending}`);
    if(!/\bloading=/.test(result))result=result.replace(/\s*\/?>(?=$)/,ending=>` loading="${hero?'eager':'lazy'}"${ending}`);
    if(!/\bfetchpriority=/.test(result))result=result.replace(/\s*\/?>(?=$)/,ending=>` fetchpriority="${hero?'high':'low'}"${ending}`);
    return result;
  });
  writeFileSync(new URL(page,root),html);
}
console.log(`Optimized ${imageMeta.size} homepage and journal images with responsive variants`);
