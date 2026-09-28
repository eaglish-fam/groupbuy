#!/usr/bin/env node
// Canonical document URLs only. Query links canonicalise to the parent document.
import {readFileSync,writeFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {collectIndexablePages} from './site-seo-inventory.mjs';
const root=resolve(import.meta.dirname,'..');
const origin='https://www.eaglish.store';
const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value||'')&&Number.isFinite(Date.parse(value+'T00:00:00Z'))&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;

// Never substitute the build clock for a missing content modification date.
export function supportedLastmod({file,html='',dirty=false,committed=''}){
 if(file.startsWith('blog/')&&file.endsWith('/index.html')){
  const schemaDate=html.match(/"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})"/)?.[1];
  if(validDate(schemaDate))return schemaDate;
 }
 if(dirty)return undefined;
 return validDate(committed)?committed:undefined;
}

export function generateSitemap(siteRoot=root){
 const pages=collectIndexablePages(siteRoot);
 const lines=pages.map(page=>{
  const url=origin+page.path;
  const html=readFileSync(resolve(siteRoot,page.file),'utf8');
  const dirty=Boolean(execFileSync('git',['status','--porcelain','--',page.file],{cwd:siteRoot,encoding:'utf8'}).trim());
  const committed=dirty?'':execFileSync('git',['log','-1','--format=%cs','--',page.file],{cwd:siteRoot,encoding:'utf8'}).trim();
  const date=supportedLastmod({file:page.file,html,dirty,committed});
  return '  <url>\n    <loc>'+url+'</loc>\n'+(date?'    <lastmod>'+date+'</lastmod>\n':'')+'  </url>';
 });
 const xml='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+lines.join('\n')+'\n</urlset>\n';
 writeFileSync(resolve(siteRoot,'sitemap.xml'),xml);
 console.log('[sitemap] '+pages.length+' canonical documents; lastmod only from article metadata or clean Git history');
 return xml;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))generateSitemap();
