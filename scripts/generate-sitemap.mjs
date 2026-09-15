#!/usr/bin/env node
// Canonical document URLs only. Product query links remain shareable but canonicalise to /.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';
const root = resolve(import.meta.dirname, '..');
const origin = 'https://www.eaglish.store';
const pages = [
  {path:'/',file:'index.html'},
  {path:'/blog/',file:'blog/index.html'},
  {path:'/guides/',file:'guides/index.html'},
  {path:'/how-we-select/',file:'how-we-select/index.html'},
  {path:'/trip/',file:'trip/index.html'},
  ...['new-zealand/','new-zealand/christchurch/','new-zealand/akaroa/','new-zealand/christchurch/3-days/','thailand/','thailand/bangkok/'].map(p=>({path:'/trip/'+p,file:'trip/'+p+'index.html'})),
  {path:'/trip/guides/bangkok-with-kids/',file:'trip/guides/bangkok-with-kids/index.html'},
  {path:'/trip/flights/',file:'trip/flights/index.html'},
  ...readdirSync(resolve(root,'blog'),{withFileTypes:true})
    .filter(d=>d.isDirectory()&&existsSync(resolve(root,'blog',d.name,'index.html')))
    .map(d=>({path:'/blog/'+d.name+'/',file:'blog/'+d.name+'/index.html'})),
];
function lastmod(file){
  if(file.startsWith('blog/')&&file.endsWith('/index.html')){
    const html=readFileSync(resolve(root,file),'utf8');
    const schemaDate=html.match(/"dateModified"\s*:\s*"(\d{4}-\d{2}-\d{2})"/)?.[1];
    if(schemaDate)return schemaDate;
  }
  const dirty=execFileSync('git',['status','--porcelain','--',file],{cwd:root,encoding:'utf8'}).trim();
  if(dirty)return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei'}).format(new Date());
  const committed=execFileSync('git',['log','-1','--format=%cs','--',file],{cwd:root,encoding:'utf8'}).trim();
  return committed||new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei'}).format(new Date());
}
const lines=pages.map(p=>{
  const url=origin+p.path;
  const html=readFileSync(resolve(root,p.file),'utf8');
  const canonical=(html.match(/<link\b[^>]*>/gi)||[]).find(t=>/rel=["']canonical["']/i.test(t))?.match(/href=["']([^"']+)/i)?.[1];
  if(canonical!==url||/<meta\b[^>]*content=["'][^"']*noindex/i.test(html)||/[?#]/.test(p.path))throw Error('Non-indexable sitemap document: '+p.path);
  return '  <url>\n    <loc>'+url+'</loc>\n    <lastmod>'+lastmod(p.file)+'</lastmod>\n  </url>';
});
writeFileSync(resolve(root,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+lines.join('\n')+'\n</urlset>\n');
console.log('[sitemap] '+pages.length+' canonical documents; no duplicate query URLs');
