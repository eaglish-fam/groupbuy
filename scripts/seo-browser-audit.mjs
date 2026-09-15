import {createServer} from 'node:http';
import {readFileSync,existsSync,statSync,mkdirSync,writeFileSync} from 'node:fs';
import {resolve,extname} from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE||'/Users/zosia/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const root=resolve(import.meta.dirname,'..'),output='/tmp/eaglish-seo-browser-20260915';
mkdirSync(output,{recursive:true});
const server=createServer((req,res)=>{
 let f=resolve(root,'.'+decodeURI(new URL(req.url,'http://localhost').pathname));
 if(!f.startsWith(root+'/')&&f!==root){res.writeHead(403);return res.end();}
 if(existsSync(f)&&statSync(f).isDirectory())f=resolve(f,'index.html');
 if(!existsSync(f)){res.writeHead(404);return res.end();}
 res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.svg':'image/svg+xml','.png':'image/png'})[extname(f)]||'application/octet-stream');res.end(readFileSync(f));
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({headless:true,executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}),checks=[];
function check(name,ok){assert.ok(ok,name);checks.push(name);}
try{
 for(const js of [false,true]){
  const context=await browser.newContext({javaScriptEnabled:js,viewport:{width:390,height:844},serviceWorkers:'block'});
  await context.route('**/*',route=>new URL(route.request().url()).origin===base?route.continue():route.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base+'/',{waitUntil:'networkidle'});
  for(const width of [320,390,768,1440]){
   await page.setViewportSize({width,height:900});
   if(js)await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   check(`snapshot readable ${js?'offline':'nojs'} ${width}`,await page.locator('[data-snapshot-card]').count()>=11);
   check(`no overflow ${js?'offline':'nojs'} ${width}`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   check(`cards do not overlap ${js?'offline':'nojs'} ${width}`,await page.locator('[data-snapshot-card]').evaluateAll(cards=>{const rs=cards.map(c=>c.getBoundingClientRect());return rs.every((r,i)=>rs.slice(i+1).every(s=>!(r.left<s.right-1&&r.right>s.left+1&&r.top<s.bottom-1&&r.bottom>s.top+1)));}));
  }
  check(`no stale buying links ${js}`,await page.locator('[data-buy-key]').count()===0);
  for(const article of JSON.parse(readFileSync(resolve(root,'content-index.json'),'utf8')).articles)check(`static link ${js} ${article.slug}`,await page.locator(`#products a[href="/blog/${article.slug}/"]`).count()>0);
  if(js){await page.locator('[data-status="long"]').click();check('offline filter does not erase directory',await page.locator('[data-snapshot-card]').count()>=11);check('no offline runtime exceptions',errors.length===0);}
  await page.setViewportSize({width:390,height:844});await page.locator('#products').scrollIntoViewIfNeeded();await page.screenshot({path:output+`/catalog-${js?'offline':'nojs'}.png`});
  for(const path of ['/guides/','/how-we-select/','/blog/caesar-kenting/']){
   await page.goto(base+path,{waitUntil:'networkidle'});
   check(`page ${js} ${path}`,await page.locator('h1').count()===1);
   check(`page no overflow ${js} ${path}`,await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(path==='/guides/')await page.screenshot({path:output+`/guides-${js?'js':'nojs'}.png`,fullPage:true});
  }
  await context.close();
 }
 writeFileSync(output+'/result.json',JSON.stringify({passed:checks.length,checks},null,2));console.log(JSON.stringify({passed:checks.length,screenshots:output}));
}finally{await browser.close();server.close();}
