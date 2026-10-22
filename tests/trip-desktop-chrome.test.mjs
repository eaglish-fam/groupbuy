import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {existsSync,readFileSync,statSync} from 'node:fs';
import {extname,resolve} from 'node:path';
import {loadBrowserRuntime} from './browser-runtime.mjs';
const root=resolve(import.meta.dirname,'..');

test('published travel pages: contents list clears the masthead and country photos load a wide enough file',{timeout:90_000},async t=>{
 const runtime=await loadBrowserRuntime();if(!runtime)return t.skip('Playwright is unavailable');
 const mime={'.css':'text/css','.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.woff2':'font/woff2'};
 const server=http.createServer((q,r)=>{let f=resolve(root,'.'+decodeURIComponent(new URL(q.url,'http://x').pathname));if(existsSync(f)&&statSync(f).isDirectory())f=resolve(f,'index.html');if(!f.startsWith(root)||!existsSync(f)){r.statusCode=404;return r.end();}r.setHeader('Content-Type',mime[extname(f)]||'application/octet-stream');r.end(readFileSync(f));});
 await new Promise(d=>server.listen(0,'127.0.0.1',d));const base=`http://127.0.0.1:${server.address().port}`;
 const browser=await runtime.chromium.launch({headless:true,executablePath:runtime.executablePath});
 t.after(async()=>{await browser.close();server.close();});
 for(const width of [1440,1024]){
  const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'});
  await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.fulfill({status:204,body:''}));
  const page=await context.newPage();
  // Non-chapter city guides: the sticky list used to start at 30px, under the 110px masthead.
  for(const path of ['/trip/guides/svalbard-with-kids/','/trip/guides/oslo-with-kids/','/trip/guides/kuala-lumpur-with-kids/']){
   await page.goto(base+path,{waitUntil:'load'});await page.mouse.wheel(0,2600);await page.waitForTimeout(400);
   const hit=await page.evaluate(()=>{const t=document.querySelector('nav[data-reading-nav]');if(getComputedStyle(t).position!=='sticky')return 'static';const a=t.querySelector('a'),r=a.getBoundingClientRect();return document.elementFromPoint(r.left+r.width/2,r.top+r.height/2)?.closest('nav[data-reading-nav] a')===a?'link':'covered';});
   assert.notEqual(hit,'covered',`${path} contents list under the masthead at ${width}`);
  }
  // Country pages: every visible overview/city photo loads a variant at least as wide as it renders.
  for(const [path,city] of [['/trip/norway/','oslo'],['/trip/malaysia/','penang'],['/trip/netherlands/',null]]){
   await page.goto(base+path,{waitUntil:'load'});
   if(city){await page.locator(`.th-tabs [data-country-city="${city}"]`).click();await page.waitForTimeout(300);}
   await page.waitForFunction(()=>[...document.querySelectorAll('.th-photo-trio img, .th-city-photo img')].filter(i=>i.getBoundingClientRect().width>0).every(i=>i.complete&&i.currentSrc));
   const photos=await page.evaluate(()=>[...document.querySelectorAll('.th-photo-trio img, .th-city-photo img')].filter(i=>i.getBoundingClientRect().width>0).map(i=>[Math.round(i.getBoundingClientRect().width),Number(i.currentSrc.match(/-(\d+)\.webp$/)?.[1]),Math.max(...i.srcset.split(',').map(e=>parseInt(e.trim().split(' ')[1])))]));
   assert.ok(photos.length);
   for(const [rendered,variant,widest] of photos)assert.ok(variant>=Math.min(rendered,widest),`${path} photo ${rendered}px wide loads ${variant}w at ${width}`);
  }
  await context.close();
 }
});
