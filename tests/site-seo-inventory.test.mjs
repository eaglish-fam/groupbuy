import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {collectIndexablePages,inventoryHtml,metaContent,siteOrigin} from '../scripts/site-seo-inventory.mjs';
const root=resolve(import.meta.dirname,'..');
function fixture(t){const directory=mkdtempSync(join(tmpdir(),'eaglish-seo-'));t.after(()=>rmSync(directory,{recursive:true,force:true}));return directory;}
const page=url=>`<html><head><link rel="canonical" href="${url}"></head><body><h1>Real guide</h1></body></html>`;
function save(root,file,html){const path=join(root,file);mkdirSync(resolve(path,'..'),{recursive:true});writeFileSync(path,html);}

test('sitemap inventory discovers new nested public guides without a hardcoded list',t=>{
 const directory=fixture(t);save(directory,'index.html',page(siteOrigin+'/'));
 save(directory,'trip/another-country/region/index.html',page(siteOrigin+'/trip/another-country/region/'));
 assert.deepEqual(collectIndexablePages(directory).map(p=>p.path),['/','/trip/another-country/region/']);
});
test('non-reader drafts and redirect aliases are excluded explicitly; missing canonical blocks release',t=>{
 const directory=fixture(t);save(directory,'index.html',page(siteOrigin+'/'));
 save(directory,'draft.html','<meta name="robots" content="noindex,nofollow"><h1>Draft</h1>');
 save(directory,'old/index.html','<meta http-equiv="refresh" content="0;url=/">');
 assert.equal(inventoryHtml(directory).length,3);assert.equal(collectIndexablePages(directory).length,1);
 save(directory,'forgotten/index.html','<h1>Unregistered new public guide</h1>');
 assert.throws(()=>collectIndexablePages(directory),/canonical mismatch.*forgotten/);
});
test('canonical aliases and query URLs cannot silently enter the sitemap',t=>{
 const directory=fixture(t);save(directory,'index.html',page(siteOrigin+'/?campaign=old'));
 assert.throws(()=>collectIndexablePages(directory),/canonical mismatch/);
 save(directory,'index.html',page('https://eaglish.store/'));
 assert.throws(()=>collectIndexablePages(directory),/canonical mismatch/);
});
test('every public indexable document is in sitemap with consistent social metadata',()=>{
 const pages=collectIndexablePages(root);
 const sitemap=readFileSync(join(root,'sitemap.xml'),'utf8');
 const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
 assert.deepEqual(new Set(urls),new Set(pages.map(p=>p.canonical)));
 assert.equal(urls.length,new Set(urls).size);
 for(const {file,html,canonical} of pages){
  assert.ok(metaContent(html,'description'),file+' needs description');
  assert.equal(metaContent(html,'og:url'),canonical,file);
  assert.equal(metaContent(html,'og:description'),metaContent(html,'description'),file);
  assert.equal(metaContent(html,'twitter:description'),metaContent(html,'description'),file);
  assert.equal(metaContent(html,'twitter:image'),metaContent(html,'og:image'),file);
  assert.ok(Number(metaContent(html,'og:image:width'))>0,file);
  assert.ok(Number(metaContent(html,'og:image:height'))>0,file);
 }
});
test('machine-readable directory only links real canonical documents and does not invent schema capabilities',()=>{
 const text=readFileSync(join(root,'llms.txt'),'utf8');
 assert.match(text,/旅行目的地與指南/);assert.match(text,/機票雷達目前暫停更新/);
 assert.doesNotMatch(text,/FAQPage|Hiram & Zosia|Google-Extended|GPTBot|已標 noindex/);
 const pages=new Set(collectIndexablePages(root).map(p=>p.canonical));
 for(const match of text.matchAll(/\]\((https:\/\/www\.eaglish\.store[^)]+)\)/g))assert.ok(pages.has(match[1])||match[1]===siteOrigin+'/sitemap.xml',match[1]);
});
test('article content manifest hashes track final metadata-normalized HTML',()=>{
 const manifest=JSON.parse(readFileSync(join(root,'content-index.json'),'utf8'));
 for(const article of manifest.articles){
  const actual=createHash('sha256').update(readFileSync(join(root,'blog',article.slug,'index.html'))).digest('hex');
  assert.equal(article.sourceHash,actual,article.slug);
 }
});
