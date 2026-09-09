#!/usr/bin/env node
// Canonical document URLs only. Product query links remain shareable but canonicalise to /.
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const origin = 'https://www.eaglish.store';
const old = readFileSync(resolve(root, 'sitemap.xml'), 'utf8');
const dates = new Map([...old.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/g)].map(m=>[m[1],m[2]]));
const pages = [
  {path:'/',frequency:'daily',priority:1},
  {path:'/blog/',frequency:'daily',priority:0.9},
  ...readdirSync(resolve(root,'blog'),{withFileTypes:true})
    .filter(d=>d.isDirectory()&&existsSync(resolve(root,'blog',d.name,'index.html')))
    .map(d=>({path:'/blog/'+d.name+'/',frequency:'weekly',priority:0.8})),
  {path:'/toolbox.html',frequency:'weekly',priority:0.8},
  {path:'/zosia.html',frequency:'monthly',priority:0.6},
  {path:'/trading.html',frequency:'weekly',priority:0.6}
];
const lines=pages.map(p=>{
  const url=origin+p.path;
  const day=dates.get(url)||new Date().toISOString().slice(0,10);
  return '  <url>\n    <loc>'+url+'</loc>\n    <lastmod>'+day+'</lastmod>\n    <changefreq>'+p.frequency+'</changefreq>\n    <priority>'+p.priority+'</priority>\n  </url>';
});
writeFileSync(resolve(root,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+lines.join('\n')+'\n</urlset>\n');
console.log('[sitemap] '+pages.length+' canonical documents; no duplicate query URLs');
