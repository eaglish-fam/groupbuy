import {readFileSync, writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import sharp from 'sharp';

const root=new URL('../',import.meta.url),article=new URL('blog/leofoo/index.html',root);
const sources=['cover','congo','kenya','family-room','meerkats','hotel-walkway-v2','hippo-experience','family-adventure','park-train'];
const grid=new Set(['congo','kenya','meerkats','hotel-walkway-v2','hippo-experience','family-adventure']);
const hash=b=>createHash('sha256').update(b).digest('hex');
const manifest={schema:'eaglish.leofoo-responsive-images/v1',quality:72,effort:6,crop:false,originalsPreserved:true,images:[]};
let html=readFileSync(article,'utf8');
for(const name of sources){
 const source='/assets/leofoo/'+name+'.webp',input=readFileSync(new URL('.'+source,root));
 const meta=await sharp(input).metadata();
 const widths=[...new Set([480,800,1200].map(w=>Math.min(w,meta.width)))];
 const sizes=name==='cover'
  ? '(max-width: 700px) 100vw, (max-width: 1119px) calc(100vw - 80px), 1040px'
  : grid.has(name)
   ? '(max-width: 760px) calc(100vw - 44px), (max-width: 1007px) calc((100vw - 112px) / 2), 448px'
   : '(max-width: 760px) calc(100vw - 44px), (max-width: 1007px) calc(100vw - 88px), 920px';
 const variants=[];
 for(const width of widths){
  const path='/assets/leofoo/'+name+'-fast-'+width+'.webp';
  const data=await sharp(input).resize({width,withoutEnlargement:true}).webp({quality:72,effort:6}).toBuffer();
  if(data.length>150000)throw Error('Image exceeds delivery budget: '+path);
  writeFileSync(new URL('.'+path,root),data);
  const output=await sharp(data).metadata();
  variants.push({path,width:output.width,height:output.height,bytes:data.length,sha256:hash(data)});
 }
 const srcset=variants.map(v=>`${v.path} ${v.width}w`).join(', ');
 let count=0;
 html=html.replace(/<img\b[^>]*>/g,tag=>{
  if(!tag.includes(`src="${source}"`))return tag;
  count++;
  return tag.replace(/\s(?:srcset|sizes|decoding)="[^"]*"/g,'').replace(/>$/,` srcset="${srcset}" sizes="${sizes}" decoding="async">`);
 });
 if(count!==1)throw Error('Expected one article image: '+source);
 manifest.images.push({source,sourceWidth:meta.width,sourceHeight:meta.height,sourceBytes:input.length,sourceSha256:hash(input),sizes,variants});
}
// Mechanical responsive-markup rewrite; source pixels and article copy are unchanged.
writeFileSync(article,html);
writeFileSync(new URL('assets/leofoo/responsive-manifest.json',root),JSON.stringify(manifest,null,2)+'\n');
const before=manifest.images.reduce((n,i)=>n+i.sourceBytes,0),after=manifest.images.reduce((n,i)=>n+i.variants.at(-1).bytes,0);
console.log(JSON.stringify({images:manifest.images.length,variants:manifest.images.reduce((n,i)=>n+i.variants.length,0),originalBytes:before,maxSizeVariantBytes:after,reductionPercent:Math.round((1-after/before)*100),originalsPreserved:true}));
