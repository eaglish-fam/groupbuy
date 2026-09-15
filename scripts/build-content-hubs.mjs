import {readFileSync,writeFileSync,mkdirSync,readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {createHash} from 'node:crypto';
import {articleIdentity} from './content-identity.mjs';
const require=createRequire(import.meta.url),{catalog,escape:e}=require('../product-content.js');
const root=new URL('../',import.meta.url),origin='https://www.eaglish.store';
const clusters=JSON.parse(readFileSync(new URL('config/content-clusters.json',root),'utf8')).clusters;
const metadata=JSON.parse(readFileSync(new URL('config/content-articles.json',root),'utf8'));
if(metadata.version!==1||!metadata.articles||Array.isArray(metadata.articles))throw Error('Invalid content article metadata');
const entries=Object.values(catalog);
const articles=readdirSync(new URL('blog/',root),{withFileTypes:true}).filter(x=>x.isDirectory()).flatMap(x=>{
 let html;try{html=readFileSync(new URL(`blog/${x.name}/index.html`,root),'utf8');}catch{return [];}
 const entry=entries.find(p=>p.article===`/blog/${x.name}/`);
 const identity=articleIdentity(x.name,entry,metadata.articles[x.name]);
 const schema=[...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].flatMap(m=>{const v=JSON.parse(m[1]);return v['@graph']||[v];}).find(v=>v['@type']==='Article');
 const cluster=clusters.find(c=>c.articles.includes(x.name));
 const links=cluster?.articles.filter(slug=>slug!==x.name).map(slug=>entries.find(p=>p.article===`/blog/${slug}/`)).filter(Boolean)||[];
 const related=`<!-- related-reading:start --><nav class="related-reading" aria-label="延伸選購筆記"><h2>接著，從你的需要繼續挑</h2><p><a href="/guides/${cluster?'#'+cluster.id:''}">${e(cluster?.title||'選購指南')}</a> · <a href="/how-we-select/">我們怎麼選物</a>${entry?` · <a href="/#product-${e(entry.id)}">回到${e(entry.brands[0])}商品介紹</a>`:''}</p><ul>${links.map(p=>`<li><a href="${p.article}">${e(p.brands[0])}｜${e(p.title)}</a></li>`).join('')}</ul></nav><!-- related-reading:end -->`;
 html=html.replace(/<!-- related-reading:start -->[\s\S]*?<!-- related-reading:end -->/g,'');
 if(!html.includes('</main>'))throw Error('Missing article main: '+x.name);
 html=html.replace('</main>',related+'</main>');
 if(!html.includes('content-hubs.css'))html=html.replace('</head>','<link rel="stylesheet" href="/content-hubs.css?v=20260915">\n</head>');
 writeFileSync(new URL(`blog/${x.name}/index.html`,root),html);
 return [{slug:x.name,url:origin+`/blog/${x.name}/`,title:html.match(/<title>(.*?)<\/title>/s)?.[1]||entry?.title,
  ...identity,
  topics:schema?.keywords||[],cluster:cluster?.id||null,published:schema?.datePublished,modified:schema?.dateModified,
  sourceHash:createHash('sha256').update(html).digest('hex')}];
});
const manifest={version:1,origin,articles};
writeFileSync(new URL('content-index.json',root),JSON.stringify(manifest,null,2)+'\n');
const shell=(path,title,description,body)=>`<!doctype html><html lang="zh-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${e(title)}｜鷹家選物誌</title><meta name="description" content="${e(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${origin}${path}"><meta property="og:url" content="${origin}${path}"><meta property="og:title" content="${e(title)}｜鷹家選物誌"><meta property="og:description" content="${e(description)}"><meta property="og:type" content="website"><meta property="og:image" content="${origin}/logo-eaglish-text.png"><link rel="stylesheet" href="/content-hubs.css?v=20260915"><script src="/site-runtime.js" defer></script><script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':path==='/guides/'?'CollectionPage':'AboutPage',url:origin+path,name:title,inLanguage:'zh-TW',publisher:{'@type':'Organization',name:'鷹式一家',url:origin+'/'}})}</script></head><body class="guide-page"><header><a href="/">鷹家買物社</a><nav aria-label="網站導覽"><a href="/blog/">選物誌</a><a href="/guides/">選購指南</a><a href="/how-we-select/">我們怎麼選物</a></nav></header><main><h1>${e(title)}</h1>${body}</main><footer><a href="/#catalog">回到商品目錄 →</a></footer></body></html>`;
const guide=`<p class="lead">不用先記住品牌。先找到你正在解決的問題，再進入對應的選購筆記。</p><nav aria-label="選購主題">${clusters.map(c=>`<a href="#${c.id}">${e(c.title)}</a>`).join(' · ')}</nav>${clusters.map(c=>`<section id="${c.id}"><h2>${e(c.title)}</h2><h3>${e(c.question)}</h3><p>${e(c.answer)}</p><ul class="guide-cards">${c.articles.map(slug=>entries.find(p=>p.article===`/blog/${slug}/`)).filter(Boolean).map(p=>`<li><a href="${p.article}"><h3>${e(p.brands[0])}</h3><p>${e(p.excerpt)}</p><span>閱讀完整選購筆記 →</span></a></li>`).join('')}</ul></section>`).join('')}<p>想知道照片與規格怎麼整理？<a href="/how-we-select/">看看我們的選物方式</a>。</p>`;
const about=`<p class="lead">我們希望選物誌不只是告訴你「有什麼可以買」，也幫你判斷「什麼才適合現在的生活」。</p><section><h2>先看問題，再看商品</h2><p>年齡、使用空間、同行人數、喜歡的口味，都可能比品項名稱更重要。文章會整理用途、差異與限制，讓你先縮小選擇，而不是每件都推薦。</p></section><section><h2>生活紀錄與廠商資料，分開說明</h2><p>像 Playzu 的家中照片、Ki ET LA 的舟夏配戴紀錄，以及墾丁凱撒的旅行影片，是文章中的真實生活素材。其他房型或品項可能使用飯店與廠商圖片；有照片不代表每款都親自使用過。無法核對的款式、測試與使用心得，不應當成確定資訊。</p><p><a href="/blog/playzu/">看我們家的地墊紀錄</a> · <a href="/blog/kietla-kids-sunglasses/">看真實配戴照片</a> · <a href="/blog/caesar-kenting/">看選房筆記與旅行影片</a></p></section><section><h2>規格用來比較，不用來替代需求</h2><p>尺寸、容量、適用年齡和方案條件，依文章列出的商品或官方來源整理。看似相近的兩個數值，可能採不同測量條件；無法用相同基準比較時，會保留差異，不把推測寫成規格。</p></section><section><h2>團購合作與當期條件</h2><p>本站提供團購合作商品與選購內容，購買入口會連到廠商賣場。付款、配送、取消和售後依各賣場規則。舊文中的活動案例不等於現在的價格；選好當期品項、日期與人數後，請再次確認訂單總額與條件。</p></section><section><h2>工具協助整理，內容仍需要核對</h2><p>我們使用 AI 協助整理資料與規劃閱讀方式。真實產品圖片、引用來源、數字與文章內容仍須核對，不能用生成圖冒充使用紀錄。選物誌統一以「鷹式一家」為作者；文章上的更新日期代表內容更新，不表示每次開團都重新測試過所有商品。</p></section><section><h2>看到錯誤或有不同經驗？</h2><p>可以透過<a href="https://www.instagram.com/eaglish.family/" rel="noopener noreferrer" target="_blank">鷹式一家 Instagram</a>回饋，附上文章連結和需要確認的段落，讓我們知道要核對哪一筆資料。</p></section>`;
for(const [path,title,desc,body] of [['/guides/','從問題開始，找到適合你的選購方向','從親子用品、飯店住宿、餐桌送禮到居家清潔，先辨認使用需求，再閱讀鷹式一家整理的商品比較、真實紀錄與選購筆記。',guide],['/how-we-select/','我們怎麼選物','鷹家選物誌如何整理真實生活照片、廠商規格與團購條件：區分親身使用、來源資訊與推論，幫助讀者做出適合自己的選擇。',about]]){
 mkdirSync(new URL(path.slice(1),root),{recursive:true});writeFileSync(new URL(path.slice(1)+'index.html',root),shell(path,title,desc,body));
}
console.log(`Built 2 reading hubs, ${articles.length} reciprocal article links and source-hashed content index`);
