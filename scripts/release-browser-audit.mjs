import assert from 'node:assert/strict';
import http from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { resolve, extname } from 'node:path';
const root = resolve(import.meta.dirname, '..');
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '/Users/zosia/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
let oldPhase = false;
const oldSW = execFileSync('git', ['show', 'de3f7e7:sw.js'], { cwd: root, encoding: 'utf8' });
const mime = { '.js':'text/javascript', '.css':'text/css', '.html':'text/html', '.svg':'image/svg+xml', '.webp':'image/webp', '.png':'image/png', '.json':'application/json' };
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://local');
  if (oldPhase && url.pathname === '/sw.js') { res.setHeader('Content-Type','text/javascript'); return res.end(oldSW); }
  if (oldPhase && ['/', '/index.html'].includes(url.pathname)) {
    res.setHeader('Content-Type','text/html');
    return res.end('<title>OLD VERSION</title><h1>Old home</h1><script>navigator.serviceWorker.register("/sw.js")</script>');
  }
  let file = resolve(root, '.' + url.pathname);
  if (!file.startsWith(root) || !existsSync(file)) { res.statusCode=404; return res.end(); }
  if (statSync(file).isDirectory()) file=resolve(file,'index.html');
  res.setHeader('Content-Type',mime[extname(file)] || 'application/octet-stream');
  res.setHeader('Cache-Control','no-store');
  res.end(readFileSync(file));
});
await new Promise(r => server.listen(0,'127.0.0.1',r));
const base = 'http://127.0.0.1:' + server.address().port;
const browser = await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const passed=[];
const check=(name,condition)=>{assert.ok(condition,name);passed.push(name);};
const headers=['品牌','連結','類型','開團日期','結束日期','商品描述','圖片網址','影片網址','分類','折扣碼','通路'];
let mode='open', calls=0, newURL='https://example.invalid/new';
const rows=()=>[
 ['Wave 鷹嘴豆泥',newURL,'長期','','','食品口味','/assets/wave/family.webp','https://www.instagram.com/reel/DYewo3syHDp/','食品','',''],
 ['ARTISAN浴室清潔＆小腿按摩器','https://example.invalid/artisan','短期','2026-09-01','2026-09-09','清潔刷','/assets/artisan-cb301/blog-cover-v2.webp','https://youtu.be/bFNLF_Vgn7k','居家','',''],
 ['Atojet 濾芯蓮蓬頭','https://example.invalid/atojet','短期','2026-09-01','2026-09-09','淋浴','/assets/atojet/vendor-shower.webp','https://youtu.be/ntovrIfv6DE','居家','',''],
 ['Meroware 美學育兒用品','https://example.invalid/meroware','長期','','','親子餐具與水壺','/assets/meroware/blog-cover-v1.webp','','母嬰','',''],
 ['同品牌','https://example.invalid/a','長期','','','商品A','/assets/wave/toast.webp','','食品','',''],
 ['同品牌','https://example.invalid/a','折扣碼','','','商品A','/assets/wave/toast.webp','','食品','',''],
 ['同品牌','https://example.invalid/b','長期','','','商品B','/assets/wave/pita.webp','','食品','',''],
 ['歷史優惠','https://example.invalid/expired','已結團','','2026-08-01','過期','','','食品','OLD-CODE',''],
 ['一本書','https://example.invalid/book','書籍','','','書籍','','','','','書店=https://example.invalid/book'],
 ['公益','https://example.invalid/charity','公益','','','公益','','','','','']
];
const csv=data=>data.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\n');
async function fixtures(context){
 await context.route('**/*', async route=>{
   const u=new URL(route.request().url());
   if(u.hostname==='docs.google.com'){
     calls++;
     if(mode==='fail')return route.abort();
     const data=u.searchParams.get('sheet')==='即將開團'?[]:rows().map(r=>mode==='closed'?[...r.slice(0,2),'已結團',...r.slice(3)]:r);
     return route.fulfill({contentType:'text/csv',headers:{'Access-Control-Allow-Origin':'*'},body:csv([headers,...data])});
   }
   if(u.origin===base)return route.continue();
   if(u.hostname==='www.eaglish.store'){
     let file=resolve(root,'.'+u.pathname);
     if(existsSync(file)&&statSync(file).isDirectory())file=resolve(file,'index.html');
     if(!file.startsWith(root)||!existsSync(file))return route.fulfill({status:404,body:''});
     return route.fulfill({contentType:mime[extname(file)]||'application/octet-stream',body:readFileSync(file)});
   }
   if(u.hostname==='www.googletagmanager.com')return route.fulfill({contentType:'text/javascript',body:'/* intercepted: do not send test analytics */'});
   if(['image','font','media'].includes(route.request().resourceType()))return route.abort();
   if(u.hostname==='cdnjs.cloudflare.com')return route.fulfill({contentType:'text/javascript',body:readFileSync(resolve(root,'design/papaparse.min.js'),'utf8')});
   return route.fulfill({contentType:'text/html',body:'External provider omitted in offline test'});
 });
}
try {
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 await fixtures(context);
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.clock.install({time:new Date('2026-09-09T02:00:00Z')});
 await page.addInitScript(()=>{localStorage.setItem('eg_wishlist',JSON.stringify(['Wave 鷹嘴豆泥']));window.sent=[];window.open=()=>({opener:null,document:{},closed:false,location:{replace:u=>window.sent.push(u)},close(){this.closed=true;}});});
 await page.goto(base+'/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelectorAll('#products .product-card').length===6);
 check('utility header does not duplicate the primary navigation',await page.locator('.site-header nav').count()===0);
 check('About follows shopping notice in the content navigation',await page.locator('.content-nav').evaluate(nav=>{
  const labels=[...nav.querySelectorAll('a')].map(link=>link.textContent.trim());
  return labels.indexOf('關於我們')===labels.indexOf('購物須知')+1;
 }));
 check('Meroware product card links to its article',await page.locator('#products .product-card', {hasText:'Meroware 美學育兒用品'}).locator('a.card-reading[href="/blog/meroware/"]').count()===1);
 check('six shopping notices embedded',await page.locator('#original-notice details').count()===6);
 check('no preview copy in production homepage',!await page.locator('.preview-strip').count());
 check('legacy favourite migrated',await page.locator('#saved-count').innerText()==='1');
 check('same brand has distinct product keys',await page.evaluate(()=>new Set(products.filter(p=>p.brand==='同品牌').map(p=>p.key)).size===2));
 check('identical product and coupon row coalesce without disabling product',await page.evaluate(()=>products.filter(p=>p.brand==='同品牌'&&p.description==='商品A').length===1&&products.find(p=>p.brand==='同品牌'&&p.description==='商品A').status.key==='open'));
 await page.evaluate(()=>openDetail(products.findIndex(p=>p.article?.id==='artisan-cb301')));
 check('ARTISAN modal has no wrong video',await page.locator('#product-dialog iframe').count()===0);
 await page.keyboard.press('Escape');
 await page.evaluate(()=>openDetail(products.findIndex(p=>p.brand==='歷史優惠')));
 check('expired coupon not exposed',!(await page.locator('#product-dialog').innerText()).includes('OLD-CODE'));
 await page.keyboard.press('Escape');
 await page.evaluate(()=>{window.auditEvents=[];window.SiteAnalytics.track=(name,data)=>auditEvents.push({name,data});});
 const before=calls;
 await page.locator('#products [data-buy-key]').first().click();
 await page.waitForFunction(()=>window.sent.length===1);
 check('purchase rechecks Sheet',calls>before);
 check('purchase uses new URL',await page.evaluate(()=>sent[0].split('?')[0])===newURL);
 check('outbound tracking preserved',await page.evaluate(()=>new URL(sent[0]).searchParams.get('utm_source'))==='eaglish');
 check('one purchase event',await page.evaluate(()=>auditEvents.filter(e=>e.name==='click_group').length)===1);
 mode='fail';
 await page.evaluate(()=>load());
 check('refresh failure removes purchase CTAs',await page.locator('[data-buy-key]').count()===0);
 mode='open';await page.locator('#retry').click();
 await page.waitForFunction(()=>document.querySelectorAll('#products .product-card').length===6);
 await page.clock.fastForward(86400000);
 await page.waitForFunction(()=>document.querySelectorAll('#products .product-card').length===4);
 check('cross-day expires limited campaigns',await page.locator('#products .product-card').count()===4);
 for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:900});
   await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   check('no horizontal overflow '+width,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 check('no runtime exceptions',errors.length===0);
 await page.goto(base+'/blog/',{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('[data-buy][href]'));
 check('newest blog article appears first',await page.locator('[data-shelf="open"] [data-article]').first().getAttribute('data-article')==='meroware');
 check('every blog shelf remains newest-first',await page.evaluate(()=>[...document.querySelectorAll('[data-shelf]')].every(shelf=>{
   const dates=[...shelf.querySelectorAll('[data-published]')].map(card=>card.dataset.published);
   return dates.every((date,index)=>index===0||dates[index-1]>=date);
 })));
 await page.locator('[data-blog-category="居家"]').click();
 check('blog category filter exposes only matching cards',await page.evaluate(()=>[...document.querySelectorAll('[data-article]')].filter(card=>getComputedStyle(card).display!=='none').every(card=>card.dataset.category==='居家')));
 check('blog category filter has an accessible selected state',await page.locator('[data-blog-category="居家"]').getAttribute('aria-pressed')==='true');
 check('blog category filter is deep-linkable',new URL(page.url()).searchParams.get('category')==='居家');
 await page.locator('[data-blog-category=""]').click();
 check('all articles filter restores every card',await page.evaluate(()=>[...document.querySelectorAll('[data-article]')].every(card=>!card.hidden)));
 mode='fail';
 await page.clock.fastForward(60000);
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await page.waitForFunction(()=>document.querySelector('#freshness').textContent.includes('無法'));
 check('blog failure hides and clears all purchase links',await page.evaluate(()=>[...document.querySelectorAll('[data-buy]')].every(a=>a.hidden&&!a.hasAttribute('href')&&a.getBoundingClientRect().height===0)));
 check('private preview does not initialise GA4',await page.evaluate(()=>typeof gtag==='undefined'));
 await context.close();

 mode='open';
 const production=await browser.newContext({serviceWorkers:'block',viewport:{width:390,height:844}});
 await fixtures(production);
 const prod=await production.newPage();
 await prod.clock.install({time:new Date('2026-09-09T02:00:00Z')});
 await prod.addInitScript(()=>{window.sent=[];window.open=()=>({opener:null,document:{},closed:false,location:{replace:u=>sent.push(u)},close(){this.closed=true;}});});
 await prod.goto('https://www.eaglish.store/',{waitUntil:'domcontentloaded'});
 await prod.waitForFunction(()=>document.querySelectorAll('#products .product-card').length===6);
 check('production config initialised exactly once',await prod.evaluate(()=>dataLayer.filter(x=>x[0]==='config'&&x[1]==='G-7SW2X9B19H').length)===1);
 await prod.locator('#products [data-buy-key]').first().click();
 await prod.waitForFunction(()=>sent.length===1);
 check('production purchase enqueued exactly once',await prod.evaluate(()=>dataLayer.filter(x=>x[0]==='event'&&x[1]==='click_group').length)===1);
 mode='closed';
 await prod.locator('#products [data-buy-key]').first().click();
 await prod.waitForFunction(()=>document.querySelectorAll('#products [data-buy-key]').length===0);
 check('closed campaign does not navigate or emit a conversion',await prod.evaluate(()=>sent.length===1&&dataLayer.filter(x=>x[0]==='event'&&x[1]==='click_group').length===1));
 await production.close();
 mode='open';

 // Real old cache-first worker upgrade, not a string-level check.
 oldPhase=true;
 const upgrade=await browser.newContext();
 const old=await upgrade.newPage();
 await old.goto(base+'/',{waitUntil:'domcontentloaded'});
 await old.evaluate(()=>navigator.serviceWorker.ready);
 await old.waitForFunction(()=>navigator.serviceWorker.controller);
 await old.reload();
 check('old worker controls cached homepage',(await old.title())==='OLD VERSION');
 oldPhase=false;
 await old.evaluate(async()=>{
   const r=await navigator.serviceWorker.getRegistration();
   const changed=new Promise(resolve=>navigator.serviceWorker.addEventListener('controllerchange',resolve,{once:true}));
   await r.update();await changed;
 });
 await old.goto(base+'/',{waitUntil:'domcontentloaded'});
 check('old visitor receives new homepage',(await old.title()).includes('鷹家買物社'));
 check('old caches removed',await old.evaluate(async()=>!(await caches.keys()).includes('eaglish-blog-release-v2')));
 await upgrade.close();
 console.log(JSON.stringify({passed:passed.length,checks:passed},null,2));
} finally {await browser.close();await new Promise(r=>server.close(r));}
