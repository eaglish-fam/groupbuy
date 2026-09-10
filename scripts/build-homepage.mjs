import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
const root = new URL('../', import.meta.url);
const release = '20260910-editor-picks-v5';
let html = readFileSync(new URL('design/index.html', root), 'utf8');
html = html.replace('lang="zh-Hant"', 'lang="zh-TW"')
  .replace('content="noindex,nofollow"', 'content="index,follow,max-image-preview:large"')
  .replace(/<div class="preview-strip">[\s\S]*?<\/div>/, '')
  .replace('href="./" class="logo"', 'href="/" class="logo"')
  .replaceAll('href="./', 'href="/design/')
  .replaceAll('src="./', 'src="/design/')
  .replace(/content="從餐桌、居家到旅行，跟著鷹式一家發現生活選物、當期團購與真實使用筆記。"/,
    'content="鷹式一家 Eaglish Family 官方團購網站！精選台灣、日韓、歐美優質商品團購，從餐桌好食、親子用品、居家生活到旅行選物，查看當期開團、常駐好物、折扣碼與團購行事曆，也能閱讀鷹家選物誌的使用筆記。"')
  .replace('</head>', `<link rel="canonical" href="https://www.eaglish.store/">
    <meta name="google-site-verification" content="FdPBW_xSaPXriw8r-beUzCvUXbh0J4BqT-0ADmKbdSY">
    <meta property="og:site_name" content="鷹家買物社">
    <meta property="og:title" content="鷹家買物社｜把喜歡的日常，帶回家">
    <meta property="og:description" content="當期團購、常駐好物、折扣碼與鷹家選物誌，從日常出發，把喜歡分享給你。">
    <meta property="og:url" content="https://www.eaglish.store">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="zh_TW">
    <meta property="og:image" content="https://www.eaglish.store/logo-eaglish-text.png">
    <link rel="icon" href="/icons/favicon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
    <link rel="manifest" href="/icons/site.webmanifest">
    <meta name="agd-partner-manual-verification">
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"鷹家買物社","alternateName":["鷹式一家","Eaglish Family"],"url":"https://www.eaglish.store/","logo":"https://www.eaglish.store/logo-eaglish-text.png"}</script>
  </head>`);
html = html.replace(/((?:src|href)="\/[^"]+\.(?:js|css))(?:\?[^"]*)?"/g, '$1?v=' + release + '"');
if (html.includes('noindex') || html.includes('獨立設計提案') || !html.includes('id="original-notice"')) throw Error('Invalid production homepage');
writeFileSync(new URL('index.html', root), html.replace(/[ \t]+$/gm, ''));
console.log('Built production homepage from design/index.html');
