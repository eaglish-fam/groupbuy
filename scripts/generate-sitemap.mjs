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
  ...readdirSync(resolve(root,'blog'),{withFileTypes:true})
    .filter(d=>d.isDirectory()&&existsSync(resolve(root,'blog',d.name,'index.html')))
    .map(d=>({path:'/blog/'+d.name+'/',file:'blog/'+d.name+'/index.html'})),
  {path:'/toolbox.html',file:'toolbox.html'},
  {path:'/zosia.html',file:'zosia.html'},
  {path:'/trading.html',file:'trading.html'}
];
function lastmod(file){
  const dirty=execFileSync('git',['status','--porcelain','--',file],{cwd:root,encoding:'utf8'}).trim();
  if(dirty)return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei'}).format(new Date());
  const committed=execFileSync('git',['log','-1','--format=%cs','--',file],{cwd:root,encoding:'utf8'}).trim();
  return committed||new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Taipei'}).format(new Date());
}
const lines=pages.map(p=>{
  const url=origin+p.path;
  return '  <url>\n    <loc>'+url+'</loc>\n    <lastmod>'+lastmod(p.file)+'</lastmod>\n  </url>';
});
writeFileSync(resolve(root,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+lines.join('\n')+'\n</urlset>\n');
console.log('[sitemap] '+pages.length+' canonical documents; no duplicate query URLs');
