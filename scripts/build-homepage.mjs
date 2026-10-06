import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {createRequire} from 'node:module';
import {readSnapshot,snapshotCards} from './catalog-snapshot.mjs';
import {renderHomepageTravelEntry} from './homepage-travel-entry.mjs';
const require=createRequire(import.meta.url),{catalog,escape}=require('../product-content.js');
const root = new URL('../', import.meta.url);
const release = '20261002-leofoo-booking-sync';
const productMediaRelease = '20261006-fullbleed';
let html = readFileSync(new URL('design/index.html', root), 'utf8');
const firstPick=Object.entries(catalog).filter(([,item])=>item.article&&item.image&&item.title&&/^\d{4}-\d{2}-\d{2}$/.test(item.published||''))
  .sort((a,b)=>b[1].published.localeCompare(a[1].published))[0];
if(!firstPick)throw Error('Missing editorial first pick');
const [pickKey,pick]=firstPick;
const staticPick=`<article class="hero-slide is-active" data-pick-key="${escape(pickKey)}" aria-label="第 1 篇精選文章">
                <a class="hero-image-link" href="${escape(pick.article)}" aria-label="閱讀：${escape(pick.title)}">
                  <img src="${escape(pick.image)}" alt="${escape(pick.brands?.[0]||'選物文章')}：${escape(pick.title)}" fetchpriority="high" width="1600" height="1000" />
                </a>
                <div class="hero-caption" aria-hidden="true"><strong>${escape(pick.title)}</strong></div>
                <span class="photo-index">EDITOR'S PICK / 01</span>
              </article>`;
html=html.replace(/<article class="hero-slide is-active"[\s\S]*?<\/article>/,staticPick);
html = html.replace('lang="zh-Hant"', 'lang="zh-TW"')
  .replace('content="noindex,nofollow"', 'content="index,follow,max-image-preview:large"')
  .replace(/<div class="preview-strip">[\s\S]*?<\/div>/, '')
  .replace('href="./" class="logo"', 'href="/" class="logo"')
  .replaceAll('href="./', 'href="/design/')
  .replaceAll('src="./', 'src="/design/')
  .replace(/content="從餐桌、居家到旅行，跟著鷹式一家發現生活選物、當期團購與真實使用筆記。"/,
    'content="鷹式一家 Eaglish Family 官方團購網站！精選台灣、日韓、歐美優質商品團購，從餐桌好食、親子用品、居家生活到旅行選物，查看當期開團、常駐好物、折扣碼與團購行事曆，也能閱讀選物筆記與鷹家遠行所的親子旅行指南。"')
  .replace('</head>', `<link rel="canonical" href="https://www.eaglish.store/">
    <meta name="google-site-verification" content="FdPBW_xSaPXriw8r-beUzCvUXbh0J4BqT-0ADmKbdSY">
    <meta property="og:site_name" content="鷹家買物社">
    <meta property="og:title" content="鷹家買物社｜把喜歡的日常，帶回家">
    <meta property="og:description" content="當期團購、生活選物筆記與鷹家遠行所旅行指南，從日常到旅途，把喜歡分享給你。">
    <meta property="og:url" content="https://www.eaglish.store/">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="zh_TW">
    <meta property="og:image" content="https://www.eaglish.store/logo-eaglish-text.png">
    <link rel="icon" href="/icons/favicon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
    <link rel="manifest" href="/icons/site.webmanifest">
    <meta name="agd-partner-manual-verification">
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","@id":"https://www.eaglish.store/#organization","name":"鷹家買物社","alternateName":["鷹式一家","Eaglish Family"],"url":"https://www.eaglish.store/","logo":"https://www.eaglish.store/logo-eaglish-text.png"}</script>
  </head>`);
html=html.replace(/<!-- travel-entry:start -->[\s\S]*?<!-- travel-entry:end -->/,renderHomepageTravelEntry());
if(!html.includes('id="travel-entry"'))throw Error('Homepage travel entry insertion failed');
const snapshot=readSnapshot();
html=html.replace('正在讀取最新團購…','商品選購目錄')
 .replace('<div class="product-grid" id="products" aria-busy="true">\n            <div class="loading">正在為你整理今天的好物…</div>\n          </div>',`<div class="product-grid" id="products" aria-busy="false" data-snapshot-date="${snapshot.observedAt.slice(0,10)}">${snapshotCards(snapshot)}</div>`)
 .replace('<p class="source-status" id="source-status" aria-live="polite"></p>',`<p class="source-status" id="source-status" aria-live="polite">先閱讀商品介紹與選購筆記；即時開團狀態載入後更新。目錄整理：${snapshot.observedAt.slice(0,10)}。</p>`);
if(!html.includes('data-snapshot-card'))throw Error('Homepage snapshot insertion failed');
html = html.replace(/((?:src|href)="\/[^"]+\.(?:js|css))(?:\?[^"]*)?"/g, '$1?v=' + release + '"');
html = html.replace(`src="/design/design.js?v=${release}"`, 'src="/design/design.js?v=20261002-leofoo-card-only"');
for (const file of ['design.css','mobile-grid.css','complete-content.css']) {
  html = html.replace(`href="/design/${file}?v=${release}"`, `href="/design/${file}?v=${productMediaRelease}"`);
}
if (html.includes('noindex') || html.includes('獨立設計提案') || !html.includes('id="original-notice"')) throw Error('Invalid production homepage');
writeFileSync(new URL('index.html', root), html.replace(/[ \t]+$/gm, ''));
console.log('Built production homepage from design/index.html');
