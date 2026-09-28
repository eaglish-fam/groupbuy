import {readdirSync,readFileSync} from 'node:fs';
import {join} from 'node:path';
export const siteOrigin='https://www.eaglish.store';
export const decodeHtml=value=>String(value).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&#x([0-9a-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replaceAll('&quot;','"').replaceAll('&#39;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&amp;','&');
export const attribute=(tag,key)=>decodeHtml(tag.match(new RegExp(`\\b${key}\\s*=\\s*["']([^"']*)["']`,'i'))?.[1]||'');
export const metaContent=(html,key)=>attribute((html.match(/<meta\b[^>]*>/gi)||[]).find(tag=>attribute(tag,'name')===key||attribute(tag,'property')===key)||'','content');
export const canonicalOf=html=>attribute((html.match(/<link\b[^>]*>/gi)||[]).find(tag=>attribute(tag,'rel')==='canonical')||'','href');
export const documentPath=file=>file==='index.html'?'/':'/'+file.replace(/index\.html$/,'');
export function inventoryHtml(root){
 const ignored=new Set(['node_modules','tests','.git','.github','reports','flights-pipeline']);
 const files=[];
 const walk=(directory,prefix='')=>{for(const entry of readdirSync(directory,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
  if(entry.name.startsWith('.')||ignored.has(entry.name))continue;
  const relative=prefix+entry.name;
  if(entry.isDirectory())walk(join(directory,entry.name),relative+'/');
  else if(entry.isFile()&&entry.name.endsWith('.html'))files.push(relative);
 }};
 walk(root);
 return files.map(file=>{
  const html=readFileSync(join(root,file),'utf8');
  const noindex=[metaContent(html,'robots'),metaContent(html,'googlebot')].some(value=>/\bnoindex\b/i.test(value));
  const redirect=(html.match(/<meta\b[^>]*>/gi)||[]).some(tag=>attribute(tag,'http-equiv').toLowerCase()==='refresh')||/\b(?:window\.)?location\.replace\s*\(/.test(html);
  return {file,html,path:documentPath(file),canonical:canonicalOf(html),noindex,redirect};
 });
}
export function collectIndexablePages(root){
 const records=inventoryHtml(root).filter(page=>!page.noindex&&!page.redirect);
 const seen=new Set();
 for(const page of records){
  const expected=siteOrigin+page.path;
  if(page.canonical!==expected)throw Error(`Indexable document canonical mismatch: ${page.file}; expected ${expected}, got ${page.canonical||'missing'}`);
  if(seen.has(page.canonical))throw Error(`Duplicate canonical: ${page.canonical}`);
  seen.add(page.canonical);
 }
 return records;
}
