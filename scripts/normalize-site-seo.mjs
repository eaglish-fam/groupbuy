#!/usr/bin/env node
// Keep technical metadata consistent; never rewrite article narrative or dates.
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import sharp from 'sharp';
import {collectIndexablePages,metaContent,attribute,decodeHtml,siteOrigin} from './site-seo-inventory.mjs';
const root=resolve(import.meta.dirname,'..');
const write=process.argv.includes('--write');
const runtimeVersion=createHash('sha256').update(readFileSync(resolve(root,'site-runtime.js'))).digest('hex').slice(0,12);
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
function upsert(html,key,value,name='property'){
 const tags=html.match(/<meta\b[^>]*>/gi)||[];
 const old=tags.find(tag=>attribute(tag,name)===key);
 const tag=`<meta ${name}="${key}" content="${escape(value)}">`;
 return old?html.replace(old,tag):html.replace('</head>',tag+'\n</head>');
}
let changed=0;
for(const page of collectIndexablePages(root)){
 let html=page.html;
 // Content-based version changes whenever analytics changes, on every public page.
 html=html.replace(/(src=["'])\/site-runtime\.js(?:\?[^"']*)?(["'])/g, `$1/site-runtime.js?v=${runtimeVersion}$2`);
 const title=decodeHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'').replace(/\s+/g,' ').trim();
 const description=metaContent(html,'description');
 if(!title||!description)throw Error(`Missing editorial metadata: ${page.file}`);
 const image=metaContent(html,'og:image');
 if(!image.startsWith(siteOrigin+'/'))throw Error(`Expected local share image: ${page.file}`);
 const imagePath=new URL(image).pathname;
 const dimensions=await sharp(resolve(root,decodeURIComponent(imagePath).slice(1))).metadata();
 const images=html.match(/<img\b[^>]*>/gi)||[];
 const imageTag=images.find(tag=>attribute(tag,'src')===imagePath);
 const alt=metaContent(html,'og:image:alt')||attribute(imageTag||'','alt')||(imagePath.includes('logo-eaglish')?'鷹家買物社標誌':title);
 for(const [key,value] of Object.entries({'og:url':page.canonical,'og:title':title,'og:description':description,'og:image:alt':alt,'og:image:width':dimensions.width,'og:image:height':dimensions.height}))html=upsert(html,key,value);
 if(!metaContent(html,'og:site_name'))html=upsert(html,'og:site_name',page.path.startsWith('/trip/')?'鷹家遠行所':page.path.startsWith('/blog/')?'鷹家選物誌':'鷹家買物社');
 for(const [key,value] of Object.entries({'twitter:card':'summary_large_image','twitter:title':title,'twitter:description':description,'twitter:image':image,'twitter:image:alt':alt}))html=upsert(html,key,value,'name');
 if(html!==page.html){changed++;if(write)writeFileSync(resolve(root,page.file),html);}
}
// An optional human-readable directory, not a requirement or promise of AI inclusion.
const pages=collectIndexablePages(root);
const item=page=>`- [${decodeHtml(page.html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'').replace(/\s+/g,' ').replaceAll('[','').replaceAll(']','')}](${page.canonical})：${metaContent(page.html,'description')}`;
const groups=[['主要入口',pages.filter(p=>['/','/blog/','/guides/','/how-we-select/','/trip/'].includes(p.path))],['旅行目的地與指南',pages.filter(p=>p.path.startsWith('/trip/')&&p.path!=='/trip/')],['選物文章',pages.filter(p=>p.path.startsWith('/blog/')&&p.path!=='/blog/')]];
const llms=`# 鷹式一家：買物社、選物誌與遠行所\n\n> 鷹式一家 Eaglish Family 的官方網站，提供生活選物筆記、當期團購入口，以及有實訪照片的旅行目的地與親子指南。\n\n這份目錄整理本站正式頁面，方便找到內容來源。頁面正文與引用來源是內容依據；此檔不是搜尋收錄、AI 引用或排名保證。\n\n## 內容與時效\n\n- 選物文章與旅行指南使用固定網址，引用時優先連到對應文章或目的地。\n- 團購價格、開團狀態、票券、營業時間與交通條件可能變動，請確認正文日期及供應商最新資訊。查詢參數不是獨立文章。\n- 便宜機票雷達目前暫停更新，不能從舊頁或舊紀錄推定仍有可購買票價。\n- [我們怎麼選物](${siteOrigin}/how-we-select/)說明生活紀錄、廠商資料與團購合作的區別。\n- [Sitemap](${siteOrigin}/sitemap.xml)列出可索引的正式網址；製圖來源、內部工具與測試頁不列入。\n\n${groups.map(([heading,records])=>`## ${heading}\n\n${records.map(item).join('\n')}`).join('\n\n')}\n`;
if(readFileSync(resolve(root,'llms.txt'),'utf8')!==llms){changed++;if(write)writeFileSync(resolve(root,'llms.txt'),llms);}
// The reading manifest fingerprints delivered HTML, including its metadata.
const manifestPath=resolve(root,'content-index.json');
if(existsSync(manifestPath)){
 const before=readFileSync(manifestPath,'utf8');
 const manifest=JSON.parse(before);
 for(const article of manifest.articles||[]){
  if(!/^[a-z0-9-]+$/.test(article.slug))throw Error('Invalid article slug in content manifest');
  article.sourceHash=createHash('sha256').update(readFileSync(resolve(root,`blog/${article.slug}/index.html`))).digest('hex');
 }
 const after=JSON.stringify(manifest,null,2)+'\n';
 if(before!==after){changed++;if(write)writeFileSync(manifestPath,after);}
}
console.log(`[site-seo] ${pages.length} indexable documents; ${changed} ${write?'files normalized':'files need normalization'}`);
if(!write&&changed)process.exitCode=1;
