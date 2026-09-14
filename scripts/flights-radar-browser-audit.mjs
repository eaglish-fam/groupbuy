import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve,extname } from 'node:path';
import assert from 'node:assert/strict';
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE??'playwright');
const root=process.cwd();
const server=createServer(async(req,res)=>{
  try {let path=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(path.endsWith('/'))path+='index.html';const file=resolve(root,'.'+path);if(!file.startsWith(root+'/'))throw new Error('path');const data=await readFile(file);res.setHeader('content-type',({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp'})[extname(file)]??'application/octet-stream');res.end(data);}catch{res.statusCode=404;res.end();}
});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const browser=await chromium.launch({executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
const csv=rows=>{const headers=Object.keys(rows[0]);return [headers,...rows.map(r=>headers.map(k=>r[k]))].map(row=>row.map(x=>'"'+String(x??'').replaceAll('"','""')+'"').join(',')).join('\n');};
try {
  for(const width of [390,1440])for(const mature of [false,true]){
    const page=await browser.newPage({viewport:{width,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
    const now=new Date(),history={asOf:now.toISOString(),windows:{30:{mature,observedDays:mature?26:1,min:6000,median:8000,points:[{date:now.toISOString().slice(0,10),price:6000}]}}};
    await page.clock.install({time:now});
    let withdrawn=false, unavailable=false;
    await page.route('https://docs.google.com/spreadsheets/**',async route=>{
      const name=new URL(route.request().url()).searchParams.get('sheet');
      if(name==='機票優惠' && unavailable){await route.fulfill({status:503,body:'unavailable'});return;}
      const data=name==='機票優惠'?csv([{deal_id:'fixture',status:withdrawn?'withdrawn':'published',review_status:'approved',region:'亞洲',origin:'TPE',destination:'NRT',outbound_date:'2027-01-10',inbound_date:'2027-01-14',price_twd:6000,expires_at:new Date(+now+3600000).toISOString(),observed_at:now.toISOString(),search_url:'https://www.aviasales.com/search/test',source:'test',history_json:JSON.stringify(history)}]):'status,title\n';
      await route.fulfill({status:200,contentType:'text/csv',body:data});
    });
    await page.goto('http://127.0.0.1:'+server.address().port+'/trip/');await page.waitForSelector('.deal-card');
    assert.equal(await page.locator('.price-history').count(),mature?1:0);
    if(mature){await page.locator('.price-history summary').click();assert.equal(await page.locator('.price-history table').isVisible(),true);}
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
    assert.deepEqual(errors,[]);
    withdrawn=true;
    await page.clock.fastForward(120001);
    await page.waitForSelector('.deal-card',{state:'detached',timeout:5000});
    withdrawn=false;
    await page.clock.fastForward(120001);
    await page.waitForSelector('.deal-card',{timeout:5000});
    unavailable=true;
    await page.clock.fastForward(120001);
    await page.waitForSelector('.deal-card',{state:'detached',timeout:5000});
    unavailable=false;
    await page.clock.fastForward(120001);
    await page.waitForSelector('.deal-card',{timeout:5000});
    await page.clock.fastForward(3600001);
    assert.equal(await page.locator('.deal-card').count(),0,'An open page must remove expired fares without reload');
    await page.close();console.log(JSON.stringify({width,mature,expiry:'passed',status:'passed'}));
  }
}finally{await browser.close();await new Promise(r=>server.close(r));}
