// GB-028: 角色卡體驗的商品圖庫。從每篇選物誌文章抓出已公開的圖片，讓 /everyday/ 的商品卡可以左右滑動看多張圖。
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

// 封面、商品卡、分享圖是「設計過的圖」（文字＋照片排版），裁切或重複出現都會壞掉版型。
// 圖庫只放文章內文的照片；文章沒有內文照片時，才退回一張設計圖，並標 designed 讓頁面完整顯示。
const DESIGNED=/(?:^|\/)[^/]*(?:cover|product-card|share|og-)[^/]*\.(?:webp|png|jpe?g)$/i;
export function buildPlayMedia(){
  const products={};
  for(const entry of Object.values(catalog)){
    if(!entry.article)continue;
    const file=new URL('.'+entry.article+'index.html',root);
    if(!existsSync(file))continue;
    const html=readFileSync(file,'utf8');
    const designed=new Set([entry.cardImage].filter(Boolean));
    const all=articleImages(html,entry.article).filter(i=>existsSync(new URL('.'+i.src,root)));
    let images=all.filter(i=>!designed.has(i.src)&&!DESIGNED.test(i.src));
    // 圖解放後面，先看生活照。
    images=[...images.filter(i=>!/diagram/i.test(i.src)),...images.filter(i=>/diagram/i.test(i.src))];
    if(!images.length){
      const fallback=[entry.cardImage,entry.image].find(src=>src&&existsSync(new URL('.'+src,root)));
      if(fallback)images=[{src:fallback,alt:entry.title||'',designed:true}];
    }
    if(!images.length)continue;
    for(const brand of entry.brands)products[brand]=images.slice(0,MAX);
  }
  return {schema:'eaglish.play-media/v2',note:'由 scripts/build-play-media.mjs 從已發布的選物誌內文照片產生（不含封面與商品卡），不要手改',products};
}

if(import.meta.url===`file://${process.argv[1]}`){
  const data=buildPlayMedia();
  writeFileSync(new URL('everyday/product-media.json',root),JSON.stringify(data,null,1)+'\n');
  console.log(`everyday/product-media.json: ${Object.keys(data.products).length} brands`);
}
