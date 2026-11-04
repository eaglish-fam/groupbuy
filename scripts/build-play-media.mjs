// GB-028: 角色卡體驗的商品圖庫。從每篇選物誌文章抓出已公開的圖片，讓 /play/ 的商品卡可以左右滑動看多張圖。
// 只讀 repo 內已發布的文章與 product-content.js；不讀 Sheet、不下載任何東西。
import {readFileSync,writeFileSync,existsSync} from 'node:fs';
import {createRequire} from 'node:module';

const root=new URL('../',import.meta.url);
const require=createRequire(import.meta.url);
const {catalog}=require('../product-content.js');
const MAX=8;
const decode=s=>s.replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');

export function articleImages(html,articlePath){
  const body=(html.match(/<article\b[\s\S]*?<\/article>/i)||[html])[0];
  const out=[],seen=new Set();
  for(const tag of body.match(/<img\b[^>]*>/gi)||[]){
    const src=decode((tag.match(/\ssrc="([^"]+)"/i)||[])[1]||'');
    if(!src||/\.svg(?:$|\?)/i.test(src)||/^data:|^https?:/i.test(src))continue;
    const url=src.startsWith('/')?src:new URL(src,'https://x'+articlePath).pathname;
    if(!/^\/(?:assets|blog)\//.test(url)||seen.has(url))continue;
    seen.add(url);
    out.push({src:url,alt:decode((tag.match(/\salt="([^"]*)"/i)||[])[1]||'')});
    if(out.length>=MAX)break;
  }
  return out;
}

export function buildPlayMedia(){
  const products={};
  for(const entry of Object.values(catalog)){
    if(!entry.article)continue;
    const file=new URL('.'+entry.article+'index.html',root);
    if(!existsSync(file))continue;
    const images=articleImages(readFileSync(file,'utf8'),entry.article)
      .filter(i=>existsSync(new URL('.'+i.src,root)));
    if(entry.image&&!images.some(i=>i.src===entry.image)&&existsSync(new URL('.'+entry.image,root)))images.unshift({src:entry.image,alt:entry.title||''});
    if(!images.length)continue;
    for(const brand of entry.brands)products[brand]=images.slice(0,MAX);
  }
  return {schema:'eaglish.play-media/v1',note:'由 scripts/build-play-media.mjs 從已發布的選物誌產生，不要手改',products};
}

if(import.meta.url===`file://${process.argv[1]}`){
  const data=buildPlayMedia();
  writeFileSync(new URL('play/product-media.json',root),JSON.stringify(data,null,1)+'\n');
  console.log(`play/product-media.json: ${Object.keys(data.products).length} brands`);
}
