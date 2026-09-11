import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {catalog}=require('../product-content.js');
const {chromium}=await import('/Users/zosia/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const base='http://127.0.0.1:8778';
const csv=rows=>rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\n');
let mode='open',calls=0;
const passed=[];
const check=(name,value)=>{assert.ok(value,name);passed.push(name);};
try{
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',serviceWorkers:'block'});
  await context.route('**/*',async route=>{
   const u=new URL(route.request().url());
   if(u.hostname==='docs.google.com'){
    calls++;
    if(mode==='fail')return route.abort();
    return route.fulfill({contentType:'text/csv',headers:{'Access-Control-Allow-Origin':'*'},body:csv([
     ['品牌','連結','類型','開團日期','結束日期'],
     ...Object.values(catalog).map(c=>[c.brands[0],'https://example.invalid/'+c.id,mode==='closed'?'結團':'長期','',''])
    ])});
   }
   if(u.origin===base)return route.continue();
   if(u.hostname==='cdnjs.cloudflare.com')return route.fulfill({contentType:'text/javascript',body:readFileSync(new URL('../design/papaparse.min.js',import.meta.url))});
   if(route.request().resourceType()==='document')return route.fulfill({contentType:'text/html',body:'Test destination'});
   return route.abort();
  });
  const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const c of Object.values(catalog)){
   mode='open';await page.goto(base+c.article);await page.locator('.offer-bar.is-floating').waitFor();
   await page.evaluate(()=>document.fonts.ready);
   check(`${width} ${c.id}: one button`,await page.locator('[data-current-offer]').count()===1);
   check(`${width} ${c.id}: floating visible and reachable`,await page.locator('[data-current-offer]').evaluate(b=>{const r=b.getBoundingClientRect();return r.height>=44&&r.left>=0&&r.right<=innerWidth&&r.bottom<=innerHeight&&r.bottom>innerHeight-80;}));
   check(`${width} ${c.id}: responsive floating placement`,await page.locator('[data-current-offer]').evaluate((b,width)=>{const r=b.getBoundingClientRect();return width<=700?r.width<innerWidth*.8&&r.bottom<=innerHeight-10:r.width<=118&&r.right<=innerWidth-27&&r.bottom<=innerHeight-38;},width));
   check(`${width} ${c.id}: borderless elevated treatment`,await page.locator('[data-current-offer]').evaluate(b=>{const s=getComputedStyle(b);return parseFloat(s.borderTopWidth)===0&&s.boxShadow!=='none'&&s.backgroundImage.includes('gradient');}));
   if(width>700)check(`${width} ${c.id}: compact two-line desktop label`,await page.locator('[data-current-offer]').evaluate(b=>getComputedStyle(b,'::after').content.includes('組合優惠')));
   check(`${width} ${c.id}: no horizontal overflow`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.locator('.offer-slot').evaluate(e=>e.scrollIntoView({block:'center',behavior:'instant'}));
   await page.waitForFunction(()=>!document.querySelector('.offer-bar').classList.contains('is-floating'));
   check(`${width} ${c.id}: original position and no layout jump`,await page.locator('.offer-slot').evaluate(e=>Math.abs(e.getBoundingClientRect().top-e.querySelector('button').getBoundingClientRect().top)<1));
   if(c.id==='playzu')await page.screenshot({path:`/tmp/floating-offer-${width}-docked.png`});
   await page.evaluate(()=>scrollTo({top:document.body.scrollHeight,behavior:'instant'}));
   await page.waitForTimeout(50);
   check(`${width} ${c.id}: footer is not covered`,await page.locator('.offer-bar.is-floating').count()===0);
   await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}));
   await page.locator('.offer-bar.is-floating').waitFor();
   check(`${width} ${c.id}: returns when scrolling upward`,true);
   if(c.id==='playzu')await page.screenshot({path:`/tmp/floating-offer-${width}-floating.png`});
  }
  mode='closed';await page.evaluate(()=>refreshOffer());await page.waitForFunction(()=>!document.querySelector('.offer-bar').classList.contains('is-floating'));
  check(`${width}: closed campaign disabled`,await page.locator('[data-current-offer]').isDisabled());
  mode='fail';await page.evaluate(()=>refreshOffer());
  check(`${width}: failed refresh never floats a stale offer`,await page.locator('.offer-bar.is-floating').count()===0);
  mode='open';await page.evaluate(()=>refreshOffer());await page.locator('.offer-bar.is-floating').waitFor();
  const before=calls;mode='closed';await page.locator('[data-current-offer]').click();
  await page.waitForFunction(()=>document.querySelector('[data-current-offer]').disabled&&!document.querySelector('.offer-bar.is-floating'));
  check(`${width}: click rechecks and blocks newly closed campaign`,calls>before&&page.url().startsWith(base));
  mode='open';await page.evaluate(()=>refreshOffer());await page.locator('.offer-bar.is-floating').waitFor();
  const beforeOpen=calls;await page.locator('[data-current-offer]').click();await page.waitForURL('https://example.invalid/**');
  check(`${width}: open click rechecks then navigates once`,calls===beforeOpen+1);
  check(`${width}: no page errors`,errors.length===0);
  await context.close();
 }
 console.log(JSON.stringify({passed:passed.length,checks:passed},null,2));
}finally{await browser.close();}
