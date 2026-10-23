// One-off helpers that restate an already published legacy travel article in
// the approved-package shape. They copy published text, photos and links; they
// never write new facts. Each country migration script imports these.
import {readFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';

export const root=resolve(import.meta.dirname,'../..');
export const sha256=buffer=>createHash('sha256').update(buffer).digest('hex');

// Width and height straight from the WebP header (VP8, VP8L or VP8X).
export function webpSize(buffer){
 if(buffer.toString('ascii',0,4)!=='RIFF'||buffer.toString('ascii',8,12)!=='WEBP')throw Error('Not a WebP file');
 const chunk=buffer.toString('ascii',12,16);
 if(chunk==='VP8 ')return {width:buffer.readUInt16LE(26)&0x3fff,height:buffer.readUInt16LE(28)&0x3fff};
 if(chunk==='VP8L'){const b=buffer.readUInt32LE(21);return {width:(b&0x3fff)+1,height:((b>>14)&0x3fff)+1};}
 if(chunk==='VP8X')return {width:1+buffer.readUIntLE(24,3),height:1+buffer.readUIntLE(27,3)};
 throw Error('Unknown WebP chunk '+chunk);
}

// Every published size of /trip/assets/<id>.webp, smallest first, capped at 1440px.
export function publishedVariants(id){
 const out=[];
 for(const suffix of ['-640','-960','-1440','']){
  const url=`/trip/assets/${id}${suffix}.webp`,file=resolve(root,'.'+url);
  if(!existsSync(file))continue;
  const buffer=readFileSync(file),{width,height}=webpSize(buffer);
  if(width>1440||out.some(v=>v.width===width))continue;
  out.push({url,width,height,bytes:buffer.length,sha256:sha256(buffer)});
 }
 if(!out.length)throw Error('No published variants for '+id);
 return out.sort((a,b)=>a.width-b.width);
}

// The repo master (largest published size) stands in as lineage source: the
// original upload or video bytes are not in the repo. legacyProvenance keeps
// what the old article recorded about the original.
export function legacyAsset(id,{alt,caption,sourceIds,frame,provenance}){
 const variants=publishedVariants(id),master=variants.at(-1);
 if(!variants.some(v=>v.width<=640))throw Error('Need a ≤640px variant for '+id);
 const lineage={sourceSha256:master.sha256,sourceWidth:master.width,sourceHeight:master.height,kind:frame?'video-frame':'photo',activePicture:{x:0,y:0,width:master.width,height:master.height},
  ...(frame?{pts:Math.round(frame.second*90000),timebase:'1/90000'}:{})};
 return {assetId:id,width:master.width,height:master.height,alt,caption:caption||alt,focalPoint:[50,50],sourceIds,variants,lineage,...(provenance?{legacyProvenance:provenance}:{})};
}

// Minimal HTML reading for the published legacy pages.
export const decode=s=>s.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&');
export const plain=html=>decode(html.replace(/<br\s*\/?>/g,'').replace(/<[^>]+>/g,'')).replace(/\s+/g,' ').trim();
// Keep links as inline Markdown (the approved renderer escapes everything else).
export function inline(html,{anchorMap={}}={}){
 const withLinks=html.replace(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g,(m,href,label)=>{
  let url=decode(href);
  if(url.startsWith('#')&&anchorMap[url.slice(1)])url='#'+anchorMap[url.slice(1)];
  const text=plain(label).replace(/\s*↗$/,'');
  return /^(https:\/\/|\/trip\/|#)/.test(url)?`[${text}](${url})`:text;
 });
 return plain(withLinks);
}
export function section(html,id){
 const start=html.search(new RegExp(`<section\\b[^>]*\\bid="${id}"`));if(start<0)return '';
 let depth=0;const re=/<(\/?)section\b[^>]*>/g;re.lastIndex=start;let m;
 while((m=re.exec(html))){depth+=m[1]?-1:1;if(!depth)return html.slice(start,re.lastIndex);}
 throw Error('Unclosed section '+id);
}
export const links=html=>[...html.matchAll(/<a\b[^>]*href="(https:\/\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].map(m=>({label:plain(m[2]).replace(/\s*↗$/,''),url:decode(m[1])}));
export const faqs=html=>[...html.matchAll(/<details>\s*<summary>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/g)].map(m=>({question:plain(m[1]),answer:[...m[2].matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/g)].map(p=>inline(p[1])).join(' ')}));

// A legacy <section> with h3 subsections becomes one module: lead paragraphs
// plus subsections whose ids are stable slugs of the parent.
export function moduleFromSection(html,{id,title,sourceIds,anchorMap,skipImages=true}){
 const body=html.replace(/^<section[^>]*>/,'').replace(/<\/section>$/,'').replace(/<p class="eyebrow">[\s\S]*?<\/p>/,'').replace(/<h2[^>]*>[\s\S]*?<\/h2>/,'').replace(/<p class="article-return">[\s\S]*?<\/p>/g,'');
 const h2=plain(html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/)?.[1]||'');
 const parts=body.split(/(?=<h3\b)/);
 const textOf=chunk=>[...chunk.replace(skipImages?/<figure>[\s\S]*?<\/figure>/g:/$^/,'').matchAll(/<(p|li)\b(?![^>]*class="(?:place-english|origin-tag)")[^>]*>([\s\S]*?)<\/\1>/g)].map(m=>inline(m[2],{anchorMap})).filter(Boolean);
 const linksOf=chunk=>links(chunk.replace(/<p\b[\s\S]*?<\/p>/g,''));
 const lead=parts[0].startsWith('<h3')?'':parts.shift();
 const subsections=parts.map((chunk,i)=>({id:`${id}-${i+1}`,title:plain(chunk.match(/<h3[^>]*>([\s\S]*?)<\/h3>/)[1]),paragraphs:textOf(chunk.replace(/<h3[^>]*>[\s\S]*?<\/h3>/,'')),sourceIds,links:linksOf(chunk)})).filter(s=>s.paragraphs.length||s.links.length);
 return {title:title||h2,paragraphs:textOf(lead),sourceIds,links:linksOf(lead),...(subsections.length?{subsections}:{})};
}
